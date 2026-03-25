import React, { useState } from 'react';
import { useSignIn, useSignUp } from '@clerk/clerk-react';
import { Button } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

function clerkErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'errors' in err) {
    const errors = (err as { errors?: Array<{ message?: string; longMessage?: string }> }).errors;
    if (Array.isArray(errors) && errors.length > 0) {
      return errors[0].longMessage || errors[0].message || String(err);
    }
  }
  if (err instanceof Error) {
    return err.message;
  }
  return String(err);
}

type OAuthStrategy = 'oauth_google' | 'oauth_apple' | 'oauth_facebook';

export type SocialLoginButtonsProps = {
  mode: 'sign-in' | 'sign-up';
  /** Absolute URL (origin + path) to open after OAuth completes successfully */
  redirectUrlComplete: string;
};

/**
 * Clerk OAuth buttons for sign-in or sign-up. Requires `/sso-callback` and
 * {@link AuthenticateWithRedirectCallback} in the app router.
 */
const SocialLoginButtons: React.FC<SocialLoginButtonsProps> = ({ mode, redirectUrlComplete }) => {
  const { t } = useTranslation();
  const { isLoaded: signInLoaded, signIn } = useSignIn();
  const { isLoaded: signUpLoaded, signUp } = useSignUp();
  const [error, setError] = useState('');
  const [pendingStrategy, setPendingStrategy] = useState<OAuthStrategy | null>(null);

  const isLoaded = mode === 'sign-in' ? signInLoaded : signUpLoaded;
  const resource = mode === 'sign-in' ? signIn : signUp;

  if (!isLoaded || !resource) {
    return null;
  }

  const redirectUrl = `${window.location.origin}/sso-callback`;

  const handleOAuth = async (strategy: OAuthStrategy) => {
    setError('');
    setPendingStrategy(strategy);
    try {
      await resource.authenticateWithRedirect({
        strategy,
        redirectUrl,
        redirectUrlComplete,
      });
    } catch (err: unknown) {
      console.error(err);
      setError(clerkErrorMessage(err));
      setPendingStrategy(null);
    }
  };

  return (
    <div className="mb-4">
      {error && <div className="alert alert-danger py-2 small mb-3">{error}</div>}
      <div className="d-grid gap-2">
        <Button
          type="button"
          variant="outline-secondary"
          className="d-flex align-items-center justify-content-center gap-2"
          disabled={pendingStrategy !== null}
          onClick={() => void handleOAuth('oauth_google')}
        >
          <i className="bi bi-google" aria-hidden />
          {pendingStrategy === 'oauth_google' ? t('auth.social.redirecting') : t('auth.social.continueWithGoogle')}
        </Button>
        <Button
          type="button"
          variant="outline-secondary"
          className="d-flex align-items-center justify-content-center gap-2"
          disabled={pendingStrategy !== null}
          onClick={() => void handleOAuth('oauth_apple')}
        >
          <i className="bi bi-apple" aria-hidden />
          {pendingStrategy === 'oauth_apple' ? t('auth.social.redirecting') : t('auth.social.continueWithApple')}
        </Button>
        <Button
          type="button"
          variant="outline-secondary"
          className="d-flex align-items-center justify-content-center gap-2"
          disabled={pendingStrategy !== null}
          onClick={() => void handleOAuth('oauth_facebook')}
        >
          <i className="bi bi-facebook" aria-hidden />
          {pendingStrategy === 'oauth_facebook' ? t('auth.social.redirecting') : t('auth.social.continueWithFacebook')}
        </Button>
      </div>
      <p className="text-center text-muted small mt-3 mb-0">{t('auth.social.orContinueWithEmail')}</p>
    </div>
  );
};

export default SocialLoginButtons;
