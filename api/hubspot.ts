export default async function handler(req: Request): Promise<Response> {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ message: 'Method not allowed' }), {
        status: 405,
      });
    }
  
    const HUBSPOT_API_KEY = process.env.VITE_HUBSPOT_API_KEY;
    if (!HUBSPOT_API_KEY) {
      return new Response(JSON.stringify({ error: 'Clé HubSpot manquante' }), {
        status: 500,
      });
    }
  
    try {
      const body = await req.json();
      const {
        firstName,
        lastName,
        email,
        phone,
        notes,
        activeTab,
        destination,
        dates,
        selectedVehicle
      } = body;
  
      // 1. Créer le contact
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
            notes,
          },
        }),
      });
  
      const contactData = await contactRes.json();
  
      if (!contactRes.ok) {
        return new Response(JSON.stringify({ error: 'Erreur création contact', detail: contactData }), {
          status: 500,
        });
      }
  
      const contactId = contactData.id;
  
      // 2. Créer le deal (transaction)
      const dealType = activeTab === 'hotel' ? 'resa_hotel' : 'resa_voiture';
  
      const dealProperties: Record<string, any> = {
        dealname: `${dealType} - ${firstName} ${lastName}`,
        pipeline: dealType,
        dealstage: 'appointmentscheduled',
        amount: '0',
      };
  
      if (activeTab === 'hotel') {
        dealProperties.destination = destination;
        dealProperties.check_in_date = dates?.[0];
        dealProperties.check_out_date = dates?.[1];
      } else {
        dealProperties.vehicle = selectedVehicle?.["Nom du véhicule"] || 'Non spécifié';
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
        return new Response(JSON.stringify({ error: 'Erreur création deal', detail: dealData }), {
          status: 500,
        });
      }
  
      return new Response(JSON.stringify({
        success: true,
        contactId,
        dealId: dealData.id,
      }), {
        status: 200,
      });
  
    } catch (error: any) {
      return new Response(JSON.stringify({
        error: 'Erreur générale HubSpot',
        detail: error.message,
      }), {
        status: 500,
      });
    }
  }
  