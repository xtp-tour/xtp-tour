import React from 'react';
import { SignInButton, SignUpButton } from '@clerk/clerk-react';
import { useTranslation } from 'react-i18next';
import './LandingPage.css';

// Check if Clerk is available
const isClerkAvailable = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const LandingPage: React.FC = () => {
  const { t } = useTranslation();
  
  const flowSteps = [
    {
      icon: 'bi-calendar-plus',
      title: t('landing.howItWorks.steps.step1.title'),
      description: t('landing.howItWorks.steps.step1.description')
    },
    {
      icon: 'bi-share',
      title: t('landing.howItWorks.steps.step2.title'),
      description: t('landing.howItWorks.steps.step2.description')
    },
    {
      icon: 'bi-calendar-check',
      title: t('landing.howItWorks.steps.step3.title'),
      description: t('landing.howItWorks.steps.step3.description')
    },
    {
      icon: 'bi-trophy',
      title: t('landing.howItWorks.steps.step4.title'),
      description: t('landing.howItWorks.steps.step4.description')
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
          {t('landing.hero.title')}
        </h1>
        <p className="lead text-muted mb-4">
          {t('landing.hero.subtitle')}
        </p>

        {/* Action Buttons */}
        <div className="hero-actions">
          <div className="d-flex flex-column flex-md-row justify-content-center gap-3 mb-4">
            {isClerkAvailable ? (
              <SignUpButton mode="modal">
                <button className="btn btn-primary btn-lg px-5 py-3">
                  <i className="bi bi-calendar-plus me-2"></i>
                  {t('landing.hero.createLink')}
                </button>
              </SignUpButton>
            ) : (
              <button
                className="btn btn-primary btn-lg px-5 py-3"
                disabled
                style={{ opacity: 0.6 }}
                title={t('auth.comingSoon')}
              >
                <i className="bi bi-calendar-plus me-2"></i>
                {t('landing.hero.createLink')}
              </button>
            )}

            {isClerkAvailable ? (
              <SignUpButton mode="modal">
                <button className="btn btn-outline-primary btn-lg px-5 py-3">
                  <i className="bi bi-search me-2"></i>
                  {t('landing.hero.findPartners')}
                </button>
              </SignUpButton>
            ) : (
              <button
                className="btn btn-outline-primary btn-lg px-5 py-3"
                disabled
                style={{ opacity: 0.6 }}
                title={t('auth.comingSoon')}
              >
                <i className="bi bi-search me-2"></i>
                {t('landing.hero.findPartners')}
              </button>
            )}
          </div>
          
          <div className="text-center">
            {isClerkAvailable ? (
              <SignInButton mode="modal">
                <button className="btn btn-link text-muted">
                  {t('landing.hero.alreadyHaveAccount')} <span className="text-primary fw-semibold">{t('landing.hero.signInLink')}</span>
                </button>
              </SignInButton>
            ) : (
              <button
                className="btn btn-link text-muted"
                disabled
                style={{ opacity: 0.6 }}
                title={t('auth.comingSoon')}
              >
                {t('landing.hero.alreadyHaveAccount')} <span className="text-primary fw-semibold">{t('landing.hero.signInLink')}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="how-it-works">
        <div className="text-center mb-4">
          <h2 className="h3 mb-3" style={{ color: 'var(--tennis-navy)' }}>{t('landing.howItWorks.title')}</h2>
          <p className="text-muted">{t('landing.howItWorks.subtitle')}</p>
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
                <h5>{t('landing.features.saveTime.title')}</h5>
                <p className="text-muted">{t('landing.features.saveTime.description')}</p>
              </div>
            </div>
            <div className="col-md-4 mb-4">
              <div className="feature-card text-center">
                <div className="feature-icon">
                  <i className="bi bi-people-fill" style={{ fontSize: '2.8rem' }}></i>
                </div>
                <h5>{t('landing.features.workTogether.title')}</h5>
                <p className="text-muted">{t('landing.features.workTogether.description')}</p>
              </div>
            </div>
            <div className="col-md-4 mb-4">
              <div className="feature-card text-center">
                <div className="feature-icon">
                  <i className="bi bi-graph-up" style={{ fontSize: '2.8rem' }}></i>
                </div>
                <h5>{t('landing.features.playMore.title')}</h5>
                <p className="text-muted">{t('landing.features.playMore.description')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Game Types Section */}
        <div className="training-section text-center py-5 px-4 mb-4">
          <div className="row align-items-center">
            <div className="col-md-6 mb-4 mb-md-0">
              <h3 className="h2 mb-3" style={{ color: 'var(--tennis-navy)' }}>{t('landing.gameTypes.title')}</h3>
              <p className="text-muted mb-4">{t('landing.gameTypes.subtitle')}</p>
              <div className="d-flex flex-column gap-2 text-start">
                <div className="d-flex align-items-center">
                  <i className="bi bi-trophy text-primary me-3"></i>
                  <div>
                    <strong>{t('landing.gameTypes.competitive')}</strong>
                  </div>
                </div>
                <div className="d-flex align-items-center">
                  <i className="bi bi-target text-primary me-3"></i>
                  <div>
                    <strong>{t('landing.gameTypes.training')}</strong>
                  </div>
                </div>
                <div className="d-flex align-items-center">
                  <i className="bi bi-people text-primary me-3"></i>
                  <div>
                    <strong>{t('landing.gameTypes.doubles')}</strong>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="game-features">
                <div className="feature-highlight p-4 rounded">
                  <h5 className="mb-3">{t('landing.gameTypes.whatYouCanSet')}</h5>
                  <ul className="list-unstyled text-start">
                    <li className="mb-2"><i className="bi bi-geo-alt text-primary me-2"></i>{t('landing.gameTypes.features.multipleVenues')}</li>
                    <li className="mb-2"><i className="bi bi-clock text-primary me-2"></i>{t('landing.gameTypes.features.flexibleTimeSlots')}</li>
                    <li className="mb-2"><i className="bi bi-speedometer text-primary me-2"></i>{t('landing.gameTypes.features.skillLevelMatching')}</li>
                    <li className="mb-2"><i className="bi bi-hourglass text-primary me-2"></i>{t('landing.gameTypes.features.sessionDuration')}</li>
                    <li className="mb-2"><i className="bi bi-people text-primary me-2"></i>{t('landing.gameTypes.features.singlesOnly')}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="cta-section text-center mt-5 p-5 rounded-3">
          <h3 className="mb-3">{t('landing.cta.title')}</h3>
          <p className="mb-4">{t('landing.cta.subtitle')}</p>
          
          <div className="d-flex flex-column flex-sm-row justify-content-center gap-3">
            {isClerkAvailable ? (
              <>
                <SignUpButton mode="modal">
                  <button className="btn btn-primary btn-lg px-4">
                    <i className="bi bi-calendar-plus me-2"></i>
                    {t('landing.cta.startScheduling')}
                  </button>
                </SignUpButton>
                <SignUpButton mode="modal">
                  <button className="btn btn-outline-light btn-lg px-4">
                    <i className="bi bi-search me-2"></i>
                    {t('landing.cta.findPartners')}
                  </button>
                </SignUpButton>
              </>
            ) : (
              <>
                <button
                  className="btn btn-primary btn-lg px-4"
                  disabled
                  style={{ opacity: 0.6 }}
                  title={t('auth.comingSoon')}
                >
                  <i className="bi bi-calendar-plus me-2"></i>
                  {t('landing.cta.startScheduling')}
                </button>
                <button
                  className="btn btn-outline-light btn-lg px-4"
                  disabled
                  style={{ opacity: 0.6 }}
                  title={t('auth.comingSoon')}
                >
                  <i className="bi bi-search me-2"></i>
                  {t('landing.cta.findPartners')}
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