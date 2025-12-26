import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClerk, useUser } from '@clerk/clerk-react';
import { Form, Button, Row, Col, Card, Modal, Alert } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { useAPI } from '../services/apiProvider';
import { ApiUserProfileData } from '../types/api';

// Notification channel bit flags
const CHANNEL_EMAIL = 1;
const CHANNEL_SMS = 2;
const CHANNEL_DEBUG = 4;
const CHANNEL_PUSH = 8;
const CHANNEL_WHATSAPP = 16;

const COUNTRIES = [
  { code: 'POL', name: 'Poland' },
  { code: 'USA', name: 'United States' },
  { code: 'GBR', name: 'United Kingdom' },
  { code: 'DEU', name: 'Germany' },
  { code: 'FRA', name: 'France' },
  { code: 'ESP', name: 'Spain' },
  { code: 'ITA', name: 'Italy' },
  { code: 'NLD', name: 'Netherlands' },
  { code: 'BEL', name: 'Belgium' },
  { code: 'AUT', name: 'Austria' },
  { code: 'CHE', name: 'Switzerland' },
  { code: 'CZE', name: 'Czech Republic' },
  { code: 'DNK', name: 'Denmark' },
  { code: 'SWE', name: 'Sweden' },
  { code: 'NOR', name: 'Norway' },
];

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'pl', name: 'Polski' },
];

