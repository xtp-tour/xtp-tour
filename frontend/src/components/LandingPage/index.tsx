import React from 'react';
import { SignInButton, SignUpButton } from '@clerk/clerk-react';
import './LandingPage.css';

const isClerkAvailable = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const LandingPage: React.FC = () => {
  const steps = [
    {
      icon: 'bi-calendar3',
      title: 'Set the session',
      description: 'Choose format, preferred courts, time windows, player count, and an NTRP range.'
    },
    {
      icon: 'bi-link-45deg',
      title: 'Share the link',
      description: 'Send it to friends or keep it discoverable for nearby players.'
    },
    {
      icon: 'bi-clipboard-check',
      title: 'Review requests',
      description: 'See who matches your slots and confirm the lineup.'
    },
    {
      icon: 'bi-balloon-heart',
      title: 'Sync & play',
      description: 'Send confirmations and push the session to Google Calendar.'
    }
  ];

  const features = [
    {
      icon: 'bi-star',
      title: 'Easy coordination',
      description: 'Manage time windows, courts, and flexible player counts in minutes.'
    },
    {
      icon: 'bi-shuffle',
      title: 'Partner matching',
      description: 'NTRP filters and join requests keep skill levels predictable.'
    },
    {
      icon: 'bi-calendar-week',
      title: 'Calendar integration',
      description: 'Optional Google Calendar sync blocks conflicts automatically.'
    },
    {
      icon: 'bi-translate',
      title: 'Share anywhere',
      description: 'A single link works for chats, clubs, or public discovery pages.'
    }
  ];

  const gameTypes = [
    { label: 'Singles matches', description: 'Straightforward two-player challenges.' },
    { label: 'Training sessions', description: 'Hitting practice, drills, or coaching time.' },
    {
      label: 'Doubles & group play (coming soon)',
      description: 'Flexible slots for up to four players when doubles support lands.'
    }
  ];

  const controls = [
    'Multiple venues in one invite',
    '7-day availability grid',
    'Session length control (1–4 hours)',
    'Player count from 1-on-1 to four players',
    'NTRP filters for every level',
    'Optional notes for drills or match details'
  ];

  const disabledTitle = 'Coming soon';

  const renderPrimaryButton = (label: string, icon: string) =>
    isClerkAvailable ? (
      <SignUpButton mode="modal">
        <button className="lp-btn lp-btn-primary">
          <i className={`bi ${icon} me-2`} />
          {label}
        </button>
      </SignUpButton>
    ) : (
      <button className="lp-btn lp-btn-primary" disabled title={disabledTitle}>
        <i className={`bi ${icon} me-2`} />
        {label}
      </button>
    );

  const renderSecondaryButton = (label: string, icon: string) =>
    isClerkAvailable ? (
      <SignUpButton mode="modal">
        <button className="lp-btn lp-btn-secondary">
          <i className={`bi ${icon} me-2`} />
          {label}
        </button>
      </SignUpButton>
    ) : (
      <button className="lp-btn lp-btn-secondary" disabled title={disabledTitle}>
        <i className={`bi ${icon} me-2`} />
        {label}
      </button>
    );

  return (
    <div className="landing">
      <header className="lp-hero text-center">
        <h1 className="lp-hero-title">Schedule tennis without the group chat</h1>
        <p className="lp-hero-subtitle">
          Set your courts, time windows, and player level once. Share a link so partners pick the slot
          that works.
        </p>
        <div className="lp-hero-actions">
          {renderPrimaryButton('Create a session', 'bi-calendar-plus')}
          {renderSecondaryButton('Browse public sessions', 'bi-search')}
        </div>
        <p className="lp-microcopy">No login needed to view public events.</p>
        <div className="lp-signin">
          {isClerkAvailable ? (
            <SignInButton mode="modal">
              <button className="lp-link">
                Already using XTP Tour? <span>Sign in</span>
              </button>
            </SignInButton>
          ) : (
            <button className="lp-link" disabled title={disabledTitle}>
              Already using XTP Tour? <span>Sign in</span>
            </button>
          )}
        </div>
      </header>

      <section className="lp-section">
        <p className="lp-eyebrow">How it works</p>
        <h2 className="lp-section-title">A quick flow built for real players.</h2>
        <div className="lp-steps">
          {steps.map((step) => (
            <div key={step.title} className="lp-card lp-step-card">
              <div className="lp-step-icon">
                <i className={`bi ${step.icon}`} />
              </div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-section">
        <p className="lp-eyebrow">Why players stick around</p>
        <h2 className="lp-section-title">Everything you need for fast coordination.</h2>
        <div className="lp-features">
          {features.map((feature) => (
            <div key={feature.title} className="lp-card lp-feature-card">
              <div className="lp-feature-icon">
                <i className={`bi ${feature.icon}`} />
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-section lp-game-types">
        <div className="lp-game-content lp-card">
          <div>
            <p className="lp-eyebrow">Game types</p>
            <h2 className="lp-section-title">Pick the format and number of players.</h2>
            <div className="lp-game-list">
              {gameTypes.map((type) => (
                <div key={type.label}>
                  <strong>{type.label}</strong>
                  <p>{type.description}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="lp-controls">
            <h3>What you control</h3>
            <ul>
              {controls.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="lp-badge">Syncs with Google Calendar — optional but handy.</div>
          </div>
        </div>
      </section>

      <section className="lp-section lp-cta">
        <p className="lp-eyebrow">Final serve</p>
        <h2 className="lp-section-title">Plan your next session</h2>
        <p className="lp-cta-text">
          Share one link to line up the right time, place, and partners. Less chat, more court time.
        </p>
        <div className="lp-hero-actions">
          {renderPrimaryButton('Start scheduling', 'bi-calendar-plus')}
          {renderSecondaryButton('Find partners', 'bi-people')}
        </div>
        <p className="lp-microcopy">Just browsing? View public sessions first.</p>
      </section>
    </div>
  );
};

export default LandingPage;