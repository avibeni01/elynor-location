import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getTokens } from '../api/hubspot/auth';

export const HubSpotAuth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const code = searchParams.get('code');

  useEffect(() => {
    const authenticate = async () => {
      if (code) {
        try {
          const tokens = await getTokens(code);
          localStorage.setItem('hubspot_tokens', JSON.stringify(tokens));
          navigate('/?hubspot_auth=success');
        } catch (error) {
          navigate('/?hubspot_auth=error');
        }
      }
    };
    authenticate();
  }, [code, navigate]);

  return <div>Authentification en cours...</div>;
};