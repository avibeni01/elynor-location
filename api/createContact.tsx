import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const HUBSPOT_API_KEY = process.env.HUBSPOT_API_KEY;
  if (!HUBSPOT_API_KEY) {
    return res.status(500).json({ error: 'Clé HubSpot manquante' });
  }

  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      preferences_client,
      le_v_hicule_ne_roule_pas_le_chabat,
      avez_vous_une_visa_premi_re_,
      age,
      nationalite
    } = req.body;

    console.log('Envoi création contact HubSpot...');

    const contactRes = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HUBSPOT_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          firstname: firstName,
          lastname: lastName,
          email,
          phone,
          preferences_client,
          le_v_hicule_ne_roule_pas_le_chabat,
          avez_vous_une_visa_premi_re_,
          age,
          nationalite
        },
      }),
    });

    const contactData = await contactRes.json();
    console.log('Réponse création contact:', contactData);

    if (!contactRes.ok) {
      return res.status(contactRes.status).json({ 
        error: 'Erreur création contact', 
        detail: contactData 
      });
    }

    return res.status(200).json({ 
      success: true, 
      contactId: contactData.id 
    });
  } catch (error: any) {
    console.error('Erreur générale Contact:', error);
    return res.status(500).json({ 
      error: 'Erreur serveur', 
      detail: error.message 
    });
  }
}