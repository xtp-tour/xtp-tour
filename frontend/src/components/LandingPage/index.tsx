import React from 'react';
import { SignInButton, SignUpButton } from '@clerk/clerk-react';
import './LandingPage.css';

// Check if Clerk is available
const isClerkAvailable = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const LandingPage: React.FC = () => {
  const flowSteps = [
    {
      icon: 'bi-calendar-plus',
      title: '1. Set your availability',
      description: 'Choose your preferred courts, times, and game preferences (singles, doubles, skill level)'
    },
    {
      icon: 'bi-share',
      title: '2. Share your tennis link',
      description: 'Send your link to friends or make it discoverable for other players to find'
    },
    {
      icon: 'bi-calendar-check',
      title: '3. Get booked',
      description: 'Players select their preferred time slot and request to join your session'
    },
    {
      icon: 'bi-trophy',
      title: '4. Play tennis',
      description: 'Meet at the court and enjoy your game - no more scheduling hassles'
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
          Tennis scheduling made simple
        </h1>
        <p className="lead text-muted mb-4">
          No more back-and-forth texting to arrange tennis games. Set your availability, share your session, and let players book time with you automatically.
        </p>

        {/* Action Buttons */}
        <div className="hero-actions">
          <div className="d-flex flex-column flex-md-row justify-content-center gap-3 mb-4">
            {isClerkAvailable ? (
              <SignUpButton mode="modal">
                <button className="btn btn-primary btn-lg px-5 py-3">
                  <i className="bi bi-calendar-plus me-2"></i>
                  Create Your Tennis Link
                </button>
              </SignUpButton>
            ) : (
              <button
                className="btn btn-primary btn-lg px-5 py-3"
                disabled
                style={{ opacity: 0.6 }}
                title="Coming in next couple of weeks"
              >
                <i className="bi bi-calendar-plus me-2"></i>
                Create Your Tennis Link
              </button>
            )}

            {isClerkAvailable ? (
              <SignUpButton mode="modal">
                <button className="btn btn-outline-primary btn-lg px-5 py-3">
                  <i className="bi bi-search me-2"></i>
                  Find Tennis Partners
                </button>
              </SignUpButton>
            ) : (
              <button
                className="btn btn-outline-primary btn-lg px-5 py-3"
                disabled
                style={{ opacity: 0.6 }}
                title="Coming in next couple of weeks"
              >
                <i className="bi bi-search me-2"></i>
                Find Tennis Partners
              </button>
            )}
          </div>
          
          <div className="text-center">
            {isClerkAvailable ? (
              <SignInButton mode="modal">
                <button className="btn btn-link text-muted">
                  Already have an account? <span className="text-primary fw-semibold">Sign In</span>
                </button>
              </SignInButton>
            ) : (
              <button
                className="btn btn-link text-muted"
                disabled
                style={{ opacity: 0.6 }}
                title="Coming in next couple of weeks"
              >
                Already have an account? <span className="text-primary fw-semibold">Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="how-it-works">
        <div className="text-center mb-4">
          <h2 className="h3 mb-3" style={{ color: 'var(--tennis-navy)' }}>Easy scheduling for everyone</h2>
          <p className="text-muted">Just like Calendly, but for tennis players</p>
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
            <div className="col-md-4 mb-4">
              <div className="feature-card text-center">
                <div className="feature-icon">
                  <i className="bi bi-clock-history" style={{ fontSize: '2.8rem' }}></i>
                </div>
                <h5>Save time</h5>
                <p className="text-muted">Eliminate the back-and-forth of finding a time that works for everyone</p>
              </div>
            </div>
            <div className="col-md-4 mb-4">
              <div className="feature-card text-center">
                <div className="feature-icon">
                  <i className="bi bi-people-fill" style={{ fontSize: '2.8rem' }}></i>
                </div>
                <h5>Work better together</h5>
                <p className="text-muted">Connect with players at your skill level for better matches and training</p>
              </div>
            </div>
            <div className="col-md-4 mb-4">
              <div className="feature-card text-center">
                <div className="feature-icon">
                  <i className="bi bi-graph-up" style={{ fontSize: '2.8rem' }}></i>
                </div>
                <h5>Play more tennis</h5>
                <p className="text-muted">Spend less time coordinating and more time on the court improving your game</p>
              </div>
            </div>
          </div>
        </div>

        {/* Game Types Section */}
        <div className="training-section text-center py-5 px-4 mb-4">
          <div className="row align-items-center">
            <div className="col-md-6 mb-4 mb-md-0">
              <h3 className="h2 mb-3" style={{ color: 'var(--tennis-navy)' }}>Your tennis, your way</h3>
              <p className="text-muted mb-4">Set your preferences once and let players book the perfect session with you automatically.</p>
              <div className="d-flex flex-column gap-2 text-start">
                <div className="d-flex align-items-center">
                  <i className="bi bi-trophy text-primary me-3"></i>
                  <div>
                    <strong>Competitive matches</strong> - Singles games with scoring
                  </div>
                </div>
                <div className="d-flex align-items-center">
                  <i className="bi bi-target text-primary me-3"></i>
                  <div>
                    <strong>Training sessions</strong> - Practice and skill development
                  </div>
                </div>
                <div className="d-flex align-items-center">
                  <i className="bi bi-people text-primary me-3"></i>
                  <div>
                    <strong>Doubles matches</strong> - 4-player team games
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="game-features">
                <div className="feature-highlight p-4 rounded">
                  <h5 className="mb-3">What You Can Set:</h5>
                  <ul className="list-unstyled text-start">
                    <li className="mb-2"><i className="bi bi-geo-alt text-primary me-2"></i>Multiple venue options</li>
                    <li className="mb-2"><i className="bi bi-clock text-primary me-2"></i>Flexible time slots (7-day calendar)</li>
                    <li className="mb-2"><i className="bi bi-speedometer text-primary me-2"></i>Skill level matching (NTRP-based)</li>
                    <li className="mb-2"><i className="bi bi-hourglass text-primary me-2"></i>Session duration (1-4 hours)</li>
                    <li className="mb-2"><i className="bi bi-people text-primary me-2"></i>Singles (doubles coming soon)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="cta-section text-center mt-5 p-5 rounded-3">
          <h3 className="mb-3">Easy ahead</h3>
          <p className="mb-4">We take the work out of connecting for tennis. Your schedule, your link, your way.</p>
          
          <div className="d-flex flex-column flex-sm-row justify-content-center gap-3">
            {isClerkAvailable ? (
              <>
                <SignUpButton mode="modal">
                  <button className="btn btn-primary btn-lg px-4">
                    <i className="bi bi-calendar-plus me-2"></i>
                    Start scheduling
                  </button>
                </SignUpButton>
                <SignUpButton mode="modal">
                  <button className="btn btn-outline-light btn-lg px-4">
                    <i className="bi bi-search me-2"></i>
                    Find partners
                  </button>
                </SignUpButton>
              </>
            ) : (
              <>
                <button
                  className="btn btn-primary btn-lg px-4"
                  disabled
                  style={{ opacity: 0.6 }}
                  title="Coming in next couple of weeks"
                >
                  <i className="bi bi-calendar-plus me-2"></i>
                  Start scheduling
                </button>
                <button
                  className="btn btn-outline-light btn-lg px-4"
                  disabled
                  style={{ opacity: 0.6 }}
                  title="Coming in next couple of weeks"
                >
                  <i className="bi bi-search me-2"></i>
                  Find partners
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;