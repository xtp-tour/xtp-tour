import React from 'react';
import InvitationList from "./components/InvitationList";
import CreateInvitation from "./components/CreateInvitation";

function App() {
  return (
    <div className="container py-4">
      <header className="pb-3 mb-4 border-bottom">
        <h1 className="h2 text-primary">Tennis Hitting Partner Finder</h1>
      </header>
      
      <main>
        <CreateInvitation />
        <InvitationList />
      </main>
    </div>
  );
}

export default App;
