import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Form, Button, Row, Col } from 'react-bootstrap';
import { useAPI } from '../services/apiProvider';

interface ProfileSetupProps {
  onComplete: () => void;
}

interface APIError {
  status?: number;
  message?: string;
}

const NTRP_LEVELS = [
  { value: 1.0, label: '1.0 - New Player: Just starting to learn tennis' },
  { value: 1.5, label: '1.5 - Beginner: Limited experience, working on getting ball in play' },
  { value: 2.0, label: '2.0 - Novice: Needs court experience, obvious stroke weaknesses' },
  { value: 2.5, label: '2.5 - Advanced Novice: Learning ball judgment, can sustain slow rallies' },
  { value: 3.0, label: '3.0 - Intermediate: Fairly consistent on medium-paced shots' },
  { value: 3.5, label: '3.5 - Advanced Intermediate: Improved stroke dependability with directional control' },
  { value: 4.0, label: '4.0 - Advanced: Dependable strokes with depth and directional control' },
  { value: 4.5, label: '4.5 - Expert: Beginning to master power and spins, sound footwork' },
  { value: 5.0, label: '5.0 - Elite: Good shot anticipation, can structure game around strengths' },
  { value: 5.5, label: '5.5 - Elite+: Developed power/consistency as major weapon' },
  { value: 6.0, label: '6.0 - Tournament: Intensive training, sectional/national ranking' },
  { value: 7.0, label: '7.0 - Professional: World-class player' },
];

export const ProfileSetup: React.FC<ProfileSetupProps> = ({ onComplete }) => {
  const { user } = useUser();
  const api = useAPI();
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    ntrpLevel: '',
    preferredCity: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [profileExists, setProfileExists] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await api.getUserProfile();
        if (response.profile) {
          // Profile exists, check if it's complete
          const profile = response.profile;
          const isComplete = profile.firstName && profile.lastName && profile.ntrpLevel && profile.preferredCity;
          
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
            preferredCity: profile.preferredCity || '',
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
  }, [api, user, onComplete]);

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
          preferredCity: formData.preferredCity,
        });
      } else {
        // Create new profile
        await api.createUserProfile({
          firstName: formData.firstName,
          lastName: formData.lastName,
          ntrpLevel: parseFloat(formData.ntrpLevel),
          preferredCity: formData.preferredCity,
        });
      }
      onComplete();
    } catch (error: unknown) {
      console.error('Error saving profile:', error);
      setError('Failed to save profile. Please try again.');
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
                <h2 className="mb-4">Loading Profile...</h2>
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
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
                {profileExists ? 'Complete Your Profile' : 'Create Your Profile'}
              </h2>
              {error && <div className="alert alert-danger">{error}</div>}
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>First Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Last Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>NTRP Level</Form.Label>
                  <Form.Text className="text-muted d-block mb-2">
                    The National Tennis Rating Program (NTRP) helps match players of similar skill levels. 
                    <a 
                      href="https://www.usta.com/en/home/coach-organize/tennis-tool-center/run-usta-programs/national/understanding-ntrp-ratings.html" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="ms-1"
                    >
                      Learn more about NTRP ratings →
                    </a>
                  </Form.Text>
                  <Form.Select
                    name="ntrpLevel"
                    value={formData.ntrpLevel}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select your NTRP level</option>
                    {NTRP_LEVELS.map(level => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Preferred City</Form.Label>
                  <Form.Control
                    type="text"
                    name="preferredCity"
                    value={formData.preferredCity}
                    onChange={handleChange}
                    required
                    placeholder="Enter your preferred city"
                  />
                </Form.Group>

                <Button
                  variant="primary"
                  type="submit"
                  className="w-100"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : (profileExists ? 'Update Profile' : 'Create Profile')}
                </Button>
              </Form>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
}; 