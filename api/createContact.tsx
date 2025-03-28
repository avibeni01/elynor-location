import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Méthode non autorisée' });
  }

  const HUBSPOT_API_KEY = process.env.VITE_HUBSPOT_API_KEY;

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
      nationalite,
    } = req.body;

    console.log('🟢 Données reçues pour création de contact:', req.body);

    // 🔍 Vérifie si le contact existe déjà
    const searchRes = await fetch(
      `https://api.hubapi.com/crm/v3/objects/contacts/search`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${HUBSPOT_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filterGroups: [
            {
              filters: [
                {
                  propertyName: 'email',
                  operator: 'EQ',
                  value: email,
                },
              ],
            },
          ],
          properties: ['email'],
        }),
      }
    );

    const searchData = await searchRes.json();

    if (searchData?.results?.length > 0) {
      const existingContactId = searchData.results[0].id;
      console.log('🟡 Contact déjà existant. ID :', existingContactId);
      return res.status(200).json({ success: true, contactId: existingContactId });
    }

    // ✳️ Créer le contact s'il n'existe pas
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
          nationalite,
        },
      }),
    });

    const contactData = await contactRes.json();

    if (!contactRes.ok) {
      console.error('🔴 Erreur création contact:', contactData);
      return res.status(contactRes.status).json({
        error: 'Erreur création contact',
        detail: contactData,
      });
    }

    console.log('✅ Contact créé avec succès:', contactData.id);
    
    return res.status(200).json({ success: true, contactId: contactData.id });

  } catch (error: any) {
    console.error('❌ Erreur générale création contact:', error.message);
    return res.status(500).json({
      error: 'Erreur générale HubSpot',
      detail: error.message,
    });
  }
}