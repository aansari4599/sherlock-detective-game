import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameSocket, useSocket } from '../context/SocketContext';

function GamePage() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { socket, connected } = useSocket();
  const { 
    game, 
    evidenceBoard, 
    chat, 
    phase, 
    players, 
    error, 
    solutionResult,
    addEvidence, 
    removeEvidence, 
    sendChat, 
    updatePhase, 
    submitSolution,
    sendWebRTCOffer,
    sendWebRTCAnswer,
    sendWebRTCIce,
    setSolutionResult
  } = useGameSocket(socket, gameId);

  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [editingEvidence, setEditingEvidence] = useState(null);
  const [chatMessage, setChatMessage] = useState('');
  const [showSuspects, setShowSuspects] = useState(false);
  const [selectedSuspect, setSelectedSuspect] = useState(null);
  const [showSolution, setShowSolution] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [callActive, setCallActive] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [peerConnection, setPeerConnection] = useState(null);
  const [isInitiator, setIsInitiator] = useState(false);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const chatEndRef = useRef(null);
  const [playerName] = useState(() => localStorage.getItem('playerName') || '');
  const [showCaseInfo, setShowCaseInfo] = useState(true);
  const [notifications, setNotifications] = useState([]);

  const myPlayer = players.find(p => p.name === playerName);
  const partner = players.find(p => p.name !== playerName);

  useEffect(() => {
    if (!game && connected) {
      const savedName = localStorage.getItem('playerName');
      if (savedName) {
        socket.emit('rejoin-game', { gameId: gameId.toUpperCase(), playerName: savedName });
      } else {
        navigate('/');
      }
    }
  }, [game, connected, socket, gameId, navigate]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chat]);

  useEffect(() => {
    if (solutionResult) {
      addNotification(solutionResult.correct ? 'Correct! The case is solved!' : 'Incorrect. The game continues...', 
        solutionResult.correct ? 'success' : 'error');
      setShowSolution(true);
    }
  }, [solutionResult]);

  useEffect(() => {
    if (!socket) return;
    socket.on('webrtc-offer', handleOffer);
    socket.on('webrtc-answer', handleAnswer);
    socket.on('webrtc-ice', handleIce);
    return () => {
      socket.off('webrtc-offer', handleOffer);
      socket.off('webrtc-answer', handleAnswer);
      socket.off('webrtc-ice', handleIce);
    };
  }, [socket]);

  const handleOffer = useCallback(async ({ offer, from }) => {
    if (from === socket.id) return;
    const pc = createPeerConnection();
    setPeerConnection(pc);
    setIsInitiator(false);
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    sendWebRTCAnswer(answer);
  }, [socket, sendWebRTCAnswer]);

  const handleAnswer = useCallback(async ({ answer, from }) => {
    if (from === socket.id || !peerConnection) return;
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  }, [peerConnection]);

  const handleIce = useCallback(async ({ candidate, from }) => {
    if (from === socket.id || !peerConnection) return;
    try {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (e) {
      console.error('ICE error:', e);
    }
  }, [peerConnection]);

  const createPeerConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendWebRTCIce(event.candidate);
      }
    };

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    if (localStream) {
      localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
    }

    return pc;
  };

  const startCall = async (initiator = true) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const pc = createPeerConnection();
      setPeerConnection(pc);
      setIsInitiator(initiator);

      if (initiator) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sendWebRTCOffer(offer);
      }

      setCallActive(true);
      setShowCallModal(true);
    } catch (err) {
      console.error('Call error:', err);
      addNotification('Failed to start call. Check camera/mic permissions.', 'error');
    }
  };

  const endCall = () => {
    if (peerConnection) {
      peerConnection.close();
      setPeerConnection(null);
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    setRemoteStream(null);
    setCallActive(false);
    setShowCallModal(false);
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => track.enabled = !track.enabled);
      setMuted(!muted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => track.enabled = !track.enabled);
      setVideoOff(!videoOff);
    }
  };

  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
  };

  const handleEvidenceSubmit = (evidence) => {
    if (editingEvidence) {
      removeEvidence(editingEvidence.id);
    }
    addEvidence(evidence);
    setShowEvidenceModal(false);
    setEditingEvidence(null);
  };

  const handlePhaseChange = (newPhase) => {
    updatePhase(newPhase);
    addNotification(`Phase changed to ${newPhase}`, 'info');
  };

  const handleSubmitSolution = () => {
    if (selectedSuspect) {
      submitSolution(selectedSuspect);
    }
  };

  if (!game) {
    return (
      <div className="page game-page loading">
        <div className="loading-state">
          <div className="spinner" />
          <h3>Entering the Fog...</h3>
          <p>Connecting to {gameId}</p>
        </div>
      </div>
    );
  }

  const caseData = game.case;
  const isHost = myPlayer?.role === 'host';

  return (
    <div className="page game-page">
      <header className="game-header">
        <div className="header-left">
          <button className="btn-icon" onClick={() => navigate('/')} title="Leave Case">
            ←
          </button>
          <div className="case-title">
            <h1>{caseData.title}</h1>
            <span className={`difficulty-badge difficulty-${caseData.difficulty}`}>{caseData.difficulty}</span>
          </div>
        </div>
        <div className="header-center">
          <div className="phase-indicator">{phase}</div>
        </div>
        <div className="header-right">
          <div className="players-status">
            {players.map(p => (
              <div key={p.id} className={`player-avatar ${p.connected ? 'online' : 'offline'} ${p.name === playerName ? 'me' : ''}`}>
                <span>{p.name.charAt(0)}</span>
                <span className="status-dot" />
              </div>
            ))}
          </div>
          <button className="btn-icon call-btn" onClick={() => startCall(true)} title="Call Partner" disabled={!partner?.connected}>
            📞
          </button>
        </div>
      </header>

      {error && <div className="error-toast">{error}</div>}

      <div className="game-layout">
        <aside className="sidebar evidence-sidebar">
          <div className="sidebar-header">
            <h3>🔍 Evidence Board</h3>
            <button className="btn-icon" onClick={() => { setEditingEvidence(null); setShowEvidenceModal(true); }} title="Add Evidence">
              +
            </button>
          </div>
          <div className="evidence-list scrollbar">
            {evidenceBoard.length === 0 ? (
              <p className="empty-state">No evidence pinned yet. Click + to add clues.</p>
            ) : (
              evidenceBoard.map((ev) => (
                <div key={ev.id} className={`evidence-card ${ev.pinned ? 'pinned' : ''}`} onClick={() => setEditingEvidence(ev)}>
                  <span className="evidence-type">{ev.type}</span>
                  <h4>{ev.title}</h4>
                  <p>{ev.description}</p>
                  <small>📍 {ev.location}</small>
                  {ev.pinned && <span className="pinned-badge">📌 Pinned</span>}
                </div>
              ))
            )}
          </div>
          <div className="sidebar-actions">
            <button className="btn-secondary" onClick={() => setShowSuspects(true)}>View Suspects</button>
            <button className="btn-primary" onClick={handleSubmitSolution} disabled={!selectedSuspect}>
              Accuse {selectedSuspect ? '→' : ''}
            </button>
          </div>
        </aside>

        <main className="main-content">
          {showCaseInfo && (
            <div className="case-info-panel card gaslight">
              <button className="close-btn" onClick={() => setShowCaseInfo(false)}>×</button>
              <div className="case-header">
                <h2>{caseData.title}</h2>
                <div className="case-meta">
                  <span>📍 {caseData.location}</span>
                  <span>🕰️ {caseData.timePeriod}</span>
                </div>
              </div>
              <p className="case-description">{caseData.description}</p>
              <button className="btn-secondary" onClick={() => setShowCaseInfo(false)}>Begin Investigation</button>
            </div>
          )}

          <div className="chat-panel card">
            <div className="chat-header">
              <h3>💬 Detective's Log</h3>
              <button className="btn-icon" onClick={() => setShowCallModal(true)} disabled={callActive || !partner?.connected} title="Voice/Video Call">
                {callActive ? '📞' : '📞'}
              </button>
            </div>
            <div className="chat-messages scrollbar">
              {chat.map(msg => (
                <div key={msg.id} className={`chat-message ${msg.playerId === socket.id ? 'own' : ''}`}>
                  <div className="message-header">
                    <span>{msg.playerId === socket.id ? 'You' : partner?.name || 'Partner'}</span>
                    <time>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
                  </div>
                  <p>{msg.message}</p>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={(e) => { e.preventDefault(); sendChat(chatMessage); setChatMessage(''); }} className="chat-input">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Share your deductions..."
                maxLength={500}
              />
              <button type="submit" className="btn-primary" disabled={!chatMessage.trim()}>Send</button>
            </form>
          </div>
        </main>
      </div>

      {showEvidenceModal && (
        <EvidenceModal 
          onClose={() => { setShowEvidenceModal(false); setEditingEvidence(null); }}
          onSubmit={handleEvidenceSubmit}
          initialData={editingEvidence}
          caseData={caseData}
        />
      )}

      {showSuspects && (
        <SuspectsModal 
          suspects={caseData.suspects}
          selectedSuspect={selectedSuspect}
          onSelect={setSelectedSuspect}
          onClose={() => setShowSuspects(false)}
        />
      )}

      {showSolution && (
        <SolutionModal
          result={solutionResult}
          caseData={caseData}
          onClose={() => { setShowSolution(false); setSolutionResult(null); }}
        />
      )}

      {showCallModal && (
        <CallModal
          active={callActive}
          localStream={localStream}
          remoteStream={remoteStream}
          localVideoRef={localVideoRef}
          remoteVideoRef={remoteVideoRef}
          muted={muted}
          videoOff={videoOff}
          onToggleMute={toggleMute}
          onToggleVideo={toggleVideo}
          onEndCall={endCall}
          onClose={() => setShowCallModal(false)}
          partnerName={partner?.name}
        />
      )}

      {notifications.map(n => (
        <Notification key={n.id} message={n.message} type={n.type} />
      ))}
    </div>
  );
}

function EvidenceModal({ onClose, onSubmit, initialData, caseData }) {
  const [formData, setFormData] = useState({
    type: 'physical',
    title: '',
    description: '',
    location: '',
    pinned: false
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const evidenceTypes = ['physical', 'document', 'testimony', 'digital'];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal card" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>{initialData ? 'Edit Evidence' : 'Add New Evidence'}</h2>
        <form onSubmit={handleSubmit} className="form">
          <div className="form-row">
            <div className="form-group">
              <label>Type</label>
              <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                {evidenceTypes.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Title *</label>
              <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
            </div>
          </div>
          <div className="form-group">
            <label>Description *</label>
            <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} required />
          </div>
          <div className="form-group">
            <label>Location Found *</label>
            <input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} required />
          </div>
          <div className="form-group checkbox-group">
            <label>
              <input type="checkbox" checked={formData.pinned} onChange={e => setFormData({...formData, pinned: e.target.checked})} />
              Pin to board (highlight as key evidence)
            </label>
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">{initialData ? 'Update' : 'Add Evidence'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SuspectsModal({ suspects, selectedSuspect, onSelect, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal card large" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>👥 Suspects</h2>
        <div className="suspects-grid">
          {suspects.map((suspect, i) => (
            <article key={suspect.id} className={`suspect-card ${selectedSuspect === suspect.id ? 'selected' : ''}`} onClick={() => onSelect(suspect.id)}>
              <h4>{suspect.name}</h4>
              <p><strong>Motive:</strong> {suspect.motive}</p>
              <p><strong>Alibi:</strong> {suspect.alibi}</p>
              {selectedSuspect === suspect.id && <div className="selected-indicator">✓ Selected for Accusation</div>}
            </article>
          ))}
        </div>
        <button className="btn-secondary" onClick={onClose} style={{ marginTop: '1rem' }}>Close</button>
      </div>
    </div>
  );
}

function SolutionModal({ result, caseData, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal card" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>{result.correct ? '✓ Case Solved!' : '✗ Wrong Accusation'}</h2>
        <div className="solution-content">
          <p><strong>The Culprit:</strong> {caseData.suspects.find(s => s.id === caseData.solution.culprit)?.name}</p>
          <p><strong>Explanation:</strong> {caseData.solution.explanation}</p>
        </div>
        <button className="btn-primary" onClick={onClose} style={{ width: '100%' }}>
          {result.correct ? 'Close Case File' : 'Continue Investigation'}
        </button>
      </div>
    </div>
  );
}

function CallModal({ active, localStream, remoteStream, localVideoRef, remoteVideoRef, muted, videoOff, onToggleMute, onToggleVideo, onEndCall, onClose, partnerName }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal card call-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>📞 Call with {partnerName}</h2>
        
        {active ? (
          <>
            <div className="call-videos">
              <div className="video-container remote">
                <video ref={remoteVideoRef} autoPlay playsInline muted />
                <span className="video-label">{partnerName}</span>
              </div>
              <div className="video-container local">
                <video ref={localVideoRef} autoPlay playsInline muted />
                <span className="video-label">You</span>
              </div>
            </div>
            <div className="call-controls">
              <button className={`call-btn ${muted ? 'active' : ''}`} onClick={onToggleMute} title={muted ? 'Unmute' : 'Mute'}>
                {muted ? '🔇' : '🎤'}
              </button>
              <button className={`call-btn ${videoOff ? 'active' : ''}`} onClick={onToggleVideo} title={videoOff ? 'Video On' : 'Video Off'}>
                {videoOff ? '📷' : '📹'}
              </button>
              <button className="call-btn end-call" onClick={onEndCall} title="End Call">
                📴
              </button>
            </div>
          </>
        ) : (
          <div className="call-waiting">
            <div className="spinner" />
            <p>Connecting to {partnerName}...</p>
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
}

function Notification({ message, type }) {
  return (
    <div className={`notification ${type}`}>
      <span>{message}</span>
    </div>
  );
}

export default GamePage;