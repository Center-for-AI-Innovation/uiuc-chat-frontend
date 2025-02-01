import { AuthProvider } from 'react-oidc-context'
import { ReactNode, useEffect, useState } from 'react'

interface AuthProviderProps {
  children: ReactNode
}

const AUTHORIZED_PATHS = [
  // Root paths
  '/',
  '/new',
  '/chat',
  '/settings',
  '/silent-renew',

  // Course-specific paths
  '/:course_name/chat',
  '/:course_name/dashboard',
  '/:course_name/tools',
  '/:course_name/not_authorized',
  '/:course_name/index',
  '/:course_name/prompt',     // From prompt.tsx
  '/:course_name/analysis',   // From analysis.tsx
  '/:course_name/api',        // From api.tsx
  '/:course_name/llms',       // From llms.tsx
  '/:course_name/materials',

  // Special course paths
  '/NCSA/chat',

  // API routes
  '/api/chat-api',
  '/api/UIUC-api',
  '/api/chat-api/keys/validate',
  '/api/UIUC-api/getCourseMetadata',
  '/api/UIUC-api/isSignedIn',
  '/api/models',              // Referenced in prompt.tsx

  // Query parameter paths
  '/new',

  // From tools.tsx (lines 94-97)
  '/gpt4',
  '/global',
  '/extreme',

  // From middleware.ts (lines 16-25)
  '/:singleLevel([^/]+)',
  '/:singleLevel([^/]+)/materials',
] as const;

// Type for authorized paths
type AuthorizedPath = typeof AUTHORIZED_PATHS[number];

const isAuthorizedPath = (path: string): path is AuthorizedPath => {
  // Remove query parameters for comparison
  const cleanPath = path.split('?')[0];

  // Check if the path exactly matches one of our authorized paths
  return AUTHORIZED_PATHS.includes(cleanPath as AuthorizedPath);
}

const sanitizeRedirect = (redirectPath: string): string => {
  try {
    // Remove any potential multiple forward slashes
    const normalizedPath = redirectPath.replace(/\/+/g, '/');

    // Split path and query parameters
    const [path = '/', query] = normalizedPath.split('?');

    // Check if the path is in our whitelist
    if (!isAuthorizedPath(path)) {
      console.warn('[KeycloakProvider] Unauthorized redirect path, using homepage');
      return '/';
    }

    // If there are query parameters, validate them
    if (query) {
      const params = new URLSearchParams(query);
      // Filter out any potentially dangerous query parameters
      // Only allow specific known parameters
      const allowedParams = new URLSearchParams();
      const safeParams = ['tab', 'view', 'id', 'course_name', 'redirect', 'state', 'code', 'session_state'];

      safeParams.forEach(param => {
        const value = params.get(param);
        if (value) {
          allowedParams.append(param, value);
        }
      });

      // Reconstruct the URL with only allowed parameters
      const queryString = allowedParams.toString();
      return queryString ? `${path}?${queryString}` : path;
    }

    return path;
  } catch {
    console.warn('[KeycloakProvider] Error processing redirect path, using homepage');
    return '/';
  }
}

const decodeState = (state: string): { redirect: string; timestamp: number } | null => {
  try {
    // Add padding if needed
    const padding = '='.repeat((4 - (state.length % 4)) % 4);
    // Convert URL-safe characters back
    const base64 = (state + padding).replace(/-/g, '+').replace(/_/g, '/');
    
    const decoded = atob(base64);
    return JSON.parse(decoded);
  } catch (e) {
    console.error('[KeycloakProvider] Error decoding state:', e);
    return null;
  }
}

export const KeycloakProvider = ({ children }: AuthProviderProps) => {
  // Add state to track if we're on client side
  const [isMounted, setIsMounted] = useState(false)

  const [oidcConfig, setOidcConfig] = useState({
    authority: process.env.NEXT_PUBLIC_KEYCLOAK_URL + "realms/" + process.env.NEXT_PUBLIC_KEYCLOAK_REALM,
    client_id: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'uiucchat',
    redirect_uri: '',  // Initialize empty, will set in useEffect
    silent_redirect_uri: '',
    post_logout_redirect_uri: '',
    scope: 'openid profile email',
    response_type: 'code',
    loadUserInfo: true,
    onSigninCallback: async () => {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const state = params.get('state');
        const code = params.get('code');
    
        console.log('[KeycloakProvider][onSigninCallback] URL params:', {
          state,
          code,
          fullSearch: window.location.search
        });
    
        // Only process if this is actually an auth callback
        if (!code) {
          console.log('[KeycloakProvider][onSigninCallback] No code found, redirecting to homepage');
          window.location.replace('/');
          return;
        }
    
        console.log('[KeycloakProvider][onSigninCallback] Processing signin callback');
    
        try {
          // Clear the URL parameters first to prevent loops
          console.log('[KeycloakProvider][onSigninCallback] Clearing URL parameters');
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          );
    
          // Parse state if it exists
          if (state) {
            const stateObj = decodeState(state);
            console.log('[KeycloakProvider][onSigninCallback] Decoded state:', stateObj);
            
            if (stateObj?.redirect) {
              const redirectPath = sanitizeRedirect(stateObj.redirect);
              console.log('[KeycloakProvider][onSigninCallback] Redirecting to:', redirectPath);
              window.location.replace(redirectPath);
              return;
            }
          }
          
          // Fallback to homepage if no valid redirect
          console.log('[KeycloakProvider][onSigninCallback] No valid redirect found, going to homepage');
          window.location.replace('/');
        } catch (e) {
          console.error('[KeycloakProvider][onSigninCallback] Error processing callback:', e);
          window.location.replace('/');
        }
      }
    }
  })

  // Set up client-side values after mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMounted(true)
      setOidcConfig(prev => ({
        ...prev,
        redirect_uri: window.location.origin, // Update to use root
        silent_redirect_uri: window.location.origin + '/silent-renew',
        post_logout_redirect_uri: window.location.origin
      }))
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined' && isMounted) {
      const params = new URLSearchParams(window.location.search)
      const isCallback = params.has('code') && params.has('state')

      console.log('[KeycloakProvider][useEffect] Current state:', {
        isCallback,
        search: window.location.search,
        hasCode: params.has('code'),
        hasState: params.has('state'),
        currentConfig: oidcConfig
      })

      // If we don't have a redirect_uri, redirect to homepage
      if (!oidcConfig.redirect_uri) {
        console.log('[KeycloakProvider][useEffect] No redirect URI found, redirecting to homepage')
        window.location.replace('/')
        return
      }
    }
  }, [oidcConfig, isMounted])

  // Don't render anything during SSR or before client-side mount
  if (typeof window === 'undefined' || !isMounted) {
    console.log('[KeycloakProvider] Not rendering - SSR or not mounted')
    return null
  }

  console.log('[KeycloakProvider] Rendering with config:', {
    hasRedirectUri: !!oidcConfig.redirect_uri,
    redirectUri: oidcConfig.redirect_uri,
    currentUrl: window.location.href
  })

  return (
    <AuthProvider {...oidcConfig}>
      {children}
    </AuthProvider>
  )
}