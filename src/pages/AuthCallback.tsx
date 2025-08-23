import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { handleGitHubCallback } from '../lib/authUtils';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const authenticate = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      if (error) {
        console.error('GitHub auth error:', error);
        setStatus('error');
        setTimeout(() => navigate('/admin/login'), 2000);
        return;
      }

      if (!code || !state) {
        setStatus('error');
        setTimeout(() => navigate('/admin/login'), 2000);
        return;
      }

      try {
        const success = await handleGitHubCallback(code, state);
        if (success) {
          setStatus('success');
          // Redirect to admin dashboard after successful authentication
          setTimeout(() => navigate('/admin'), 1000);
        } else {
          setStatus('error');
          setTimeout(() => navigate('/admin/login'), 2000);
        }
      } catch (err) {
        console.error('Authentication error:', err);
        setStatus('error');
        setTimeout(() => navigate('/admin/login'), 2000);
      }
    };

    authenticate();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="max-w-md mx-auto p-6">
          {status === 'loading' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-700">Authenticating with GitHub...</p>
            </>
          )}
          {status === 'success' && (
            <>
              <div className="text-green-500 text-4xl mb-4">✓</div>
              <p className="text-gray-700">Authentication successful!</p>
              <p className="text-gray-500 text-sm mt-2">Redirecting to admin panel...</p>
            </>
          )}
          {status === 'error' && (
            <>
              <div className="text-red-500 text-4xl mb-4">✗</div>
              <p className="text-gray-700">Authentication failed</p>
              <p className="text-gray-500 text-sm mt-2">Redirecting to login page...</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;