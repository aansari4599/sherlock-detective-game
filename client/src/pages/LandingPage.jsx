import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

function LandingPage() {
  const navigate = useNavigate();
  const { socket, connected } = useSocket();
  const [playerName, setPlayerName] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState('');

  const handleCreateGame = (e) => {
    e.preventDefault();
    if (!playerName.trim()) return;
    localStorage.setItem('playerName', playerName.trim());
    navigate('/create');
  };

  const handleJoinGame = (e) => {
    e.preventDefault();
    if (!playerName.trim() || !joinCode.trim()) return;
    localStorage.setItem('playerName', playerName.trim());
    navigate(`/join/${joinCode.trim().toUpperCase()}`);
  };

  return (
    <div className="landing-page">
      <div className="fog-overlay" />
      
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">🕵️</span>
            <h1 className="title">BAKER STREET<br/>INVESTIGATIONS</h1>
            <span className="subtitle">A Detective Game for Two</span>
          </div>
          <div className="connection-status">
            <span className={`status-dot ${connected ? 'connected' : 'disconnected'}`} />
            <span>{connected ? 'Connected to Scotland Yard' : 'Connecting...'}</span>
          </div>
        </div>
      </header>

      <main className="main-content">
        <section className="intro-section">
          <div className="intro-card card gaslight">
            <h2>The Game is Afoot</h2>
            <p className="intro-text">
              London, 1895. A series of baffling mysteries plague the fog-laden streets of Victorian London. 
              Scotland Yard is stumped. They need minds sharper than their own—minds that think as one.
            </p>
            <p className="intro-text">
              You and your partner. Separated by distance, united by deduction. 
              Examine evidence, interrogate suspects, piece together clues in real-time. 
              Every case a test of your partnership. Every solution, a triumph of two minds in harmony.
            </p>
            <div className="features">
              <div className="feature">
                <span className="feature-icon">🔍</span>
                <div>
                  <h4>Real-Time Collaboration</h4>
                  <p>Shared evidence board, live chat, voice & video</p>
                </div>
              </div>
              <div className="feature">
                <span className="feature-icon">📜</span>
                <div>
                  <h4>Curated Mysteries</h4>
                  <p>Hand-crafted cases with varying difficulty</p>
                </div>
              </div>
              <div className="feature">
                <span className="feature-icon">✍️</span>
                <div>
                  <h4>Create Your Own</h4>
                  <p>Design cases for other couples to solve</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="action-section">
          <div className="action-cards">
            <article className="action-card card gaslight" onClick={() => setShowCreate(true)}>
              <div className="action-icon">🕯️</div>
              <h3>Host a Case</h3>
              <p>Create a new investigation and invite your partner</p>
              <span className="action-hint">Click to begin</span>
            </article>

            <article className="action-card card gaslight" onClick={() => setShowJoin(true)}>
              <div className="action-icon">🗝️</div>
              <h3>Join Investigation</h3>
              <p>Enter an invite code from your partner</p>
              <span className="action-hint">Click to join</span>
            </article>

            <article className="action-card card gaslight" onClick={() => navigate('/cases')}>
              <div className="action-icon">📚</div>
              <h3>Browse Cases</h3>
              <p>View all available mysteries and community cases</p>
              <span className="action-hint">Explore archives</span>
            </article>
          </div>
        </section>

        {showCreate && (
          <div className="modal-overlay" onClick={() => setShowCreate(false)}>
            <div className="modal card" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowCreate(false)}>×</button>
              <h2>Host New Case</h2>
              <form onSubmit={handleCreateGame} className="form">
                <div className="form-group">
                  <label htmlFor="name">Your Name, Detective</label>
                  <input
                    id="name"
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Sherlock, Watson, Adler..."
                    required
                    maxLength={20}
                  />
                </div>
                <button type="submit" className="btn-primary" style={{ width: '100%' }}>
                  Select Case →
                </button>
              </form>
            </div>
          </div>
        )}

        {showJoin && (
          <div className="modal-overlay" onClick={() => setShowJoin(false)}>
            <div className="modal card" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowJoin(false)}>×</button>
              <h2>Join Investigation</h2>
              <form onSubmit={handleJoinGame} className="form">
                <div className="form-group">
                  <label htmlFor="join-name">Your Name, Detective</label>
                  <input
                    id="join-name"
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Enter your name"
                    required
                    maxLength={20}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="code">Invitation Code</label>
                  <input
                    id="code"
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="ABC123"
                    maxLength={6}
                    required
                    style={{ textAlign: 'center', letterSpacing: '0.3em', fontSize: '1.5rem' }}
                  />
                </div>
                <button type="submit" className="btn-primary" style={{ width: '100%' }}>
                  Enter the Fog →
                </button>
              </form>
            </div>
          </div>
        )}

        <footer className="footer">
          <p>🕯️ <em>"When you have eliminated the impossible, whatever remains, however improbable, must be the truth."</em> — S.H.</p>
          <p className="footer-note">Designed for long-distance detectives • Real-time • No accounts required</p>
        </footer>
      </main>
    </div>
  );
}

export default LandingPage;