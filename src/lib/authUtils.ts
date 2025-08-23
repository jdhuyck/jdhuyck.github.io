import Cookies from 'universal-cookie';

const cookies = new Cookies();
const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = import.meta.env.VITE_GITHUB_CLIENT_SECRET;
const ADMIN_GITHUB_USERNAME = 'jdhuyck';
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

export const initiateGitHubAuth = () => {
    const redirectUri = `${window.location.origin}/admin/auth/callback`;
    const scope = 'read:user';
    const state = Math.random().toString(36).substring(2);

    cookies.set('github_auth_state', state, { path: '/' });

    const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;
    window.location.href = authUrl;
};

export const handleGitHubCallback = async (code: string, state: string): Promise<boolean> => {
    const savedState = cookies.get('github_auth_state');
    cookies.remove('github_auth_state', { path: '/' });

    if (state !== savedState) {
        return false;
    }

    try {
        // Exchange code for access token
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content_Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                client_id: GITHUB_CLIENT_ID,
                client_secret: GITHUB_CLIENT_SECRET,
                code,
                state,
            }),
        });

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        if (!accessToken) {
            return false;
        }

        // Get user info
        const userResponse = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `token ${accessToken}`,
                'Accept': 'application/json',
            },
        });

        const userData = await userResponse.json();

        if (userData.login === ADMIN_GITHUB_USERNAME) {
            cookies.set('admin_authenticated', 'true', {
                path: '/',
                maxAge: 3600,  // 1hr
                secure: window.location.protocol === "https:"
            });
            return true;
        }
    } catch (error) {
        console.error('GitHub auth error:', error)
    }

    return false;
};

export const login = (password: string): boolean => {
    if (password === ADMIN_PASSWORD) {
        cookies.set('admin_authenticated', 'true', {
            path: '/',
            maxAge: 3600,  // 1hr
            secure: window.location.protocol === "https:"
        });
        return true;
    }
    return false;
};

export const isAuthenticated = (): boolean => {
    return cookies.get('admin_authenticated') === 'true';
};

export const logout = () => {
    cookies.remove('admin_authenticated', { path: '/' });
};