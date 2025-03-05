export const initiateSignIn = (auth: any, redirectPath: string) => {
  console.log('[AuthHelper] Initiating sign in with redirect:', redirectPath)
  // Use URL-safe base64 encoding
  const state = btoa(JSON.stringify({ 
      redirect: redirectPath,
      timestamp: Date.now() 
  })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  
  return auth.signinRedirect({ state })
}