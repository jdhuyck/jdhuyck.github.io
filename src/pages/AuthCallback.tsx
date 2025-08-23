import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { handleGitHubCallback } from '../lib/authUtils';

const AuthCallback: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

    useEffect(() => {
        const code = searchParams.get('code');
        const state = searchParams.get('state');

        if (code && state) {
            handleGitHubCallback(code, state).then(success => {
                if (success) {
                    setStatus('success');
                    setTimeout(() => navigate('/admin'), 1000);
                } else {
                    setStatus('error');
                    setTimeout(() => navigate('/admin/login'), 2000);
                }
            });
        } else {
            setStatus('error');
            setTimeout(() => navigate('/admin/login'), 2000);
        }
    }, [navigate, searchParams]);

    return (
        <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
            <div className='text-center'>
                {status === 'loading' && <p>Authenticating...</p>}
                {status === 'success' && <p>Authentication successful! Redirecting...</p>}
                {status === 'error' && <p>Authentication failed. Returning to login...</p>}
            </div>
        </div>
    );
};

export default AuthCallback;