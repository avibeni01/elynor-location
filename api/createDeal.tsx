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
      station,
      pickupDate,
      pickupTime,
      returnDate,
      returnTime,
      driverAge,
      hasVisa,
      shomer_shabbat // Renamed from shabbatRestriction
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
      dealProperties.check_in_date = dates?.[0] ? new Date(dates[0]).setUTCHours(0, 0, 0, 0) : null;
      dealProperties.check_out_date = dates?.[1] ? new Date(dates[1]).setUTCHours(0, 0, 0, 0) : null;

    } else {
      dealProperties.vehicle = selectedVehicle?.["Nom du véhicule"] || 'Non spécifié';
      dealProperties.destination = station || 'Non précisé';
      
      // Dates et heures de prise en charge et de retour
      if (pickupDate) {
        const pickupDateObj = new Date(pickupDate.split('/').reverse().join('-'));
        dealProperties.check_in_date = pickupDateObj.setUTCHours(0, 0, 0, 0);
      }
      
      if (returnDate) {
        const returnDateObj = new Date(returnDate.split('/').reverse().join('-'));
        dealProperties.check_out_date = returnDateObj.setUTCHours(0, 0, 0, 0);
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
