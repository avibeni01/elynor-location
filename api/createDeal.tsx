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
        contactId,
        firstName,
        lastName,
        activeTab,
        destination,
        dates,
        selectedVehicle
      } = body;
  
      console.log('[CreateDeal] Reçu:', body);
  
      const pipelineId = activeTab === 'hotel' ? 'default' : '1389997300';
  
      const dealProperties: Record<string, any> = {
        dealname: `${firstName} ${lastName} - ${activeTab === 'hotel' ? 'Réservation Hôtel' : 'Location Voiture'}`,
        pipeline: pipelineId,
        dealstage: 'appointmentscheduled',
        amount: '0',
      };
  
      if (activeTab === 'hotel') {
        dealProperties.destination = destination || 'Non précisé';
        dealProperties.check_in_date = dates?.[0] || null;
        dealProperties.check_out_date = dates?.[1] || null;
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
        console.error('[CreateDeal] Erreur:', dealData);
        return new Response(JSON.stringify({ error: 'Erreur création deal', detail: dealData }), {
          status: 500,
        });
      }
  
      console.log('[CreateDeal] Succès:', dealData.id);
  
      return new Response(JSON.stringify({
        success: true,
        dealId: dealData.id,
      }), {
        status: 200,
      });
  
    } catch (error: any) {
      console.error('[CreateDeal] Exception:', error);
      return new Response(JSON.stringify({
        error: 'Erreur générale HubSpot (deal)',
        detail: error.message,
      }), {
        status: 500,
      });
    }
  }