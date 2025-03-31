import type { NextApiRequest, NextApiResponse } from 'next';

// Helper function to convert yyyy-mm-dd string to UTC midnight timestamp
const dateStringToUTCMidnightTimestamp = (dateStr: string | null | undefined): number | null => {
  if (!dateStr) return null;
  try {
    const parts = dateStr.split('-'); // [yyyy, mm, dd]
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const monthIndex = parseInt(parts[1], 10) - 1; // Month is 0-indexed
      const day = parseInt(parts[2], 10);
      if (!isNaN(day) && !isNaN(monthIndex) && !isNaN(year)) {
        // Validate month and day ranges (basic check)
        if (monthIndex >= 0 && monthIndex <= 11 && day >= 1 && day <= 31) {
           return Date.UTC(year, monthIndex, day);
        }
      }
    }
    console.warn('[CreateDeal] Invalid date string format received:', dateStr);
    return null;
  } catch (error) {
    console.error('[CreateDeal] Error parsing date string:', dateStr, error);
    return null;
  }
};


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const HUBSPOT_API_KEY = process.env.VITE_HUBSPOT_API_KEY;
  if (!HUBSPOT_API_KEY) {
    return res.status(500).json({ error: 'Clé HubSpot manquante' });
  }

  try {
    // Destructure all possible fields from the frontend payload
    const {
      contactId,
      firstName,
      lastName,
      activeTab,
      // Common potentially used fields (might be null/undefined depending on tab)
      destination,     // Hotel destination
      selectedVehicle, // Car vehicle object
      stationName,     // Car station name
      pickupTime,      // Car pickup time
      returnTime,      // Car return time
      driverAge,       // Car driver age
      hasVisa,         // Car visa info
      shomer_shabbat,  // Car shabbat info
      occupants,       // Hotel occupants object
      rating,          // Hotel rating
      selectedOptions, // Hotel options object (pool, breakfast, nearBeach)
      souhaite_hotel_en_particulier, // New field for specific hotel name
      // Standardized date strings (yyyy-mm-dd) sent from frontend
      check_in_date_str,
      check_out_date_str
    } = req.body;

    console.log('[CreateDeal] Reçu:', req.body);

    const pipelineId = activeTab === 'hotel' ? 'default' : '1389997300';

    // Initialize deal properties
    const dealProperties: Record<string, any> = {
      dealname: `${firstName} ${lastName} - ${activeTab === 'hotel' ? 'Réservation Hôtel' : 'Location Voiture'}`,
      pipeline: pipelineId,
      dealstage: activeTab === 'hotel' ? 'appointmentscheduled' : '1896499449',
      amount: '0', 
    };

    // --- Date Processing (Common for both tabs) ---
    // Convert yyyy-mm-dd strings to UTC midnight timestamps for HubSpot
    dealProperties.check_in_date = dateStringToUTCMidnightTimestamp(check_in_date_str);
    dealProperties.check_out_date = dateStringToUTCMidnightTimestamp(check_out_date_str);
    // --- End Date Processing ---

    if (activeTab === 'hotel') {
      dealProperties.destination = destination || 'Non précisé';
      
      // Add hotel specific properties
      if (occupants) {
        dealProperties.hotel_rooms = occupants.rooms;
        dealProperties.hotel_adults = occupants.adults;
        dealProperties.hotel_children = occupants.children; // 2-17 ans
        dealProperties.hotel_babies = occupants.babies;     // 0-2 ans
        dealProperties.hotel_children_ages = occupants.childrenAges?.join(', ') || ''; // Ages for 2-17
      }
      if (rating !== undefined && rating !== null) { // Check for 0 rating explicitly if needed
        dealProperties.hotel_rating_preference = rating;
      }
      if (selectedOptions) {
        dealProperties.hotel_option_pool = selectedOptions.pool ?? false; // Default to false if undefined
        dealProperties.hotel_option_breakfast = selectedOptions.breakfast ?? false;
        dealProperties.hotel_option_near_beach = selectedOptions.nearBeach ?? false;
      }
      // Map the new field to the corresponding HubSpot property
      // Assuming the HubSpot property name is 'souhaite_hotel_en_particulier'
      dealProperties.souhaite_hotel_en_particulier = souhaite_hotel_en_particulier || null; // Send null if empty/null/undefined

    } else { // 'car'
      dealProperties.vehicle = selectedVehicle?.["Nom du véhicule"] || 'Non spécifié';
      dealProperties.destination = stationName || 'Non précisé'; // Use station name for car destination field

      // Add car specific properties (excluding dates, already handled)
      if (pickupTime) dealProperties.pickup_time = pickupTime;
      if (returnTime) dealProperties.return_time = returnTime;
      if (driverAge) dealProperties.driver_age = driverAge;
      if (hasVisa !== undefined) dealProperties.has_visa_premier = hasVisa;
      if (shomer_shabbat !== undefined) dealProperties.shomer_shabbat = shomer_shabbat;
    }

    // Log final properties being sent (excluding sensitive ones if necessary)
    console.log('[CreateDeal] Propriétés envoyées à HubSpot:', dealProperties);

    // --- HubSpot API Call ---
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
