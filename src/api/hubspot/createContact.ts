import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' });
    }
  
    const HUBSPOT_API_KEY = process.env.VITE_HUBSPOT_API_KEY;
    const { firstName, lastName, email, phone, notes } = req.body;
  
    try {
      const response = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${HUBSPOT_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: {
            firstname: firstName,
            lastname: lastName,
            email,
            phone,
            notes
          }
        })
      });
  
      const result = await response.json();
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ error: 'Erreur HubSpot', detail: (err as Error).message });
    }
  }
  