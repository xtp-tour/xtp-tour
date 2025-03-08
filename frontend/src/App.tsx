import React from 'react';
import GameRequestList from './components/GameRequestList';
import CreateGameRequest from './components/CreateGameRequest';

function App() {
  return (
    <div className="container py-4">
      <header className="pb-3 mb-4 border-bottom">
        <h1 className="h2 text-primary">Tennis Hitting Partner Finder</h1>
      </header>
      
      <main>
        <CreateGameRequest />
        <GameRequestList />
      </main>
    </div>
  );
}

export default App;