const UserProfile: React.FC = () => {
  const { t } = useTranslation();
  const api = useAPI();
  const navigate = useNavigate();
  const { signOut } = useClerk();
  const { user } = useUser();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Profile data
  const [formData, setFormData] = useState<ApiUserProfileData>({
    firstName: '',
    lastName: '',
    city: 'Wroclaw',
    country: 'Poland',
    language: 'en',
    ntrpLevel: 3.0,
    notification_settings: {
      channels: CHANNEL_EMAIL,
      email: '',
      phone_number: '',
      debug_address: '',
    },
  });

  // Get NTRP levels with translations
  const getNtrpLevels = () => {
    const levels = [1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0, 7.0];
    return levels.map(value => {
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
  const createProfileSchema = () => z.object({
    firstName: z.string().min(1, t('userProfile.errors.firstNameRequired')),
    lastName: z.string().min(1, t('userProfile.errors.lastNameRequired')),
    city: z.string().min(1, t('userProfile.errors.cityRequired')),
    notification_settings: z.object({
      channels: z.number().min(1, t('userProfile.notifications.validation')),
      email: z.string().optional().default(''),
      phone_number: z.string().optional().default(''),
      debug_address: z.string().optional().default(''),
    }).refine(
      (settings) => {
        // If email channel is enabled, email must be valid
        if ((settings.channels & CHANNEL_EMAIL) !== 0) {
          const email = settings.email || '';
          return email.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        }
        return true;
      },
      { message: t('userProfile.errors.emailRequired'), path: ['email'] }
    ).refine(
      (settings) => {
        // If SMS or WhatsApp channel is enabled, phone number must be provided
        if ((settings.channels & CHANNEL_SMS) !== 0 || (settings.channels & CHANNEL_WHATSAPP) !== 0) {
          const phone = settings.phone_number || '';
          return phone.length > 0;
        }
        return true;
      },
      { message: t('userProfile.errors.phoneRequired'), path: ['phone_number'] }
    ),
  });

  // Form validation using Zod
  const validateForm = (): { isValid: boolean; errors: Record<string, string> } => {
    const schema = createProfileSchema();
    const result = schema.safeParse({
      firstName: formData.firstName || '',
      lastName: formData.lastName || '',
      city: formData.city || '',
      notification_settings: {
        channels: formData.notification_settings?.channels ?? CHANNEL_EMAIL,
        email: formData.notification_settings?.email ?? '',
        phone_number: formData.notification_settings?.phone_number ?? '',
        debug_address: formData.notification_settings?.debug_address ?? '',
      },
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

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.getUserProfile();
      if (response.profile) {
        // Get user's email from Clerk
        const clerkEmail = user?.emailAddresses[0]?.emailAddress || '';

        // Pre-populate email if not set in notification settings
        const notificationSettings = response.profile.notification_settings || {
          channels: CHANNEL_EMAIL,
          email: '',
          phone_number: '',
          debug_address: '',
        };

        // If email is empty, use Clerk email
        if (!notificationSettings.email && clerkEmail) {
          notificationSettings.email = clerkEmail;
        }

        setFormData({
          ...response.profile,
          notification_settings: notificationSettings,
        });
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setError(t('userProfile.errors.failedToLoad'));
    } finally {
      setLoading(false);
    }
  }, [api, user, t]);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user, loadProfile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'ntrpLevel' ? parseFloat(value) : value
    }));
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const { [name]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleNotificationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      notification_settings: {
        ...prev.notification_settings!,
        [name]: value
      }
    }));
    // Clear validation error for this notification field
    const errorKey = `notification_settings.${name}`;
    if (validationErrors[errorKey]) {
      setValidationErrors(prev => {
        const { [errorKey]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const isChannelEnabled = (channel: number): boolean => {
    return ((formData.notification_settings?.channels || 0) & channel) !== 0;
  };

  const toggleChannel = (channel: number) => {
    setFormData(prev => {
      const currentChannels = prev.notification_settings?.channels || 0;
      const newChannels = currentChannels ^ channel;

      // Ensure at least one channel is enabled
      if (newChannels === 0) {
        setValidationErrors(prevErrors => ({
          ...prevErrors,
          'notification_settings.channels': t('userProfile.notifications.validation')
        }));
        return prev;
      }

      // Clear channels validation error
      setValidationErrors(prevErrors => {
        const { 'notification_settings.channels': _, ...rest } = prevErrors;
        return rest;
      });
      return {
        ...prev,
        notification_settings: {
          ...prev.notification_settings!,
          channels: newChannels
        }
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

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
    setSaving(true);

    try {
      await api.updateUserProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        city: formData.city,
        country: formData.country,
        language: formData.language,
        ntrpLevel: formData.ntrpLevel,
        notification_settings: formData.notification_settings,
      });

      setSuccess(t('userProfile.success.profileUpdated'));
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(t('userProfile.errors.failedToUpdate'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await api.deleteUserProfile();
      setSuccess(t('userProfile.success.accountDeleted'));
      // Sign out and redirect after a brief delay
      setTimeout(async () => {
        await signOut();
        navigate('/');
      }, 1500);
    } catch (err) {
      console.error('Error deleting account:', err);
      setError(t('userProfile.errors.failedToDelete'));
      setShowDeleteModal(false);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <Row className="justify-content-center">
        <Col lg={8}>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="mb-0">{t('userProfile.title')}</h2>
            {user?.emailAddresses[0]?.emailAddress && (
              <small className="text-muted">
                <i className="bi bi-envelope me-1"></i>
                {user.emailAddresses[0].emailAddress}
              </small>
            )}
          </div>

          {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
          {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

          <Form onSubmit={handleSubmit} noValidate>
            {/* Personal Information Section */}
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">{t('userProfile.sections.personalInfo')}</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>{t('userProfile.fields.firstName')}</Form.Label>
                      {validationErrors.firstName && (
                        <div className="alert alert-danger alert-sm py-1 px-2 mb-2" role="alert">
                          <small><i className="bi bi-exclamation-triangle me-1"></i>
                          {validationErrors.firstName}</small>
                        </div>
                      )}
                      <Form.Control
                        type="text"
                        name="firstName"
                        value={formData.firstName || ''}
                        onChange={handleChange}
                        isInvalid={!!validationErrors.firstName}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>{t('userProfile.fields.lastName')}</Form.Label>
                      {validationErrors.lastName && (
                        <div className="alert alert-danger alert-sm py-1 px-2 mb-2" role="alert">
                          <small><i className="bi bi-exclamation-triangle me-1"></i>
                          {validationErrors.lastName}</small>
                        </div>
                      )}
                      <Form.Control
                        type="text"
                        name="lastName"
                        value={formData.lastName || ''}
                        onChange={handleChange}
                        isInvalid={!!validationErrors.lastName}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>{t('userProfile.fields.city')}</Form.Label>
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
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>{t('userProfile.fields.country')}</Form.Label>
                      <Form.Select
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        required
                      >
                        {COUNTRIES.map(country => (
                          <option key={country.code} value={country.name}>
                            {country.name}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>{t('userProfile.fields.language')}</Form.Label>
                      <Form.Select
                        name="language"
                        value={formData.language}
                        onChange={handleChange}
                        required
                      >
                        {LANGUAGES.map(lang => (
                          <option key={lang.code} value={lang.code}>
                            {lang.name}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>{t('userProfile.fields.ntrpLevel')}</Form.Label>
                      <Form.Select
                        name="ntrpLevel"
                        value={formData.ntrpLevel}
                        onChange={handleChange}
                        required
                      >
                        {getNtrpLevels().map(level => (
                          <option key={level.value} value={level.value}>
                            {level.label}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Notification Settings Section */}
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">{t('userProfile.sections.notifications')}</h5>
              </Card.Header>
              <Card.Body>
                {validationErrors['notification_settings.channels'] && (
                  <div className="alert alert-danger alert-sm py-1 px-2 mb-3" role="alert">
                    <small><i className="bi bi-exclamation-triangle me-1"></i>
                    {validationErrors['notification_settings.channels']}</small>
                  </div>
                )}
                {/* Email Notifications */}
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    id="channel-email"
                    label={t('userProfile.notifications.channels.email')}
                    checked={isChannelEnabled(CHANNEL_EMAIL)}
                    onChange={() => toggleChannel(CHANNEL_EMAIL)}
                  />
                  {isChannelEnabled(CHANNEL_EMAIL) && (
                    <>
                      {validationErrors['notification_settings.email'] && (
                        <div className="alert alert-danger alert-sm py-1 px-2 mt-2 mb-1" role="alert">
                          <small><i className="bi bi-exclamation-triangle me-1"></i>
                          {validationErrors['notification_settings.email']}</small>
                        </div>
                      )}
                      <Form.Control
                        type="email"
                        name="email"
                        placeholder={t('userProfile.fields.email')}
                        value={formData.notification_settings?.email || ''}
                        onChange={handleNotificationChange}
                        className="mt-2"
                        isInvalid={!!validationErrors['notification_settings.email']}
                        required={isChannelEnabled(CHANNEL_EMAIL)}
                      />
                    </>
                  )}
                </Form.Group>

                {/* SMS Notifications */}
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    id="channel-sms"
                    label={t('userProfile.notifications.channels.sms')}
                    checked={isChannelEnabled(CHANNEL_SMS)}
                    onChange={() => toggleChannel(CHANNEL_SMS)}
                  />
                  {isChannelEnabled(CHANNEL_SMS) && (
                    <>
                      {validationErrors['notification_settings.phone_number'] && (
                        <div className="alert alert-danger alert-sm py-1 px-2 mt-2 mb-1" role="alert">
                          <small><i className="bi bi-exclamation-triangle me-1"></i>
                          {validationErrors['notification_settings.phone_number']}</small>
                        </div>
                      )}
                      <Form.Control
                        type="tel"
                        name="phone_number"
                        placeholder={t('userProfile.fields.phoneNumber')}
                        value={formData.notification_settings?.phone_number || ''}
                        onChange={handleNotificationChange}
                        className="mt-2"
                        isInvalid={!!validationErrors['notification_settings.phone_number']}
                        required={isChannelEnabled(CHANNEL_SMS)}
                      />
                    </>
                  )}
                </Form.Group>

                {/* Push Notifications (future) */}
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    id="channel-push"
                    label={t('userProfile.notifications.channels.push')}
                    checked={isChannelEnabled(CHANNEL_PUSH)}
                    onChange={() => toggleChannel(CHANNEL_PUSH)}
                  />
                </Form.Group>

                {/* WhatsApp Notifications (future) */}
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    id="channel-whatsapp"
                    label={t('userProfile.notifications.channels.whatsapp')}
                    checked={isChannelEnabled(CHANNEL_WHATSAPP)}
                    onChange={() => toggleChannel(CHANNEL_WHATSAPP)}
                  />
                  {isChannelEnabled(CHANNEL_WHATSAPP) && (
                    <>
                      {validationErrors['notification_settings.phone_number'] && !isChannelEnabled(CHANNEL_SMS) && (
                        <div className="alert alert-danger alert-sm py-1 px-2 mt-2 mb-1" role="alert">
                          <small><i className="bi bi-exclamation-triangle me-1"></i>
                          {validationErrors['notification_settings.phone_number']}</small>
                        </div>
                      )}
                      <Form.Control
                        type="tel"
                        name="phone_number"
                        placeholder={t('userProfile.fields.phoneNumber')}
                        value={formData.notification_settings?.phone_number || ''}
                        onChange={handleNotificationChange}
                        className="mt-2"
                        isInvalid={!!validationErrors['notification_settings.phone_number']}
                      />
                    </>
                  )}
                </Form.Group>

                {/* Debug Notifications (dev only) */}
                {import.meta.env.DEV && (
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      id="channel-debug"
                      label={t('userProfile.notifications.channels.debug')}
                      checked={isChannelEnabled(CHANNEL_DEBUG)}
                      onChange={() => toggleChannel(CHANNEL_DEBUG)}
                    />
                    {isChannelEnabled(CHANNEL_DEBUG) && (
                      <Form.Control
                        type="text"
                        name="debug_address"
                        placeholder={t('userProfile.fields.debugAddress')}
                        value={formData.notification_settings?.debug_address || ''}
                        onChange={handleNotificationChange}
                        className="mt-2"
                      />
                    )}
                  </Form.Group>
                )}
              </Card.Body>
            </Card>

            <div className="d-grid gap-2 mb-4">
              <Button
                variant="primary"
                type="submit"
                size="lg"
                disabled={saving}
              >
                {saving ? t('userProfile.buttons.saving') : t('userProfile.buttons.save')}
              </Button>
            </div>
          </Form>

          {/* Danger Zone */}
          <Card className="border-danger">
            <Card.Header className="bg-danger text-white">
              <h5 className="mb-0">{t('userProfile.sections.dangerZone')}</h5>
            </Card.Header>
            <Card.Body>
              <p className="mb-3">{t('userProfile.deleteAccount.warning')}</p>
              <Button
                variant="outline-danger"
                onClick={() => setShowDeleteModal(true)}
              >
                {t('userProfile.buttons.deleteAccount')}
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{t('userProfile.deleteAccount.modalTitle')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="danger">
            {t('userProfile.deleteAccount.modalBody')}
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={deleting}>
            {t('userProfile.buttons.cancel')}
          </Button>
          <Button variant="danger" onClick={handleDeleteAccount} disabled={deleting}>
            {deleting ? t('userProfile.buttons.saving') : t('userProfile.buttons.confirmDelete')}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default UserProfile;

