import React from 'react';
import { SignInButton, SignUpButton } from '@clerk/clerk-react';
import './LandingPage.css';

// Check if Clerk is available
const isClerkAvailable = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const LandingPage: React.FC = () => {
  const flowSteps = [
    {
      icon: 'bi-calendar-plus',
      title: 'Create Event',
      description: 'Set your preferred date, time, and location for a tennis session'
    },
    {
      icon: 'bi-share',
      title: 'Share with Friends',
      description: 'Share your event via social media or make it public for everyone to discover'
    },
    {
      icon: 'bi-person-plus',
      title: 'Players Request to Join',
      description: 'Tennis players browse and request to join your event'
    },
    {
      icon: 'bi-people',
      title: 'Select Players',
      description: 'Choose who gets to play from those who requested to join'
    },
    {
      icon: 'bi-check-circle',
      title: 'Book & Play',
      description: 'Confirm the court booking and enjoy your tennis game together'
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
          Organize Your Tennis Events
        </h1>
        <p className="lead text-muted mb-4">
          Create tennis events, invite friends, and build your tennis community. Share your court time and make every game happen.
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
              <h5>Share Your Events</h5>
              <p className="text-muted">Share your tennis events with friends via social media or make them public for anyone to join</p>
            </div>
            <div className="col-md-4 text-center mb-4">
              <div className="feature-icon mb-3">
                <i className="bi bi-people tennis-accent" style={{ fontSize: '2.5rem' }}></i>
              </div>
              <h5>Choose Your Players</h5>
              <p className="text-muted">Review join requests and select the perfect players for your tennis session</p>
            </div>
            <div className="col-md-4 text-center mb-4">
              <div className="feature-icon mb-3">
                <i className="bi bi-calendar-event tennis-accent" style={{ fontSize: '2.5rem' }}></i>
              </div>
              <h5>Easy Event Management</h5>
              <p className="text-muted">Create, manage, and organize tennis events with flexible scheduling options</p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="cta-section text-center mt-5 p-4 bg-light rounded">
          <h3 className="mb-3" style={{ color: 'var(--tennis-navy)' }}>Ready to Organize?</h3>
          <p className="text-muted mb-4">Start creating tennis events and build your local tennis community today.</p>
          {isClerkAvailable ? (
            <SignUpButton mode="modal">
              <button className="btn btn-primary btn-lg">
                Create Your First Event
              </button>
            </SignUpButton>
                    ) : (
            <button
              className="btn btn-primary btn-lg"
              disabled
              style={{ opacity: 0.6 }}
              title="Coming in next couple of weeks"
            >
              Create Your First Event
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LandingPage;