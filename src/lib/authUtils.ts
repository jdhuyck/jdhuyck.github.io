import Cookies from 'universal-cookie';

const cookies = new Cookies();

// Get environment variables
const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = import.meta.env.VITE_GITHUB_CLIENT_SECRET;
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;
const ADMIN_GITHUB_USERNAME = 'jdhuyck';

// GitHub OAuth functions
export const initiateGitHubAuth = (): void => {
  const redirectUri = `${window.location.origin}/admin/auth/callback`;
  const scope = 'read:user';
  const state = Math.random().toString(36).substring(2);
  
  // Store state in cookie for validation
  cookies.set('github_auth_state', state, { 
    path: '/',
    maxAge: 300 // 5 minutes
  });
  
  const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;
  window.location.href = authUrl;
};

export const handleGitHubCallback = async (code: string, state: string): Promise<boolean> => {
  try {
    const savedState = cookies.get('github_auth_state');
    cookies.remove('github_auth_state', { path: '/' });

    // Validate state parameter
    if (state !== savedState) {
      console.error('State parameter mismatch');
      return false;
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        state,
      }),
    });

    if (!tokenResponse.ok) {
      console.error('Token exchange failed');
      return false;
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      console.error('No access token received');
      return false;
    }

    // Get user info from GitHub
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!userResponse.ok) {
      console.error('Failed to fetch user info');
      return false;
    }

    const userData = await userResponse.json();

    // Verify the user is you
    if (userData.login === ADMIN_GITHUB_USERNAME) {
      setAuthenticated();
      return true;
    } else {
      console.error('User is not authorized');
      return false;
    }
  } catch (error) {
    console.error('GitHub authentication error:', error);
    return false;
  }
};

// Password authentication functions
export const loginWithPassword = (password: string): boolean => {
  if (password === ADMIN_PASSWORD) {
    setAuthenticated();
    return true;
  }
  return false;
};

// Authentication state management
export const setAuthenticated = (): void => {
  cookies.set('admin_authenticated', 'true', { 
    path: '/',
    maxAge: 3600, // 1 hour session
    secure: window.location.protocol === 'https:',
    sameSite: 'strict'
  });
};

export const isAuthenticated = (): boolean => {
  return cookies.get('admin_authenticated') === 'true';
};

export const logout = (): void => {
  cookies.remove('admin_authenticated', { path: '/' });
  cookies.remove('github_auth_state', { path: '/' });
  window.location.href = '/';
};