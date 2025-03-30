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
      stationName,
      pickupDate,
      pickupTime,
      returnDate,
      returnTime,
      driverAge,
      hasVisa,
      shomer_shabbat,
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
      
      // Pour les dates d'hôtel, utiliser une approche similaire à celle des voitures
      if (dates?.[0]) {
        // Pour éviter tout problème de fuseau horaire, extraire les composants de date
        const checkInDate = new Date(dates[0]);
        const year = checkInDate.getFullYear();
        const month = checkInDate.getMonth();
        const day = checkInDate.getDate();
        
        // Utiliser midi (12:00) pour éviter tout changement de jour dû au fuseau horaire
        dealProperties.check_in_date = Date.UTC(year, month, day, 12, 0, 0);
      } else {
        dealProperties.check_in_date = null;
      }
      
      if (dates?.[1]) {
        const checkOutDate = new Date(dates[1]);
        const year = checkOutDate.getFullYear();
        const month = checkOutDate.getMonth();
        const day = checkOutDate.getDate();
        
        // Utiliser midi (12:00) pour éviter tout changement de jour dû au fuseau horaire
        dealProperties.check_out_date = Date.UTC(year, month, day, 12, 0, 0);
      } else {
        dealProperties.check_out_date = null;
      }
      
      // Add hotel specific properties
      if (occupants) {
        dealProperties.hotel_rooms = occupants.rooms;
        dealProperties.hotel_adults = occupants.adults;
        dealProperties.hotel_children = occupants.children;
        dealProperties.hotel_children_ages = occupants.childrenAges?.join(', ') || ''; 
      }
      if (rating) {
        dealProperties.hotel_rating_preference = rating;
      }
      if (selectedOptions) {
        dealProperties.hotel_option_pool = selectedOptions.pool; 
        dealProperties.hotel_option_breakfast = selectedOptions.breakfast;
        dealProperties.hotel_option_near_beach = selectedOptions.nearBeach;
        dealProperties.hotel_specific_request = selectedOptions.specificHotel === null ? 'Non spécifié' : (selectedOptions.specificHotel ? 'Oui' : 'Non');
      }

    } else { // 'car'
      dealProperties.vehicle = selectedVehicle?.["Nom du véhicule"] || 'Non spécifié';
      dealProperties.destination = stationName || 'Non précisé';
      
      // Pour les dates de voiture, utiliser la même approche avec l'heure à midi
      if (pickupDate) {
        const parts = pickupDate.split('/'); // [dd, mm, yyyy]
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const monthIndex = parseInt(parts[1], 10) - 1; // Month is 0-indexed
          const year = parseInt(parts[2], 10);
          if (!isNaN(day) && !isNaN(monthIndex) && !isNaN(year)) {
            // Utiliser midi (12:00) pour éviter tout changement de jour dû au fuseau horaire
            dealProperties.check_in_date = Date.UTC(year, monthIndex, day, 12, 0, 0);
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
             // Utiliser midi (12:00) pour éviter tout changement de jour dû au fuseau horaire
             dealProperties.check_out_date = Date.UTC(year, monthIndex, day, 12, 0, 0);
           }
         }
      }
      
      // Informations supplémentaires
      if (pickupTime) dealProperties.pickup_time = pickupTime;
      if (returnTime) dealProperties.return_time = returnTime;
      if (driverAge) dealProperties.driver_age = driverAge;
      if (hasVisa !== undefined) dealProperties.has_visa_premier = hasVisa; 
      if (shomer_shabbat !== undefined) dealProperties.shomer_shabbat = shomer_shabbat;
    }

    // Journaliser les dates traitées pour le débogage
    console.log('[CreateDeal] Dates traitées:', {
      check_in_date: dealProperties.check_in_date ? new Date(dealProperties.check_in_date).toISOString() : null,
      check_out_date: dealProperties.check_out_date ? new Date(dealProperties.check_out_date).toISOString() : null
    });

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