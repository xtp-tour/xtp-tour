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

function App() {
  return (
    <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
      <APIProvider useMock={false}>
        <ErrorBoundary>
          <BrowserRouter>
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
          </BrowserRouter>
        </ErrorBoundary>
      </APIProvider>
    </ClerkProvider>
  );
}

export default App;
