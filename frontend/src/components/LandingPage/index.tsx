import React from 'react';
import { SignInButton, SignUpButton } from '@clerk/clerk-react';
import { useTranslation } from 'react-i18next';
import './LandingPage.css';

const isClerkAvailable = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const LandingPage: React.FC = () => {
  const { t } = useTranslation();

  const steps = [
    {
      icon: 'bi-calendar3',
      titleKey: 'landing.howItWorks.steps.setSession.title',
      descriptionKey: 'landing.howItWorks.steps.setSession.description'
    },
    {
      icon: 'bi-link-45deg',
      titleKey: 'landing.howItWorks.steps.shareLink.title',
      descriptionKey: 'landing.howItWorks.steps.shareLink.description'
    },
    {
      icon: 'bi-clipboard-check',
      titleKey: 'landing.howItWorks.steps.reviewRequests.title',
      descriptionKey: 'landing.howItWorks.steps.reviewRequests.description'
    },
    {
      icon: 'bi-balloon-heart',
      titleKey: 'landing.howItWorks.steps.syncPlay.title',
      descriptionKey: 'landing.howItWorks.steps.syncPlay.description'
    }
  ];

  const features = [
    {
      icon: 'bi-star',
      titleKey: 'landing.features.easyCoordination.title',
      descriptionKey: 'landing.features.easyCoordination.description'
    },
    {
      icon: 'bi-shuffle',
      titleKey: 'landing.features.partnerMatching.title',
      descriptionKey: 'landing.features.partnerMatching.description'
    },
    {
      icon: 'bi-calendar-week',
      titleKey: 'landing.features.calendarIntegration.title',
      descriptionKey: 'landing.features.calendarIntegration.description'
    },
    {
      icon: 'bi-share',
      titleKey: 'landing.features.shareAnywhere.title',
      descriptionKey: 'landing.features.shareAnywhere.description'
    }
  ];

  const gameTypes = [
    {
      labelKey: 'landing.gameTypes.singles.label',
      descriptionKey: 'landing.gameTypes.singles.description'
    },
    {
      labelKey: 'landing.gameTypes.training.label',
      descriptionKey: 'landing.gameTypes.training.description'
    },
    {
      labelKey: 'landing.gameTypes.doubles.label',
      descriptionKey: 'landing.gameTypes.doubles.description'
    }
  ];

  const controlKeys = [
    'landing.gameTypes.controls.multipleCourts',
    'landing.gameTypes.controls.weekAvailability',
    'landing.gameTypes.controls.sessionLength',
    'landing.gameTypes.controls.playerCount',
    'landing.gameTypes.controls.ntrpFilters',
    'landing.gameTypes.controls.optionalNotes'
  ];

  const disabledTitle = t('landing.comingSoon');

  const renderPrimaryButton = (labelKey: string, icon: string) =>
    isClerkAvailable ? (
      <SignUpButton mode="modal">
        <button className="lp-btn lp-btn-primary">
          <i className={`bi ${icon} me-2`} />
          {t(labelKey)}
        </button>
      </SignUpButton>
    ) : (
      <button className="lp-btn lp-btn-primary" disabled title={disabledTitle}>
        <i className={`bi ${icon} me-2`} />
        {t(labelKey)}
      </button>
    );

  const renderSecondaryButton = (labelKey: string, icon: string) =>
    isClerkAvailable ? (
      <SignUpButton mode="modal">
        <button className="lp-btn lp-btn-secondary">
          <i className={`bi ${icon} me-2`} />
          {t(labelKey)}
        </button>
      </SignUpButton>
    ) : (
      <button className="lp-btn lp-btn-secondary" disabled title={disabledTitle}>
        <i className={`bi ${icon} me-2`} />
        {t(labelKey)}
      </button>
    );

  return (
    <div className="landing">
      <header className="lp-hero text-center">
        <h1 className="lp-hero-title">{t('landing.hero.title')}</h1>
        <p className="lp-hero-subtitle">{t('landing.hero.subtitle')}</p>
        <div className="lp-hero-actions">
          {renderPrimaryButton('landing.hero.createSession', 'bi-calendar-plus')}
          {renderSecondaryButton('landing.hero.browsePublic', 'bi-search')}
        </div>
        <p className="lp-microcopy">{t('landing.hero.microcopy')}</p>
        <div className="lp-signin">
          {isClerkAvailable ? (
            <SignInButton mode="modal">
              <button className="lp-link">
                {t('landing.hero.alreadyUsing')} <span>{t('landing.hero.signIn')}</span>
              </button>
            </SignInButton>
          ) : (
            <button className="lp-link" disabled title={disabledTitle}>
              {t('landing.hero.alreadyUsing')} <span>{t('landing.hero.signIn')}</span>
            </button>
          )}
        </div>
      </header>

      <section className="lp-section">
        <p className="lp-eyebrow">{t('landing.howItWorks.eyebrow')}</p>
        <h2 className="lp-section-title">{t('landing.howItWorks.title')}</h2>
        <div className="lp-steps">
          {steps.map((step) => (
            <div key={step.titleKey} className="lp-card lp-step-card">
              <div className="lp-step-icon">
                <i className={`bi ${step.icon}`} />
              </div>
              <h3>{t(step.titleKey)}</h3>
              <p>{t(step.descriptionKey)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-section">
        <p className="lp-eyebrow">{t('landing.features.eyebrow')}</p>
        <h2 className="lp-section-title">{t('landing.features.title')}</h2>
        <div className="lp-features">
          {features.map((feature) => (
            <div key={feature.titleKey} className="lp-card lp-feature-card">
              <div className="lp-feature-icon">
                <i className={`bi ${feature.icon}`} />
              </div>
              <h3>{t(feature.titleKey)}</h3>
              <p>{t(feature.descriptionKey)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-section lp-game-types">
        <div className="lp-game-content lp-card">
          <div>
            <p className="lp-eyebrow">{t('landing.gameTypes.eyebrow')}</p>
            <h2 className="lp-section-title">{t('landing.gameTypes.title')}</h2>
            <div className="lp-game-list">
              {gameTypes.map((type) => (
                <div key={type.labelKey}>
                  <strong>{t(type.labelKey)}</strong>
                  <p>{t(type.descriptionKey)}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="lp-controls">
            <h3>{t('landing.gameTypes.whatYouControl')}</h3>
            <ul>
              {controlKeys.map((key) => (
                <li key={key}>{t(key)}</li>
              ))}
            </ul>
            <div className="lp-badge">{t('landing.gameTypes.calendarBadge')}</div>
          </div>
        </div>
      </section>

      <section className="lp-section lp-cta">
        <p className="lp-eyebrow">{t('landing.cta.eyebrow')}</p>
        <h2 className="lp-section-title">{t('landing.cta.title')}</h2>
        <p className="lp-cta-text">{t('landing.cta.subtitle')}</p>
        <div className="lp-hero-actions">
          {renderPrimaryButton('landing.cta.startScheduling', 'bi-calendar-plus')}
          {renderSecondaryButton('landing.cta.findPartners', 'bi-people')}
        </div>
        <p className="lp-microcopy">{t('landing.cta.microcopy')}</p>
      </section>
    </div>
  );
};

export default LandingPage;
