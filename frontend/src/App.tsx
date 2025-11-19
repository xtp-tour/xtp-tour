import React, { useState, useRef } from 'react';
import { ClerkProvider, SignInButton, SignUpButton, SignedIn, SignedOut } from '@clerk/clerk-react';
import { BrowserRouter, Route, Routes, Navigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import EventList, { EventListRef } from "./components/EventList";
import PublicEventPage from "./components/PublicEventPage";
import CreateEvent from "./components/CreateEvent";
import { ProfileSetup } from './components/ProfileSetup';
import UserProfile from './components/UserProfile';
import UserMenu from './components/UserMenu';
import LandingPage from './components/LandingPage';
import LanguageSwitcherSimple from './components/LanguageSwitcherSimple';
import { APIProvider } from './services/apiProvider';
import ErrorBoundary from './components/ErrorBoundary';
import Health from './components/Health';
import CalendarCallback from './components/CalendarCallback';
import logoImage from './assets/xtp-tour-logo.png';

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
            <img src={logoImage} alt="XTP Tour Logo" className="me-2" style={{ height: '32px', width: 'auto', maxWidth: '120px' }} />
            <Link to="/" className="text-decoration-none">
              <h1 className="h2 mb-0" style={{
                color: 'var(--tennis-navy)',
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 700,
                letterSpacing: '0.06em',
                fontSize: '1.75rem',
                lineHeight: '1.0',
                textTransform: 'uppercase'
              }}>{t('app.title')}</h1>
            </Link>
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
                  <UserMenu />
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

const AppRoutes = () => {
  return (
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
      <Route path="/profile" element={
        <Layout>
          <SignedIn>
            <UserProfile />
          </SignedIn>
          <SignedOut>
            <Navigate to="/" replace />
          </SignedOut>
        </Layout>
      } />
      <Route path="/event/:eventId" element={<PublicEventPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
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
    const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

    const appContent = (
      <APIProvider useMock={!isClerkAvailable} baseUrl={import.meta.env.VITE_API_BASE_URL || ''}>
        <ErrorBoundary>
          <Routes>
            {/* Public routes that don't need the main layout */}
            <Route path="/health-details" element={<SimpleErrorBoundary><Health /></SimpleErrorBoundary>} />
            <Route path="/calendar/auth/callback" element={<CalendarCallback />} />

            {/* All other routes */}
            <Route path="*" element={<AppRoutes />} />
          </Routes>
        </ErrorBoundary>
      </APIProvider>
    );

    return (
      <BrowserRouter>
        {isClerkAvailable ? (
          <ClerkProvider publishableKey={clerkPubKey}>
            {appContent}
          </ClerkProvider>
        ) : (
          appContent
        )}
      </BrowserRouter>
    );
}

export default App;
