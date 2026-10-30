import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

function JoinGamePage() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { socket, connected } = useSocket();
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('playerName') || '');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [gameInfo, setGameInfo] = useState(null);

  useEffect(() => {
    if (!playerName) {
      navigate('/');
      return;
    }

    if (!connected) {
      setError('Connecting to server...');
      return;
    }

    socket.emit('join-game', { gameId: gameId.toUpperCase(), playerName });

    const handlePlayerJoined = ({ game }) => {
      setGameInfo(game);
      setJoining(false);
    };

    const handleError = ({ message }) => {
      setError(message);
      setJoining(false);
    };

    const handleGameState = (game) => {
      setGameInfo(game);
      if (game.state === 'playing') {
        navigate(`/game/${gameId}`);
      }
    };

    socket.on('player-joined', handlePlayerJoined);
    socket.on('error', handleError);
    socket.on('game-state-update', handleGameState);

    return () => {
      socket.off('player-joined', handlePlayerJoined);
      socket.off('error', handleError);
      socket.off('game-state-update', handleGameState);
    };
  }, [socket, connected, gameId, playerName, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!playerName.trim()) return;
    localStorage.setItem('playerName', playerName.trim());
    setJoining(true);
    setError('');
  };

  if (!playerName) {
    return (
      <div className="page join-page">
        <div className="join-card card gaslight">
          <h2>Enter the Investigation</h2>
          <p>Code: <strong className="invite-code">{gameId}</strong></p>
          <form onSubmit={handleSubmit} className="form">
            <div className="form-group">
              <label htmlFor="name">Your Name, Detective</label>
              <input
                id="name"
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                required
                maxLength={20}
                autoFocus
              />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={joining || !connected}>
              {joining ? 'Entering...' : 'Join Partner'}
            </button>
          </form>
          {error && <p className="error-message">{error}</p>}
          <button className="btn-secondary" onClick={() => navigate('/')} style={{ width: '100%', marginTop: '1rem' }}>
            Back to Baker Street
          </button>
        </div>
      </div>
    );
  }

  if (joining) {
    return (
      <div className="page join-page">
        <div className="join-card card gaslight">
          <div className="loading-state">
            <div className="spinner" />
            <h3>Crossing the Fog...</h3>
            <p>Waiting for your partner to accept</p>
            <p className="code-display">Code: <strong>{gameId}</strong></p>
          </div>
          {error && <p className="error-message">{error}</p>}
        </div>
      </div>
    );
  }

  if (gameInfo) {
    return (
      <div className="page join-page">
        <div className="join-card card gaslight">
          <h2>Case Accepted</h2>
          <p className="case-title">{gameInfo.case?.title}</p>
          <div className="players-list">
            {gameInfo.players.map(p => (
              <div key={p.id} className={`player-badge ${p.role}`}>
                <span>{p.name}</span>
                <span className={`status ${p.connected ? 'online' : 'offline'}`} />
              </div>
            ))}
          </div>
          <button className="btn-primary btn-large" onClick={() => navigate(`/game/${gameId}`)} style={{ width: '100%' }}>
            Enter the Investigation →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page join-page">
      <div className="join-card card gaslight">
        <div className="loading-state">
          <div className="spinner" />
          <h3>Finding the Case...</h3>
          <p>Code: <strong>{gameId}</strong></p>
        </div>
        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
}

export default JoinGamePage;