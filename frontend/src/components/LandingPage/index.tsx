import React from 'react';
import { SignInButton, SignUpButton } from '@clerk/clerk-react';
import './LandingPage.css';

// Check if Clerk is available
const isClerkAvailable = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const LandingPage: React.FC = () => {
  const flowSteps = [
    {
      icon: 'bi-plus-circle',
      title: 'Create an Event',
      description: 'Pick a date, time and location you prefer'
    },
    {
      icon: 'bi-share',
      title: 'Share or Go Public',
      description: 'Send a link to friends or make it visible to everyone'
    },
    {
      icon: 'bi-person-plus',
      title: 'Players Request to Join',
      description: 'People ask to join your event; you stay in control'
    },
    {
      icon: 'bi-calendar-check',
      title: 'Confirm and Book',
      description: 'Pick who plays, then book the court'
    },
    {
      icon: 'bi-trophy',
      title: 'Enjoy the Game',
      description: 'Show up and have fun'
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
          Plan a Tennis Game
        </h1>
        <p className="lead text-muted mb-4">
          Create an event, invite friends or make it public, and get on court fast.
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
            <button
              className="btn btn-primary btn-lg px-4"
              disabled
              style={{ opacity: 0.6 }}
              title="Coming in next couple of weeks"
            >
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
            <button
              className="btn btn-outline-primary btn-lg px-4"
              disabled
              style={{ opacity: 0.6 }}
              title="Coming in next couple of weeks"
            >
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
                     <p className="text-muted">A simple flow to plan and run a tennis game</p>
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
              <h5>Easy Sharing</h5>
              <p className="text-muted">Share your event link anywhere: WhatsApp, Messenger, email, socials</p>
            </div>
            <div className="col-md-4 text-center mb-4">
              <div className="feature-icon mb-3">
                <i className="bi bi-eye tennis-accent" style={{ fontSize: '2.5rem' }}></i>
              </div>
              <h5>Public Events</h5>
              <p className="text-muted">Make it public so nearby players can request to join</p>
            </div>
            <div className="col-md-4 text-center mb-4">
              <div className="feature-icon mb-3">
                <i className="bi bi-people tennis-accent" style={{ fontSize: '2.5rem' }}></i>
              </div>
              <h5>You Pick Who Plays</h5>
              <p className="text-muted">Approve requests and lock in the final lineup before booking</p>
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
            <button
              className="btn btn-primary btn-lg"
              disabled
              style={{ opacity: 0.6 }}
              title="Coming in next couple of weeks"
            >
              Start Playing Today
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LandingPage;