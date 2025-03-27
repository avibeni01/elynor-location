import axios from 'axios';

const HUBSPOT_CLIENT_ID = import.meta.env.VITE_HUBSPOT_CLIENT_ID;
const HUBSPOT_CLIENT_SECRET = import.meta.env.VITE_HUBSPOT_CLIENT_SECRET;
const REDIRECT_URI = import.meta.env.VITE_HUBSPOT_REDIRECT_URI;

export const initiateAuth = () => {
  window.location.href = `https://app.hubspot.com/oauth/authorize?client_id=${HUBSPOT_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=crm.objects.contacts.write%20crm.objects.deals.write`;
};

export const getTokens = async (code: string) => {
  const response = await axios.post(
    'https://api.hubapi.com/oauth/v1/token',
    new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: HUBSPOT_CLIENT_ID,
      client_secret: HUBSPOT_CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      code
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  return response.data;
};