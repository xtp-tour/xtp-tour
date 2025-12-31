import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Form, Button, Row, Col } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { useAPI } from '../services/apiProvider';

interface ProfileSetupProps {
  onComplete: () => void;
  /** When false, skip the initial loading state (used when we already know profile is incomplete) */
  showLoadingState?: boolean;
}

interface APIError {
  status?: number;
  message?: string;
}

// NTRP levels will be defined with i18n support inside the component

export const ProfileSetup: React.FC<ProfileSetupProps> = ({ onComplete, showLoadingState = true }) => {
  const { t, i18n } = useTranslation();
  const { user } = useUser();
  const api = useAPI();
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    ntrpLevel: '',
    city: '',
    language: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // Skip initial loading if showLoadingState is false (we already know profile is incomplete)
  const [initialLoading, setInitialLoading] = useState(showLoadingState);
  const [profileExists, setProfileExists] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Get NTRP levels with translations
  const getNtrpLevels = () => {
    const levels = [1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0, 7.0];
    return levels.map(value => {
      // Ensure consistent string formatting for translation keys
      const formattedValue = value.toFixed(1);
      const translationKey = `profileSetup.ntrp.levels.${formattedValue}`;
      const translation = t(translationKey);

      return {
        value,
        label: translation
      };
    });
  };

  // Zod schema for form validation
  const profileSetupSchema = z.object({
    firstName: z.string().min(1, t('profileSetup.errors.firstNameRequired')),
    lastName: z.string().min(1, t('profileSetup.errors.lastNameRequired')),
    ntrpLevel: z.string().min(1, t('profileSetup.errors.ntrpRequired')).refine(
      (val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num >= 1.0 && num <= 7.0;
      },
      { message: t('profileSetup.errors.ntrpInvalid') }
    ),
    city: z.string().min(1, t('profileSetup.errors.cityRequired')),
  });

  // Form validation using Zod
  const validateForm = (): { isValid: boolean; errors: Record<string, string> } => {
    const result = profileSetupSchema.safeParse({
      firstName: formData.firstName,
      lastName: formData.lastName,
      ntrpLevel: formData.ntrpLevel,
      city: formData.city,
    });

    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((error) => {
        const path = error.path.join('.');
        errors[path] = error.message;
      });
      return { isValid: false, errors };
    }

    return { isValid: true, errors: {} };
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await api.getUserProfile();
        if (response.profile) {
          // Profile exists, check if it's complete
          const profile = response.profile;
          const isComplete = profile.firstName && profile.lastName && profile.ntrpLevel && profile.city;

          if (isComplete) {
            onComplete();
            return;
          }

          // Profile exists but is incomplete, pre-populate form
          setProfileExists(true);
          setFormData(prev => ({
            ...prev,
            firstName: profile.firstName || user?.firstName || '',
            lastName: profile.lastName || user?.lastName || '',
            ntrpLevel: profile.ntrpLevel?.toString() || '',
            city: profile.city || '',
            language: profile.language || i18n.language?.split('-')[0] || 'en',
          }));
        } else {
          // No profile exists, we'll create one
          setProfileExists(false);
        }
      } catch (error: unknown) {
        // If we get a 404, it means profile doesn't exist yet
        const apiError = error as APIError;
        if (apiError.status === 404) {
          setProfileExists(false);
        } else {
          console.error('Error loading profile:', error);
          setProfileExists(false);
        }
      } finally {
        setInitialLoading(false);
      }
    };

    loadProfile();
  }, [api, user, onComplete, i18n.language]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate form before submission
    const validation = validateForm();
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      // Combine all error messages for the general error display
      const errorMessage = Object.values(validation.errors).join('. ');
      setError(errorMessage);
      return;
    }

    // Clear any previous validation errors
    setValidationErrors({});
    setLoading(true);

    try {
      if (profileExists) {
        // Update existing profile
        await api.updateUserProfile({
          firstName: formData.firstName,
          lastName: formData.lastName,
          ntrpLevel: parseFloat(formData.ntrpLevel),
          city: formData.city,
          country: '',
          language: formData.language || i18n.language?.split('-')[0] || 'en',
        });
      } else {
        // Create new profile
        await api.createUserProfile({
          firstName: formData.firstName,
          lastName: formData.lastName,
          ntrpLevel: parseFloat(formData.ntrpLevel),
          city: formData.city,
          country: '',
          language: formData.language || i18n.language?.split('-')[0] || 'en',
        });
      }
      onComplete();
    } catch (error: unknown) {
      console.error('Error saving profile:', error);
      setError(t('profileSetup.errors.failedToSave'));
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="container py-5">
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <div className="card shadow">
              <div className="card-body p-4 text-center">
                <h2 className="mb-4">{t('profileSetup.loading.title')}</h2>
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">{t('profileSetup.loading.text')}</span>
                </div>
              </div>
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
              <h2 className="text-center mb-4">
                {profileExists ? t('profileSetup.title.complete') : t('profileSetup.title.create')}
              </h2>
              {error && <div className="alert alert-danger">{error}</div>}
              <Form onSubmit={handleSubmit} noValidate>
                <Form.Group className="mb-3">
                  <Form.Label>{t('profileSetup.fields.firstName')}</Form.Label>
                  {validationErrors.firstName && (
                    <div className="alert alert-danger alert-sm py-1 px-2 mb-2" role="alert">
                      <small><i className="bi bi-exclamation-triangle me-1"></i>
                      {validationErrors.firstName}</small>
                    </div>
                  )}
                  <Form.Control
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    isInvalid={!!validationErrors.firstName}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>{t('profileSetup.fields.lastName')}</Form.Label>
                  {validationErrors.lastName && (
                    <div className="alert alert-danger alert-sm py-1 px-2 mb-2" role="alert">
                      <small><i className="bi bi-exclamation-triangle me-1"></i>
                      {validationErrors.lastName}</small>
                    </div>
                  )}
                  <Form.Control
                    type="text"
                    name="lastName"
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
                  {validationErrors.ntrpLevel && (
                    <div className="alert alert-danger alert-sm py-1 px-2 mb-2" role="alert">
                      <small><i className="bi bi-exclamation-triangle me-1"></i>
                      {validationErrors.ntrpLevel}</small>
                    </div>
                  )}
                  <Form.Select
                    name="ntrpLevel"
                    value={formData.ntrpLevel}
                    onChange={handleChange}
                    isInvalid={!!validationErrors.ntrpLevel}
                    required
                  >
                    <option value="">{t('profileSetup.ntrp.selectLevel')}</option>
                    {getNtrpLevels().map(level => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>{t('profileSetup.fields.preferredCity')}</Form.Label>
                  {validationErrors.city && (
                    <div className="alert alert-danger alert-sm py-1 px-2 mb-2" role="alert">
                      <small><i className="bi bi-exclamation-triangle me-1"></i>
                      {validationErrors.city}</small>
                    </div>
                  )}
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

                <Button
                  variant="primary"
                  type="submit"
                  className="w-100"
                  disabled={loading}
                >
                  {loading ? t('profileSetup.buttons.saving') : (profileExists ? t('profileSetup.buttons.updateProfile') : t('profileSetup.buttons.createProfile'))}
                </Button>
              </Form>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};