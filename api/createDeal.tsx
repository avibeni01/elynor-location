import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const HUBSPOT_API_KEY = process.env.VITE_HUBSPOT_API_KEY;
  if (!HUBSPOT_API_KEY) {
    return res.status(500).json({ error: 'Clé HubSpot manquante' });
  }

  try {
    const {
      contactId,
      firstName,
      lastName,
      activeTab,
      destination,
      dates,
      selectedVehicle,
      stationName, // Changed from station
      pickupDate,
      pickupTime,
      returnDate,
      returnTime,
      driverAge,
      hasVisa,
      shomer_shabbat, // Renamed from shabbatRestriction
      // Hotel specific data
      occupants, 
      rating, 
      selectedOptions 
    } = req.body;

    console.log('[CreateDeal] Reçu:', req.body);

    const pipelineId = activeTab === 'hotel' ? 'default' : '1389997300';

    const dealProperties: Record<string, any> = {
      dealname: `${firstName} ${lastName} - ${activeTab === 'hotel' ? 'Réservation Hôtel' : 'Location Voiture'}`,
      pipeline: pipelineId,
      dealstage: activeTab === 'hotel' ? 'appointmentscheduled' : '1896499449',
      amount: '0',
    };

    if (activeTab === 'hotel') {
      dealProperties.destination = destination || 'Non précisé';
      // Convert ISO date strings to UTC noon timestamps to avoid timezone issues
      if (dates?.[0]) {
        const checkInDate = new Date(dates[0]);
        // Use noon UTC
        dealProperties.check_in_date = Date.UTC(checkInDate.getUTCFullYear(), checkInDate.getUTCMonth(), checkInDate.getUTCDate(), 12, 0, 0); 
      } else {
        dealProperties.check_in_date = null;
      }
      if (dates?.[1]) {
        const checkOutDate = new Date(dates[1]);
        // Use noon UTC
        dealProperties.check_out_date = Date.UTC(checkOutDate.getUTCFullYear(), checkOutDate.getUTCMonth(), checkOutDate.getUTCDate(), 12, 0, 0);
      } else {
        dealProperties.check_out_date = null;
      }
      
      // Add hotel specific properties
      if (occupants) {
        dealProperties.hotel_rooms = occupants.rooms;
        dealProperties.hotel_adults = occupants.adults;
        dealProperties.hotel_children = occupants.children;
        // Optionally format children ages into a string or separate properties if needed
        dealProperties.hotel_children_ages = occupants.childrenAges?.join(', ') || ''; 
      }
      if (rating) {
        dealProperties.hotel_rating_preference = rating;
      }
      if (selectedOptions) {
        // Envoyer directement les valeurs booléennes pour les propriétés de type case à cocher
        dealProperties.hotel_option_pool = selectedOptions.pool; 
        dealProperties.hotel_option_breakfast = selectedOptions.breakfast;
        dealProperties.hotel_option_near_beach = selectedOptions.nearBeach;
        // Pour specificHotel, on peut garder Oui/Non/Non spécifié si ce n'est pas une case à cocher booléenne
        dealProperties.hotel_specific_request = selectedOptions.specificHotel === null ? 'Non spécifié' : (selectedOptions.specificHotel ? 'Oui' : 'Non');
      }

    } else { // 'car'
      dealProperties.vehicle = selectedVehicle?.["Nom du véhicule"] || 'Non spécifié';
      dealProperties.destination = stationName || 'Non précisé'; // Use stationName here
      
      // Dates et heures de prise en charge et de retour
      // Convert 'dd/mm/yyyy' strings to UTC midnight timestamps
      if (pickupDate) {
        const parts = pickupDate.split('/'); // [dd, mm, yyyy]
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const monthIndex = parseInt(parts[1], 10) - 1; // Month is 0-indexed
          const year = parseInt(parts[2], 10);
          if (!isNaN(day) && !isNaN(monthIndex) && !isNaN(year)) {
            dealProperties.check_in_date = Date.UTC(year, monthIndex, day);
          }
        }
      }
      
      if (returnDate) {
         const parts = returnDate.split('/'); // [dd, mm, yyyy]
         if (parts.length === 3) {
           const day = parseInt(parts[0], 10);
           const monthIndex = parseInt(parts[1], 10) - 1; // Month is 0-indexed
           const year = parseInt(parts[2], 10);
           if (!isNaN(day) && !isNaN(monthIndex) && !isNaN(year)) {
             dealProperties.check_out_date = Date.UTC(year, monthIndex, day);
           }
         }
      }
      
      // Informations supplémentaires
      if (pickupTime) dealProperties.pickup_time = pickupTime;
      if (returnTime) dealProperties.return_time = returnTime;
      if (driverAge) dealProperties.driver_age = driverAge;
      // Envoyer directement les valeurs booléennes pour les propriétés de type case à cocher
      if (hasVisa !== undefined) dealProperties.has_visa_premier = hasVisa; 
      if (shomer_shabbat !== undefined) dealProperties.shomer_shabbat = shomer_shabbat; // Renamed property
    }

    const dealRes = await fetch('https://api.hubapi.com/crm/v3/objects/deals', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HUBSPOT_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: dealProperties,
        associations: [
          {
            to: { id: contactId },
            types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 3 }],
          },
        ],
      }),
    });

    const dealData = await dealRes.json();

    if (!dealRes.ok) {
      console.error('[CreateDeal] Erreur:', dealData);
      return res.status(500).json({ 
        error: 'Erreur création deal', 
        detail: dealData 
      });
    }

    console.log('[CreateDeal] Succès:', dealData.id);

    return res.status(200).json({
      success: true,
      dealId: dealData.id,
    });

  } catch (error: any) {
    console.error('[CreateDeal] Exception:', error);
    return res.status(500).json({
      error: 'Erreur générale HubSpot (deal)',
      detail: error.message,
    });
  }
}
