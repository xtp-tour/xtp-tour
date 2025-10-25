import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Form, Button, Row, Col } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useAPI } from '../services/apiProvider';

interface ProfileSetupProps {
  onComplete: () => void;
}

interface APIError {
  status?: number;
  message?: string;
}

// NTRP levels will be defined with i18n support inside the component

export const ProfileSetup: React.FC<ProfileSetupProps> = ({ onComplete }) => {
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
  const [initialLoading, setInitialLoading] = useState(true);
  const [profileExists, setProfileExists] = useState(false);

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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
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
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>{t('profileSetup.fields.firstName')}</Form.Label>
                  <Form.Control
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>{t('profileSetup.fields.lastName')}</Form.Label>
                  <Form.Control
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
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
                  <Form.Control
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
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