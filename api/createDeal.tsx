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
      dates, // Pour l'hôtel
      selectedVehicle, // Pour la voiture
      stationName,     // Pour la voiture
      pickupDate,      // Pour la voiture (format dd/mm/yyyy attendu du frontend)
      pickupTime,      // Pour la voiture
      returnDate,      // Pour la voiture (format dd/mm/yyyy attendu du frontend)
      returnTime,      // Pour la voiture
      driverAge,       // Pour la voiture
      hasVisa,         // Pour la voiture
      shomer_shabbat,  // Pour la voiture
      occupants,       // Pour l'hôtel
      rating,          // Pour l'hôtel
      selectedOptions  // Pour l'hôtel
    } = req.body;

    console.log('[CreateDeal] Reçu:', req.body);

    const pipelineId = activeTab === 'hotel' ? 'default' : '1389997300';

    const dealProperties: Record<string, any> = {
      dealname: `${firstName} ${lastName} - ${activeTab === 'hotel' ? 'Réservation Hôtel' : 'Location Voiture'}`,
      pipeline: pipelineId,
      dealstage: activeTab === 'hotel' ? 'appointmentscheduled' : '1896499449',
      amount: '0', // HubSpot attend souvent une string pour les montants
    };

    if (activeTab === 'hotel') {
      dealProperties.destination = destination || 'Non précisé';

      // --- MODIFICATION HOTEL CHECK-IN DATE ---
      // Formatter en YYYY-MM-DD si la date existe
      if (dates?.[0]) {
        try {
          const checkInDate = new Date(dates[0]);
          // Vérifier si la date est valide après la conversion
          if (!isNaN(checkInDate.getTime())) {
              const year = checkInDate.getFullYear();
              // getMonth() est 0-indexé, donc +1. padStart assure le format MM/DD.
              const month = (checkInDate.getMonth() + 1).toString().padStart(2, '0');
              const day = checkInDate.getDate().toString().padStart(2, '0');
              dealProperties.check_in_date = `${year}-${month}-${day}`;
          } else {
             console.warn('[CreateDeal] Invalid check_in_date received for hotel:', dates[0]);
             dealProperties.check_in_date = null; // ou gérer l'erreur autrement
          }
        } catch (error) {
            console.error('[CreateDeal] Error parsing check_in_date for hotel:', dates[0], error);
            dealProperties.check_in_date = null; // Sécurité
        }
      } else {
        dealProperties.check_in_date = null;
      }
      // --- FIN MODIFICATION HOTEL CHECK-IN DATE ---

      // --- MODIFICATION HOTEL CHECK-OUT DATE ---
      // Formatter en YYYY-MM-DD si la date existe
      if (dates?.[1]) {
         try {
           const checkOutDate = new Date(dates[1]);
           if (!isNaN(checkOutDate.getTime())) {
               const year = checkOutDate.getFullYear();
               const month = (checkOutDate.getMonth() + 1).toString().padStart(2, '0');
               const day = checkOutDate.getDate().toString().padStart(2, '0');
               dealProperties.check_out_date = `${year}-${month}-${day}`;
           } else {
               console.warn('[CreateDeal] Invalid check_out_date received for hotel:', dates[1]);
               dealProperties.check_out_date = null;
           }
         } catch (error) {
            console.error('[CreateDeal] Error parsing check_out_date for hotel:', dates[1], error);
            dealProperties.check_out_date = null;
         }
      } else {
        dealProperties.check_out_date = null;
      }
      // --- FIN MODIFICATION HOTEL CHECK-OUT DATE ---

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

      // --- MODIFICATION VOITURE PICKUP DATE ---
      // Convertir "dd/mm/yyyy" en "yyyy-mm-dd"
      if (pickupDate) {
        const parts = pickupDate.split('/'); // [dd, mm, yyyy]
        if (parts.length === 3 && parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
          // Vérification basique du format
           const day = parts[0];
           const month = parts[1];
           const year = parts[2];
           // Valider les nombres si nécessaire avant de formater
           if (!isNaN(parseInt(day)) && !isNaN(parseInt(month)) && !isNaN(parseInt(year))) {
               dealProperties.check_in_date = `${year}-${month}-${day}`;
           } else {
               console.warn('[CreateDeal] Invalid pickupDate format received:', pickupDate);
               dealProperties.check_in_date = null;
           }
        } else {
            console.warn('[CreateDeal] Unexpected pickupDate format received:', pickupDate);
            dealProperties.check_in_date = null;
        }
      } else {
          dealProperties.check_in_date = null;
      }
      // --- FIN MODIFICATION VOITURE PICKUP DATE ---

      // --- MODIFICATION VOITURE RETURN DATE ---
      // Convertir "dd/mm/yyyy" en "yyyy-mm-dd"
       if (returnDate) {
        const parts = returnDate.split('/'); // [dd, mm, yyyy]
        if (parts.length === 3 && parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
           const day = parts[0];
           const month = parts[1];
           const year = parts[2];
           if (!isNaN(parseInt(day)) && !isNaN(parseInt(month)) && !isNaN(parseInt(year))) {
              dealProperties.check_out_date = `${year}-${month}-${day}`;
           } else {
               console.warn('[CreateDeal] Invalid returnDate format received:', returnDate);
               dealProperties.check_out_date = null;
           }
        } else {
            console.warn('[CreateDeal] Unexpected returnDate format received:', returnDate);
            dealProperties.check_out_date = null;
        }
      } else {
          dealProperties.check_out_date = null;
      }
      // --- FIN MODIFICATION VOITURE RETURN DATE ---

      // Informations supplémentaires
      if (pickupTime) dealProperties.pickup_time = pickupTime;
      if (returnTime) dealProperties.return_time = returnTime;
      if (driverAge) dealProperties.driver_age = driverAge;
      if (hasVisa !== undefined) dealProperties.has_visa_premier = hasVisa;
      if (shomer_shabbat !== undefined) dealProperties.shomer_shabbat = shomer_shabbat;
    }

    // Journaliser les dates traitées pour le débogage
    console.log('[CreateDeal] Dates formatées pour HubSpot:', {
      check_in_date: dealProperties.check_in_date,
      check_out_date: dealProperties.check_out_date
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
            types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 3 }], // Contact to Deal
          },
        ],
      }),
    });

    const dealData = await dealRes.json();

    if (!dealRes.ok) {
      console.error('[CreateDeal] Erreur HubSpot API:', dealData);
      // Essayez de fournir un message plus spécifique si possible
      const errorMessage = dealData?.message || 'Erreur création deal';
      const errorDetails = dealData?.errors || dealData;
      return res.status(dealRes.status || 500).json({
        error: errorMessage,
        detail: errorDetails,
        status: dealRes.status
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
      error: 'Erreur générale serveur (deal)',
      detail: error.message,
    });
  }
}