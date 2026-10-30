import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:3001', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      console.error('Connection error:', err);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
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
    if (!socket) return;

    socket.emit('get-cases');

    socket.on('cases-list', (casesList) => {
      setCases(casesList);
      setLoading(false);
    });

    return () => {
      socket.off('cases-list');
    };
  }, [socket]);

  const createCase = useCallback((caseData) => {
    return new Promise((resolve, reject) => {
      if (!socket) return reject(new Error('No socket'));

      const timeout = setTimeout(() => reject(new Error('Timeout')), 5000);
      
      socket.emit('create-case', { caseData });
      
      socket.once('case-created', ({ caseId, case: newCase }) => {
        clearTimeout(timeout);
        setCases(prev => [...prev, newCase]);
        resolve({ caseId, case: newCase });
      });
    });
  }, [socket]);

  return { cases, loading, createCase };
}