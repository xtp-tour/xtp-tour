import React from 'react';
import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react';

/**
 * Completes Clerk OAuth / SSO redirect flows. Must match the `redirectUrl`
 * passed to `authenticateWithRedirect` (see SocialLoginButtons).
 */
const SsoCallbackRoute: React.FC = () => (
  <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center">
    <div className="text-center">
      <div className="spinner-border text-primary mb-3" role="status">
        <span className="visually-hidden">Loading</span>
      </div>
      <AuthenticateWithRedirectCallback />
    </div>
  </div>
);

export default SsoCallbackRoute;
