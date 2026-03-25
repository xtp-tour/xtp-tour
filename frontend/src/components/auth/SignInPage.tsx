import React, { useMemo, useState } from 'react';
import { useSignIn } from '@clerk/clerk-react';
import { Button, Col, Form, Row } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import SocialLoginButtons from './SocialLoginButtons';

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

const SignInPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/';

  const oauthCompleteUrl = useMemo(
    () => `${window.location.origin}${from.startsWith('/') ? from : `/${from}`}`,
    [from],
  );

  const { isLoaded, signIn, setActive } = useSignIn();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [showSecondFactor, setShowSecondFactor] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const signInSchema = z.object({
    email: z.string().min(1, t('auth.signInPage.errors.emailRequired')).email(t('auth.signInPage.errors.emailInvalid')),
    password: z.string().min(1, t('auth.signInPage.errors.passwordRequired')),
  });

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn || !setActive) {
      return;
    }
    const parsed = signInSchema.safeParse({ email, password });
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      parsed.error.errors.forEach((errItem) => {
        const path = errItem.path.join('.');
        errors[path] = errItem.message;
      });
      setValidationErrors(errors);
      setError(Object.values(errors).join('. '));
      return;
    }
    setValidationErrors({});
    setError('');
    setLoading(true);
    try {
      const signInAttempt = await signIn.create({
        identifier: email,
        password,
      });

      if (signInAttempt.status === 'complete' && signInAttempt.createdSessionId) {
        await setActive({ session: signInAttempt.createdSessionId });
        navigate(from, { replace: true });
        return;
      }

      if (signInAttempt.status === 'needs_second_factor') {
        const emailCodeFactor = signInAttempt.supportedSecondFactors?.find(
          (factor) => factor.strategy === 'email_code',
        );
        if (emailCodeFactor && 'emailAddressId' in emailCodeFactor) {
          await signIn.prepareSecondFactor({
            strategy: 'email_code',
            emailAddressId: emailCodeFactor.emailAddressId as string,
          });
          setShowSecondFactor(true);
          return;
        }
      }

      setError(t('auth.signInPage.errors.incomplete'));
    } catch (err: unknown) {
      console.error(err);
      setError(clerkErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSecondFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn || !setActive) {
      return;
    }
    const trimmed = code.trim();
    if (!trimmed) {
      setError(t('auth.signInPage.errors.codeRequired'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      const signInAttempt = await signIn.attemptSecondFactor({
        strategy: 'email_code',
        code: trimmed,
      });
      if (signInAttempt.status === 'complete' && signInAttempt.createdSessionId) {
        await setActive({ session: signInAttempt.createdSessionId });
        navigate(from, { replace: true });
        return;
      }
      setError(t('auth.signInPage.errors.incomplete'));
    } catch (err: unknown) {
      console.error(err);
      setError(clerkErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleStartOver = () => {
    setShowSecondFactor(false);
    setCode('');
    setError('');
  };

  if (!isLoaded) {
    return (
      <div className="container py-5">
        <Row className="justify-content-center">
          <Col md={8} lg={6} className="text-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">{t('profileSetup.loading.text')}</span>
            </div>
          </Col>
        </Row>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <div className="card shadow">
            <div className="card-body p-4">
              <h2 className="text-center mb-4">{t('auth.signInPage.title')}</h2>
              {error && <div className="alert alert-danger">{error}</div>}

              {!showSecondFactor && (
                <SocialLoginButtons mode="sign-in" redirectUrlComplete={oauthCompleteUrl} />
              )}

              {!showSecondFactor && (
                <Form onSubmit={handleCredentialsSubmit} noValidate>
                  <Form.Group className="mb-3">
                    <Form.Label>{t('auth.signInPage.fields.email')}</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      isInvalid={!!validationErrors.email}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-4">
                    <Form.Label>{t('auth.signInPage.fields.password')}</Form.Label>
                    <Form.Control
                      type="password"
                      name="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      isInvalid={!!validationErrors.password}
                      required
                    />
                  </Form.Group>
                  <Button variant="primary" type="submit" className="w-100 mb-2" disabled={loading}>
                    {loading ? t('auth.signInPage.signingIn') : t('auth.signIn')}
                  </Button>
                  <p className="text-center mb-0 small text-muted">
                    {t('auth.signInPage.noAccount')}{' '}
                    <Link to="/sign-up">{t('auth.signUp')}</Link>
                  </p>
                </Form>
              )}

              {showSecondFactor && (
                <Form onSubmit={handleSecondFactorSubmit} noValidate>
                  <p className="text-muted small">{t('auth.signInPage.secondFactorHint')}</p>
                  <Form.Group className="mb-3">
                    <Form.Label>{t('auth.signInPage.fields.code')}</Form.Label>
                    <Form.Control
                      type="text"
                      name="code"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      required
                    />
                  </Form.Group>
                  <Button variant="primary" type="submit" className="w-100 mb-2" disabled={loading}>
                    {loading ? t('auth.signInPage.signingIn') : t('auth.signInPage.verify')}
                  </Button>
                  <Button variant="outline-secondary" type="button" className="w-100" disabled={loading} onClick={handleStartOver}>
                    {t('auth.signInPage.startOver')}
                  </Button>
                </Form>
              )}
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default SignInPage;
