import React, { useState } from 'react';
import { ClerkProvider, SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import InvitationList from "./components/InvitationList";
import PublicInvitationList from "./components/PublicInvitationList";
import CreateEvent from "./components/CreateEvent";
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
            <h1 className="h2 mb-0" style={{ color: 'var(--tennis-navy)' }}>Tennis Hitting Partner Finder</h1>
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

function App() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
      <APIProvider useMock={false}>
        <ErrorBoundary>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={
                <Layout>
                  <SignedIn>
                    <CreateEvent onEventCreated={() => setRefreshKey(prev => prev + 1)} />
                    <InvitationList key={refreshKey} />                    
                  </SignedIn>
                  <SignedOut>
                    <PublicInvitationList />
                  </SignedOut>
                </Layout>
              } />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ErrorBoundary>
      </APIProvider>
    </ClerkProvider>
  );
}

export default App;
