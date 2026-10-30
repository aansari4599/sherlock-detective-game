import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

function LandingPage() {
  const navigate = useNavigate();
  const { connected } = useSocket();
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
    <div className="landing">
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-copy">
            <span className="eyebrow">A real-time detective game for two</span>
            <h1 className="hero-title">
              The game is afoot,<br /><em>together.</em>
            </h1>
            <p className="hero-lead">
              London, 1895. Scotland Yard is out of its depth, and the answers lie with two minds
              that think as one. Examine evidence, interrogate suspects, and crack the case in
              real time — however many miles separate you.
            </p>
            <div className="hero-actions">
              <button className="btn-primary btn-large" onClick={() => setShowCreate(true)}>
                Host a Case
              </button>
              <button className="btn-secondary btn-large" onClick={() => setShowJoin(true)}>
                Join with a Code
              </button>
            </div>
            <div className="hero-meta">
              <span>5 mysteries</span>
              <span>Real-time co-op</span>
              <span>Voice &amp; video</span>
              <span>No accounts</span>
            </div>
          </div>

          <div className="hero-visual">
            <div className="case-file" aria-hidden="true">
              <div className="case-file-top">
                <span>Case File No. 002</span>
                <span>Confidential</span>
              </div>
              <h4>The Poisoned Pen</h4>
              <p>
                The novelist Arthur Pym collapsed at his own book signing, poisoned by the ink
                of his fountain pen. Four suspects. One fatal signature.
              </p>
              <div className="case-file-clue">
                <span className="tick">✗</span>
                <span>The pen was a gift — but the ink was not.</span>
              </div>
              <div className="case-file-clue">
                <span className="tick">✗</span>
                <span>A witness saw someone refill it during the signing.</span>
              </div>
              <span className="case-file-stamp">Unsolved</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <span className="eyebrow">How it works</span>
          <h2>Three steps to the truth</h2>
          <p>One of you opens a case, the other joins with a six-letter code. From there, every clue is shared.</p>
        </div>
        <div className="steps">
          <article className="step">
            <span className="step-num">I</span>
            <h3>Host a case</h3>
            <p>Choose a mystery and set the scene. You will receive an invite code to share with your partner.</p>
          </article>
          <article className="step">
            <span className="step-num">II</span>
            <h3>Join your partner</h3>
            <p>Enter the code to step into the same investigation. You will both see the same evidence as it is uncovered.</p>
          </article>
          <article className="step">
            <span className="step-num">III</span>
            <h3>Deduce together</h3>
            <p>Pin clues, trade theories in the detective's log, call by voice or video, and name the culprit before you accuse.</p>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <span className="eyebrow">Built for two</span>
          <h2>Closer with every clue</h2>
          <p>A cooperative mystery designed for long-distance partners — not a race, but a shared hunt for the truth.</p>
        </div>
        <div className="features">
          <div className="feature">
            <span className="feature-icon">🔍</span>
            <div>
              <h4>Shared evidence board</h4>
              <p>Pin and annotate clues together. What one detective finds, the other sees instantly.</p>
            </div>
          </div>
          <div className="feature">
            <span className="feature-icon">📞</span>
            <div>
              <h4>Voice &amp; video calling</h4>
              <p>Talk it through face to face, right inside the case. No third-party apps required.</p>
            </div>
          </div>
          <div className="feature">
            <span className="feature-icon">📜</span>
            <div>
              <h4>Curated mysteries</h4>
              <p>Hand-written cases across three difficulty tiers, from a first evening to a master detective.</p>
            </div>
          </div>
          <div className="feature">
            <span className="feature-icon">✍️</span>
            <div>
              <h4>Write your own</h4>
              <p>Build a case with your own suspects, evidence, and solution — then challenge other couples.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-band">
        <div className="cta-inner">
          <div>
            <h2>Ready to open a case?</h2>
            <p>It takes a minute to begin, and a partner to finish.</p>
          </div>
          <div className="hero-actions" style={{ margin: 0 }}>
            <button className="btn-primary btn-large" onClick={() => setShowCreate(true)}>Host a Case</button>
            <button className="btn-secondary btn-large" onClick={() => setShowJoin(true)}>Join with a Code</button>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <p className="quote">
          "When you have eliminated the impossible, whatever remains, however improbable, must be the truth."
        </p>
        <p className="fine">Baker Street Investigations · A detective game for two · {connected ? 'Connected' : 'Connecting…'}</p>
      </footer>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowCreate(false)}>×</button>
            <h2>Host a Case</h2>
            <p style={{ marginBottom: '0.5rem' }}>What shall your partner call you, Detective?</p>
            <form onSubmit={handleCreateGame} className="form">
              <div className="form-group">
                <label htmlFor="name">Your name</label>
                <input
                  id="name"
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Sherlock, Watson, Adler…"
                  required
                  maxLength={20}
                  autoFocus
                />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%' }}>
                Choose a Case →
              </button>
            </form>
          </div>
        </div>
      )}

      {showJoin && (
        <div className="modal-overlay" onClick={() => setShowJoin(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowJoin(false)}>×</button>
            <h2>Join an Investigation</h2>
            <p style={{ marginBottom: '0.5rem' }}>Enter your name and the code your partner shared.</p>
            <form onSubmit={handleJoinGame} className="form">
              <div className="form-group">
                <label htmlFor="join-name">Your name</label>
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
                <label htmlFor="code">Invitation code</label>
                <input
                  id="code"
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="ABC123"
                  maxLength={6}
                  required
                  style={{ textAlign: 'center', letterSpacing: '0.3em', fontSize: '1.4rem', fontFamily: 'var(--font-mono)' }}
                />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%' }}>
                Enter the Fog →
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default LandingPage;
