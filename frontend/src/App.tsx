import React from 'react';
import GameRequestList from './components/InvitesList';
import CreateGameRequest from './components/CreateInvite';
import './App.css';

function App() {
  return (
    <div className="container">
      <header className="header">
        <h1>Tennis Hitting Partner Finder</h1>
      </header>
      
      <main>
        <CreateGameRequest />
        <GameRequestList />
      </main>
    </div>
  );
}

export default App;
