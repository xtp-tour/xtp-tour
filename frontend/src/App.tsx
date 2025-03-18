import React from 'react';
import { ClerkProvider, SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import InvitationList from "./components/InvitationList";
import PublicInvitationList from "./components/PublicInvitationList";
import CreateInvitation from "./components/CreateInvitation";
import { APIProvider } from './services/apiProvider';

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

const Home = () => {
  return (
    <>
      <SignedIn>
        <CreateInvitation />
        <InvitationList />
      </SignedIn>
      <SignedOut>
        <PublicInvitationList />
      </SignedOut>
    </>
  );
};

function App() {
  return (
    <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
      <APIProvider useMock={false}>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </APIProvider>
    </ClerkProvider>
  );
}

export default App;
