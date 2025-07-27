import React from 'react';
import { SignInButton, SignUpButton } from '@clerk/clerk-react';
import './LandingPage.css';

// Check if Clerk is available
const isClerkAvailable = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const LandingPage: React.FC = () => {
  const flowSteps = [
    {
      icon: 'bi-plus-circle',
      title: 'Create Event',
      description: 'Share your preferred times and courts for a tennis session'
    },
    {
      icon: 'bi-search',
      title: 'Find Partner',
      description: 'Other players browse and join events that match their schedule'
    },
    {
      icon: 'bi-calendar-check',
      title: 'Get Matched',
      description: 'Host confirms the session and books the court'
    },
    {
      icon: 'bi-trophy',
      title: 'Play Tennis',
      description: 'Meet up and enjoy your game together'
    }
  ];

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <div className="hero-section text-center mb-5">
        <div className="hero-icon mb-3">
          <i className="bi bi-trophy-fill tennis-accent" style={{ fontSize: '4rem' }}></i>
        </div>
        <h1 className="display-4 mb-3" style={{ color: 'var(--tennis-navy)' }}>
          Find Your Tennis Partner
        </h1>
        <p className="lead text-muted mb-4">
          Connect with tennis players in your area. Schedule sessions, share courts, and improve your game together.
        </p>

        {/* Action Buttons */}
        <div className="d-flex justify-content-center gap-3 mb-5">
          {isClerkAvailable ? (
            <SignUpButton mode="modal">
              <button className="btn btn-primary btn-lg px-4">
                <i className="bi bi-person-plus me-2"></i>
                Get Started
              </button>
            </SignUpButton>
          ) : (
            <button className="btn btn-primary btn-lg px-4" disabled>
              <i className="bi bi-person-plus me-2"></i>
              Get Started
            </button>
          )}

          {isClerkAvailable ? (
            <SignInButton mode="modal">
              <button className="btn btn-outline-primary btn-lg px-4">
                <i className="bi bi-box-arrow-in-right me-2"></i>
                Sign In
              </button>
            </SignInButton>
          ) : (
            <button className="btn btn-outline-primary btn-lg px-4" disabled>
              <i className="bi bi-box-arrow-in-right me-2"></i>
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* How It Works Section */}
      <div className="how-it-works">
        <div className="text-center mb-4">
          <h2 className="h3 mb-3" style={{ color: 'var(--tennis-navy)' }}>How It Works</h2>
          <p className="text-muted">Simple steps to find and schedule your next tennis session</p>
        </div>

        <div className="flow-container">
          <div className="flow-steps">
            {flowSteps.map((step, index) => (
              <React.Fragment key={index}>
                <div className="flow-step">
                  <div className="step-icon">
                    <i className={`bi ${step.icon}`}></i>
                  </div>
                  <div className="step-content">
                    <h6 className="step-title">{step.title}</h6>
                    <p className="step-description">{step.description}</p>
                  </div>
                </div>
                {index < flowSteps.length - 1 && (
                  <div className="flow-connector" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="features mt-5">
          <div className="row">
            <div className="col-md-4 text-center mb-4">
              <div className="feature-icon mb-3">
                <i className="bi bi-share tennis-accent" style={{ fontSize: '2.5rem' }}></i>
              </div>
              <h5>Share Events</h5>
              <p className="text-muted">Share your tennis events with friends via social media and messaging apps</p>
            </div>
            <div className="col-md-4 text-center mb-4">
              <div className="feature-icon mb-3">
                <i className="bi bi-geo-alt tennis-accent" style={{ fontSize: '2.5rem' }}></i>
              </div>
              <h5>Local Courts</h5>
              <p className="text-muted">Find players at courts near you and discover new places to play</p>
            </div>
            <div className="col-md-4 text-center mb-4">
              <div className="feature-icon mb-3">
                <i className="bi bi-clock tennis-accent" style={{ fontSize: '2.5rem' }}></i>
              </div>
              <h5>Flexible Scheduling</h5>
              <p className="text-muted">Match with players who share your availability and playing preferences</p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="cta-section text-center mt-5 p-4 bg-light rounded">
          <h3 className="mb-3" style={{ color: 'var(--tennis-navy)' }}>Ready to Play?</h3>
          <p className="text-muted mb-4">Join our community of tennis enthusiasts and never play alone again.</p>
          {isClerkAvailable ? (
            <SignUpButton mode="modal">
              <button className="btn btn-primary btn-lg">
                Start Playing Today
              </button>
            </SignUpButton>
          ) : (
            <button className="btn btn-primary btn-lg" disabled>
              Start Playing Today
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LandingPage;