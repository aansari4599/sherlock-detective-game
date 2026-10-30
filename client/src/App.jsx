import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import LandingPage from './pages/LandingPage';
import CreateGamePage from './pages/CreateGamePage';
import JoinGamePage from './pages/JoinGamePage';
import GamePage from './pages/GamePage';
import CaseCreatorPage from './pages/CaseCreatorPage';
import CasesListPage from './pages/CasesListPage';

function App() {
  return (
    <SocketProvider>
      <BrowserRouter>
        <div className="app">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/create" element={<CreateGamePage />} />
            <Route path="/join/:gameId" element={<JoinGamePage />} />
            <Route path="/game/:gameId" element={<GamePage />} />
            <Route path="/cases" element={<CasesListPage />} />
            <Route path="/create-case" element={<CaseCreatorPage />} />
            <Route path="/case/:caseId/edit" element={<CaseCreatorPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </SocketProvider>
  );
}

export default App;