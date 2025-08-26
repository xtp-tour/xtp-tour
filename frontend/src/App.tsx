import React, { useState, useRef } from 'react';
import { ClerkProvider, SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import EventList, { EventListRef } from "./components/EventList";
import PublicEventPage from "./components/PublicEventPage";
import CreateEvent from "./components/CreateEvent";
import { ProfileSetup } from './components/ProfileSetup';
import LandingPage from './components/LandingPage';
import LanguageSwitcherSimple from './components/LanguageSwitcherSimple';
import { APIProvider } from './services/apiProvider';
import ErrorBoundary from './components/ErrorBoundary';
import Health from './components/Health';

// Check if Clerk is available
const isClerkAvailable = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!isClerkAvailable) {
  console.log('Clerk is not available');
}

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { t } = useTranslation();

  return (
    <div className="min-vh-100 bg-light">
      <div className="container py-4">
        <header className="pb-3 mb-4 border-bottom d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <i className="bi bi-trophy-fill tennis-accent me-2 fs-3"></i>
            <h1 className="h2 mb-0" style={{ color: 'var(--tennis-navy)' }}>{t('app.title')}</h1>
          </div>
          <div className="d-flex align-items-center gap-2">
            <LanguageSwitcherSimple />
            {isClerkAvailable ? (
              <>
                <SignedOut>
                  <div className="d-flex gap-2">
                    <SignInButton mode="modal">
                      <button className="btn btn-outline-primary" style={{ minWidth: '100px' }}>{t('auth.signIn')}</button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <button className="btn btn-primary" style={{ minWidth: '100px' }}>{t('auth.signUp')}</button>
                    </SignUpButton>
                  </div>
                </SignedOut>
                <SignedIn>
                  <UserButton afterSignOutUrl="/" />
                </SignedIn>
              </>
            ) : (
                            <div className="d-flex gap-2">
                <button
                  className="btn btn-outline-primary"
                  style={{ minWidth: '100px', opacity: 0.6 }}
                  disabled
                  title={t('auth.comingSoon')}
                >
                  {t('auth.signIn')}
                </button>
                <button
                  className="btn btn-primary"
                  style={{ minWidth: '100px', opacity: 0.6 }}
                  disabled
                  title={t('auth.comingSoon')}
                >
                  {t('auth.signUp')}
                </button>
              </div>
            )}
          </div>
        </header>
        <main>
          {children}
        </main>
        <footer className="mt-5 pt-3 border-top">
          <div className="text-center">
            <small className="text-muted">
              {t('app.version', { version: __APP_VERSION__ })}
            </small>
          </div>
        </footer>
      </div>
    </div>
  );
};

const AuthenticatedContent = () => {
  const [profileComplete, setProfileComplete] = useState(false);
  const eventListRef = useRef<EventListRef>(null);

  if (!profileComplete) {
    return <ProfileSetup onComplete={() => setProfileComplete(true)} />;
  }

  return (
    <>
      <CreateEvent onEventCreated={async () => {
        await eventListRef.current?.refreshEvents();
      }} />
      <EventList ref={eventListRef} />
    </>
  );
};

const AuthenticatedRoutes = () => {
  const routeContent = (
    <APIProvider useMock={false} baseUrl={import.meta.env.VITE_API_BASE_URL || ''}>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={
            <Layout>
              {isClerkAvailable ? (
                <>
                  <SignedIn>
                    <AuthenticatedContent />
                  </SignedIn>
                  <SignedOut>
                    <LandingPage />
                  </SignedOut>
                </>
              ) : (
                <LandingPage />
              )}
            </Layout>
          } />
          <Route path="/event/:eventId" element={<PublicEventPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
    </APIProvider>
  );

  return isClerkAvailable ? (
    <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
      {routeContent}
    </ClerkProvider>
  ) : (
    routeContent
  );
};

// Simple error boundary for health route that doesn't use API
class SimpleErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Health page error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // For error boundary, we'll use hardcoded text since we can't use hooks here
      return (
        <div className="alert alert-danger m-3" role="alert">
          <h4 className="alert-heading">Something went wrong</h4>
          <p>Please try refreshing the page.</p>
          <button
            className="btn btn-outline-danger"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

  function App() {
    return (
    <BrowserRouter>
      <Routes>
        {/* Detailed health page route */}
        <Route path="/health-details" element={
          <SimpleErrorBoundary>
            <Health />
          </SimpleErrorBoundary>
        } />

        {/* All other routes wrapped in ClerkProvider */}
        <Route path="*" element={<AuthenticatedRoutes />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
