import React, { useMemo, useState } from 'react';
import { useClerk, useSignUp } from '@clerk/clerk-react';
import { Button, Col, Form, Row } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAPI } from '../../services/apiProvider';
import { markProfileComplete } from '../../hooks/useProfileStatus';
import { getNtrpLevelOptions } from '../../utils/profileFormUtils';
import SocialLoginButtons from './SocialLoginButtons';

type Step = 'details' | 'verify';

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

const SignUpPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const api = useAPI();
  const clerk = useClerk();
  const { isLoaded, signUp, setActive } = useSignUp();

  const oauthSignUpCompleteUrl = useMemo(() => `${window.location.origin}/sign-up`, []);

  const [step, setStep] = useState<Step>('details');
  const [verificationCode, setVerificationCode] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    ntrpLevel: '',
    city: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const signUpSchema = z.object({
    email: z.string().min(1, t('auth.signUpPage.errors.emailRequired')).email(t('auth.signUpPage.errors.emailInvalid')),
    password: z.string().min(8, t('auth.signUpPage.errors.passwordMin')),
    firstName: z.string().min(1, t('profileSetup.errors.firstNameRequired')),
    lastName: z.string().min(1, t('profileSetup.errors.lastNameRequired')),
    ntrpLevel: z.string().min(1, t('profileSetup.errors.ntrpRequired')).refine(
      (val) => {
        const num = parseFloat(val);
        return !Number.isNaN(num) && num >= 1.0 && num <= 7.0;
      },
      { message: t('profileSetup.errors.ntrpInvalid') },
    ),
    city: z.string().min(1, t('profileSetup.errors.cityRequired')),
  });

  const validateDetails = (): boolean => {
    const result = signUpSchema.safeParse(formData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        const path = e.path.join('.');
        errors[path] = e.message;
      });
      setValidationErrors(errors);
      setError(Object.values(errors).join('. '));
      return false;
    }
    setValidationErrors({});
    setError('');
    return true;
  };

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signUp) {
      return;
    }
    if (!validateDetails()) {
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signUp.create({
        emailAddress: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
      });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setStep('verify');
      setVerificationCode('');
    } catch (err: unknown) {
      console.error(err);
      setError(clerkErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signUp || !setActive || !clerk) {
      return;
    }
    const code = verificationCode.trim();
    if (!code) {
      setError(t('auth.signUpPage.errors.codeRequired'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      const signUpAttempt = await signUp.attemptEmailAddressVerification({ code });
      if (signUpAttempt.status !== 'complete' || !signUpAttempt.createdSessionId) {
        setError(t('auth.signUpPage.errors.verificationIncomplete'));
        return;
      }
      await setActive({ session: signUpAttempt.createdSessionId });
      if (clerk.user) {
        await clerk.user.update({
          firstName: formData.firstName,
          lastName: formData.lastName,
        });
      }
      const lang = i18n.language?.split('-')[0] || 'en';
      await api.createUserProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        ntrpLevel: parseFloat(formData.ntrpLevel),
        city: formData.city,
        country: '',
        language: lang,
      });
      markProfileComplete();
      navigate('/');
    } catch (err: unknown) {
      console.error(err);
      setError(clerkErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!isLoaded || !signUp) {
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
    } catch (err: unknown) {
      console.error(err);
      setError(clerkErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
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
              <h2 className="text-center mb-4">{t('auth.signUpPage.title')}</h2>
              {error && <div className="alert alert-danger">{error}</div>}

              {step === 'details' && (
                <SocialLoginButtons mode="sign-up" redirectUrlComplete={oauthSignUpCompleteUrl} />
              )}

              {step === 'details' && (
                <Form onSubmit={handleDetailsSubmit} noValidate>
                  <Form.Group className="mb-3">
                    <Form.Label>{t('auth.signUpPage.fields.email')}</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      autoComplete="email"
                      value={formData.email}
                      onChange={handleChange}
                      isInvalid={!!validationErrors.email}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>{t('auth.signUpPage.fields.password')}</Form.Label>
                    <Form.Control
                      type="password"
                      name="password"
                      autoComplete="new-password"
                      value={formData.password}
                      onChange={handleChange}
                      isInvalid={!!validationErrors.password}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>{t('profileSetup.fields.firstName')}</Form.Label>
                    <Form.Control
                      type="text"
                      name="firstName"
                      autoComplete="given-name"
                      value={formData.firstName}
                      onChange={handleChange}
                      isInvalid={!!validationErrors.firstName}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>{t('profileSetup.fields.lastName')}</Form.Label>
                    <Form.Control
                      type="text"
                      name="lastName"
                      autoComplete="family-name"
                      value={formData.lastName}
                      onChange={handleChange}
                      isInvalid={!!validationErrors.lastName}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>{t('profileSetup.fields.ntrpLevel')}</Form.Label>
                    <Form.Text className="text-muted d-block mb-2">
                      {t('profileSetup.ntrp.description')}
                      <a
                        href="https://www.usta.com/en/home/coach-organize/tennis-tool-center/run-usta-programs/national/understanding-ntrp-ratings.html"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ms-1"
                      >
                        {t('profileSetup.ntrp.learnMore')}
                      </a>
                    </Form.Text>
                    <Form.Select
                      name="ntrpLevel"
                      value={formData.ntrpLevel}
                      onChange={handleChange}
                      isInvalid={!!validationErrors.ntrpLevel}
                      required
                    >
                      <option value="">{t('profileSetup.ntrp.selectLevel')}</option>
                      {getNtrpLevelOptions(t).map((level) => (
                        <option key={level.value} value={level.value}>
                          {level.label}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-4">
                    <Form.Label>{t('profileSetup.fields.preferredCity')}</Form.Label>
                    <Form.Control
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      isInvalid={!!validationErrors.city}
                      required
                      placeholder={t('profileSetup.placeholders.preferredCity')}
                    />
                  </Form.Group>
                  <Button variant="primary" type="submit" className="w-100 mb-2" disabled={loading}>
                    {loading ? t('auth.signUpPage.sending') : t('auth.signUpPage.continue')}
                  </Button>
                  <p className="text-center mb-0 small text-muted">
                    {t('auth.signUpPage.haveAccount')}{' '}
                    <Link to="/sign-in">{t('auth.signIn')}</Link>
                  </p>
                </Form>
              )}

              {step === 'verify' && (
                <Form onSubmit={handleVerifySubmit} noValidate>
                  <p className="text-muted small">{t('auth.signUpPage.verifyHint', { email: formData.email })}</p>
                  <Form.Group className="mb-3">
                    <Form.Label>{t('auth.signUpPage.fields.code')}</Form.Label>
                    <Form.Control
                      type="text"
                      name="code"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      required
                    />
                  </Form.Group>
                  <Button variant="primary" type="submit" className="w-100 mb-2" disabled={loading}>
                    {loading ? t('profileSetup.buttons.saving') : t('auth.signUpPage.verify')}
                  </Button>
                  <Button variant="outline-secondary" type="button" className="w-100 mb-2" disabled={loading} onClick={handleResendCode}>
                    {t('auth.signUpPage.resendCode')}
                  </Button>
                  <Button variant="link" type="button" className="w-100 p-0" disabled={loading} onClick={() => setStep('details')}>
                    {t('auth.signUpPage.back')}
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

export default SignUpPage;
