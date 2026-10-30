import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { SERVER_URL } from '../config';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [connectError, setConnectError] = useState(null);

  useEffect(() => {
    const newSocket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 8000,
      timeout: 20000,
    });

    newSocket.on('connect', () => {
      setConnected(true);
      setConnectError(null);
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      setConnected(false);
      setConnectError(err.message || 'Unable to reach the detective server');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, connected, connectError }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

export function useGameSocket(socket, gameId) {
  const [game, setGame] = useState(null);
  const [evidenceBoard, setEvidenceBoard] = useState([]);
  const [chat, setChat] = useState([]);
  const [phase, setPhase] = useState('investigation');
  const [players, setPlayers] = useState([]);
  const [error, setError] = useState(null);
  const [solutionResult, setSolutionResult] = useState(null);

  useEffect(() => {
    if (!socket || !gameId) return;

    socket.emit('join-game', { gameId: gameId.toUpperCase(), playerName: localStorage.getItem('playerName') || 'Detective' });

    socket.on('game-state-update', (gameData) => {
      setGame(gameData);
      setEvidenceBoard(gameData.evidenceBoard || []);
      setChat(gameData.chat || []);
      setPhase(gameData.currentPhase || 'investigation');
      setPlayers(gameData.players || []);
    });

    socket.on('player-joined', ({ game: gameData, player }) => {
      setGame(gameData);
      setPlayers(gameData.players || []);
    });

    socket.on('evidence-updated', (evidence) => {
      setEvidenceBoard(evidence);
      if (game) setGame({ ...game, evidenceBoard: evidence });
    });

    socket.on('chat-update', (messages) => {
      setChat(messages);
      if (game) setGame({ ...game, chat: messages });
    });

    socket.on('phase-updated', (newPhase) => {
      setPhase(newPhase);
      if (game) setGame({ ...game, currentPhase: newPhase });
    });

    socket.on('player-disconnected', ({ playerId, game: gameData }) => {
      setGame(gameData);
      setPlayers(gameData.players || []);
    });

    socket.on('solution-result', (result) => {
      setSolutionResult(result);
    });

    socket.on('error', (err) => {
      setError(err.message);
      setTimeout(() => setError(null), 5000);
    });

    return () => {
      socket.off('game-state-update');
      socket.off('player-joined');
      socket.off('evidence-updated');
      socket.off('chat-update');
      socket.off('phase-updated');
      socket.off('player-disconnected');
      socket.off('solution-result');
      socket.off('error');
    };
  }, [socket, gameId]);

  const addEvidence = useCallback((evidence) => {
    if (socket && gameId) {
      socket.emit('add-evidence', { gameId, evidence });
    }
  }, [socket, gameId]);

  const removeEvidence = useCallback((evidenceId) => {
    if (socket && gameId) {
      socket.emit('remove-evidence', { gameId, evidenceId });
    }
  }, [socket, gameId]);

  const sendChat = useCallback((message) => {
    if (socket && gameId && message.trim()) {
      socket.emit('send-chat', { gameId, message: message.trim() });
    }
  }, [socket, gameId]);

  const updatePhase = useCallback((newPhase) => {
    if (socket && gameId) {
      socket.emit('update-phase', { gameId, phase: newPhase });
    }
  }, [socket, gameId]);

  const submitSolution = useCallback((suspectId) => {
    if (socket && gameId) {
      socket.emit('submit-solution', { gameId, suspectId });
    }
  }, [socket, gameId]);

  const sendWebRTCOffer = useCallback((offer) => {
    if (socket && gameId) {
      socket.emit('webrtc-offer', { gameId, offer });
    }
  }, [socket, gameId]);

  const sendWebRTCAnswer = useCallback((answer) => {
    if (socket && gameId) {
      socket.emit('webrtc-answer', { gameId, answer });
    }
  }, [socket, gameId]);

  const sendWebRTCIce = useCallback((candidate) => {
    if (socket && gameId) {
      socket.emit('webrtc-ice', { gameId, candidate });
    }
  }, [socket, gameId]);

  return {
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
    setSolutionResult,
  };
}

export function useCasesSocket(socket) {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    // REST fallback so the archive renders even before the socket is ready
    fetch(`${SERVER_URL}/api/cases`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('bad response'))))
      .then((list) => {
        if (active && Array.isArray(list) && list.length) {
          setCases((prev) => (prev.length ? prev : list));
          setLoading(false);
        }
      })
      .catch(() => {});

    if (!socket) return () => { active = false; };

    const handleList = (casesList) => {
      if (!active) return;
      setCases(casesList);
      setLoading(false);
    };

    socket.on('cases-list', handleList);
    socket.emit('get-cases');

    // Never leave the UI stuck on skeletons
    const failsafe = setTimeout(() => { if (active) setLoading(false); }, 8000);

    return () => {
      active = false;
      clearTimeout(failsafe);
      socket.off('cases-list', handleList);
    };
  }, [socket]);

  const createCase = useCallback((caseData) => {
    return new Promise((resolve, reject) => {
      if (!socket) return reject(new Error('No socket'));

      const timeout = setTimeout(() => reject(new Error('Timeout')), 8000);

      const handler = ({ caseId, case: newCase }) => {
        clearTimeout(timeout);
        socket.off('case-created', handler);
        setCases((prev) => [...prev, newCase]);
        resolve({ caseId, case: newCase });
      };

      socket.on('case-created', handler);
      socket.emit('create-case', { caseData });
    });
  }, [socket]);

  return { cases, loading, createCase };
}