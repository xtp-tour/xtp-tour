import React from 'react';
import { ClerkProvider } from '@clerk/clerk-react';
import InvitationList from "./components/InvitationList";
import CreateInvitation from "./components/CreateInvitation";
import { APIProvider } from './services/api/provider';

if (!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk Publishable Key');
}

const App: React.FC = () => {
  return (
    <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
      <APIProvider useMock={true}>
        <div className="container py-4">
          <header className="pb-3 mb-4 border-bottom">
            <h1 className="h2 text-primary">Tennis Hitting Partner Finder</h1>
          </header>
          
          <main>
            <CreateInvitation />
            <InvitationList />
          </main>
        </div>
      </APIProvider>
    </ClerkProvider>
  );
};

export default App;
