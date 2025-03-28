export default async function handler(req: Request): Promise<Response> {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ message: 'Method not allowed' }), { status: 405 });
    }
  
    const HUBSPOT_API_KEY = process.env.VITE_HUBSPOT_API_KEY;
    if (!HUBSPOT_API_KEY) {
      return new Response(JSON.stringify({ error: 'Clé HubSpot manquante' }), { status: 500 });
    }
  
    try {
      const body = await req.json();
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
      } = body;
  
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
        return new Response(JSON.stringify({ error: 'Erreur création contact', detail: contactData }), {
          status: contactRes.status,
        });
      }
  
      return new Response(JSON.stringify({ success: true, contactId: contactData.id }), { status: 200 });
    } catch (error: any) {
      console.error('Erreur générale Contact:', error);
      return new Response(JSON.stringify({ error: 'Erreur serveur', detail: error.message }), { status: 500 });
    }
  }
  