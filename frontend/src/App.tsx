import React, { useState, useRef } from 'react';
import { ClerkProvider, SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import EventList, { EventListRef } from "./components/EventList";
import PublicEventList from "./components/PublicEventList";
import PublicEventPage from "./components/PublicEventPage";
import CreateEvent from "./components/CreateEvent";
import { ProfileSetup } from './components/ProfileSetup';
import { APIProvider } from './services/apiProvider';
import ErrorBoundary from './components/ErrorBoundary';
import Health from './components/Health';

if (!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk Publishable Key');
}

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-vh-100 bg-light">
      <div className="container py-4">
        <header className="pb-3 mb-4 border-bottom d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <i className="bi bi-trophy-fill tennis-accent me-2 fs-3"></i>
            <h1 className="h2 mb-0" style={{ color: 'var(--tennis-navy)' }}>Set Match</h1>
          </div>
          <div>
            <SignedOut>
              <div className="d-flex gap-2">
                <SignInButton mode="modal">
                  <button className="btn btn-outline-primary" style={{ minWidth: '100px' }}>Sign in</button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="btn btn-primary" style={{ minWidth: '100px' }}>Sign up</button>
                </SignUpButton>
              </div>
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </header>
        <main>
          {children}
        </main>
        <footer className="mt-5 pt-3 border-top">
          <div className="text-center">
            <small className="text-muted">
              Set Match v{__APP_VERSION__}
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

const AuthenticatedRoutes = () => (
  <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
    <APIProvider useMock={false}>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={
            <Layout>
              <SignedIn>
                <AuthenticatedContent />
              </SignedIn>
              <SignedOut>
                <PublicEventList />
              </SignedOut>
            </Layout>
          } />
          <Route path="/event/:eventId" element={<PublicEventPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
    </APIProvider>
  </ClerkProvider>
);

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
        {/* Health route - completely standalone */}
        <Route path="/health" element={
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
