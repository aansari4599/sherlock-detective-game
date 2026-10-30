import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import SiteNav from './components/SiteNav';
import LandingPage from './pages/LandingPage';
import CreateGamePage from './pages/CreateGamePage';
import JoinGamePage from './pages/JoinGamePage';
import GamePage from './pages/GamePage';
import CaseCreatorPage from './pages/CaseCreatorPage';
import CasesListPage from './pages/CasesListPage';

function AppShell() {
  const location = useLocation();
  const isGame = location.pathname.startsWith('/game/');

  return (
    <div className="app">
      {!isGame && <SiteNav />}
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
  );
}

function App() {
  return (
    <SocketProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </SocketProvider>
  );
}

export default App;
