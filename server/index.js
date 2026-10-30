const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: CLIENT_URL, methods: ['GET', 'POST'], credentials: true }
});

const games = new Map();
const cases = new Map();
const waitingPlayers = new Map();

const DEFAULT_CASES = [
  {
    id: 'case-001',
    title: 'The Mystery of the Missing Heirloom',
    difficulty: 'easy',
    description: 'Lady Wellington\'s priceless diamond necklace has vanished from her locked bedroom. The only clue: a single muddy footprint leading to the window.',
    location: 'Wellington Manor, London',
    timePeriod: '1895',
    suspects: [
      { id: 's1', name: 'James the Butler', motive: 'Gambling debts', alibi: 'Polishing silver in pantry' },
      { id: 's2', name: 'Miss Eleanor', motive: 'Disinherited niece', alibi: 'Reading in library' },
      { id: 's3', name: 'Professor Blackwood', motive: 'Collector of rare gems', alibi: 'Lecture at university' }
    ],
    evidence: [
      { id: 'e1', type: 'physical', title: 'Muddy Footprint', description: 'Size 10 boot print, distinct hobnail pattern. Found under window.', location: 'Bedroom window' },
      { id: 'e2', type: 'document', title: 'Pawn Ticket', description: 'Ticket for "diamond necklace" dated yesterday. Found in butler\'s coat.', location: 'Butler\'s quarters' },
      { id: 'e3', type: 'testimony', title: 'Maid\'s Statement', description: 'Heard arguing voices at 11 PM. "You\'ll never get away with this!"', location: 'Hallway' },
      { id: 'e4', type: 'physical', title: 'Broken Glass', description: 'Shards from display case. Cut marks suggest diamond cutter.', location: 'Display case' }
    ],
    solution: { culprit: 's1', explanation: 'Butler James stole the necklace to pay gambling debts. The pawn ticket proves it. The muddy footprint matches his boots.' }
  },
  {
    id: 'case-002',
    title: 'The Poisoned Pen',
    difficulty: 'medium',
    description: 'Renowned author Arthur Pym collapsed dead at his own book signing. The ink in his fountain pen was laced with cyanide. Who swapped the ink?',
    location: 'The Literary Club, London',
    timePeriod: '1892',
    suspects: [
      { id: 's1', name: 'Rival Author V. Hargreaves', motive: 'Jealous of Pym\'s success', alibi: 'Signing books at adjacent table' },
      { id: 's2', name: 'Publisher Mr. Thorne', motive: 'Pym threatening to leave', alibi: 'In meeting with printers' },
      { id: 's3', name: 'Disgruntled Fan Miss Adler', motive: 'Obsessed, felt betrayed by ending', alibi: 'Waiting in queue' },
      { id: 's4', name: 'Agent Mr. Sterling', motive: 'Blackmail over contract', alibi: 'Negotiating with French publisher' }
    ],
    evidence: [
      { id: 'e1', type: 'physical', title: 'Fountain Pen', description: 'Gold nib, reservoir contains trace cyanide. Serial number matches agent\'s gift.', location: 'Author\'s hand' },
      { id: 'e2', type: 'document', title: 'Contract Draft', description: 'Unsigned termination clause. Agent stands to lose 40% commission.', location: 'Agent\'s briefcase' },
      { id: 'e3', type: 'testimony', title: 'Waiter\'s Account', description: 'Saw rival author pour something into inkwell when Pym stepped away.', location: 'Refreshment table' },
      { id: 'e4', type: 'physical', title: 'Ink Bottle', description: 'Blue-black ink, sealed. Second bottle found in rival\'s coat - same batch, cyanide traces.', location: 'Rival\'s pocket' }
    ],
    solution: { culprit: 's1', explanation: 'Rival author V. Hargreaves swapped the ink bottles. The cyanide-laced bottle in his pocket matches the pen\'s ink.' }
  },
  {
    id: 'case-003',
    title: 'The Clockwork Conspiracy',
    difficulty: 'hard',
    description: 'A series of precise bank vault robberies across London. No forced entry, no witnesses. Only a single gear left at each scene. The police are baffled.',
    location: 'Multiple locations, London',
    timePeriod: '1898',
    suspects: [
      { id: 's1', name: 'Master Watchmaker Elias Thorne', motive: 'Revenge against banking family', alibi: 'Working in shop all night' },
      { id: 's2', name: 'Lady Victoria Ashford', motive: 'Thrill-seeking aristocrat', alibi: 'Opera with Duke of Wellington' },
      { id: 's3', name: 'Inspector Lestrade\'s Nephew', motive: 'Inside information', alibi: 'On duty at Scotland Yard' },
      { id: 's4', name: 'Professor Moriarty (rumored)', motive: 'Criminal mastermind', alibi: 'Unknown' }
    ],
    evidence: [
      { id: 'e1', type: 'physical', title: 'Brass Gear', description: 'Hand-cut, 47 teeth. Unique to Thorne\'s workshop. Found at 3rd robbery.', location: 'Bank vault floor' },
      { id: 'e2', type: 'document', title: 'Blueprints', description: 'Vault schematics with gear mechanism annotations. Stolen from Thorne\'s apprentice.', location: 'Abandoned warehouse' },
      { id: 'e3', type: 'testimony', title: 'Apprentice\'s Confession', description: 'Thorne built a "key" for any vault. Lady Ashford funded it. Moriarty is a myth.', location: 'Police station' },
      { id: 'e4', type: 'physical', title: 'Opera Glove', description: 'Lace glove with brass filings. Matches Lady Ashford\'s attire. Found at 1st robbery.', location: 'Ventilation shaft' }
    ],
    solution: { culprit: 's2', explanation: 'Lady Ashford orchestrated the heists for thrill. She funded Thorne\'s mechanism. The glove and apprentice testimony confirm.' }
  }
];

DEFAULT_CASES.forEach(c => cases.set(c.id, c));

function generateInviteCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('create-game', ({ playerName, caseId }) => {
    const gameId = generateInviteCode();
    const gameCase = cases.get(caseId) || DEFAULT_CASES[0];
    
    const game = {
      id: gameId,
      case: gameCase,
      players: [{ id: socket.id, name: playerName, role: 'host', connected: true }],
      state: 'waiting',
      evidenceBoard: [],
      chat: [],
      currentPhase: 'investigation',
      createdAt: Date.now()
    };
    
    games.set(gameId, game);
    socket.join(gameId);
    waitingPlayers.set(socket.id, { gameId, playerName });
    
    socket.emit('game-created', { gameId, game });
  });

  socket.on('join-game', ({ gameId, playerName }) => {
    const game = games.get(gameId.toUpperCase());
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }
    if (game.players.length >= 2) {
      socket.emit('error', { message: 'Game is full (couples only)' });
      return;
    }
    if (game.players.some(p => p.id === socket.id)) {
      socket.emit('error', { message: 'Already in this game' });
      return;
    }

    game.players.push({ id: socket.id, name: playerName, role: 'partner', connected: true });
    game.state = 'playing';
    socket.join(gameId);
    
    io.to(gameId).emit('player-joined', { game, player: game.players[1] });
    io.to(gameId).emit('game-state-update', game);
  });

  socket.on('rejoin-game', ({ gameId, playerName }) => {
    const game = games.get(gameId.toUpperCase());
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }
    const existingPlayer = game.players.find(p => p.name === playerName);
    if (existingPlayer) {
      existingPlayer.id = socket.id;
      existingPlayer.connected = true;
      socket.join(gameId);
      socket.emit('game-state-update', game);
    } else {
      socket.emit('error', { message: 'Player not found in game' });
    }
  });

  socket.on('add-evidence', ({ gameId, evidence }) => {
    const game = games.get(gameId);
    if (!game) return;
    game.evidenceBoard.push({ ...evidence, id: uuidv4(), addedBy: socket.id, timestamp: Date.now() });
    io.to(gameId).emit('evidence-updated', game.evidenceBoard);
  });

  socket.on('remove-evidence', ({ gameId, evidenceId }) => {
    const game = games.get(gameId);
    if (!game) return;
    game.evidenceBoard = game.evidenceBoard.filter(e => e.id !== evidenceId);
    io.to(gameId).emit('evidence-updated', game.evidenceBoard);
  });

  socket.on('send-chat', ({ gameId, message }) => {
    const game = games.get(gameId);
    if (!game) return;
    const chatMsg = { id: uuidv4(), playerId: socket.id, message, timestamp: Date.now() };
    game.chat.push(chatMsg);
    io.to(gameId).emit('chat-update', game.chat);
  });

  socket.on('update-phase', ({ gameId, phase }) => {
    const game = games.get(gameId);
    if (!game) return;
    game.currentPhase = phase;
    io.to(gameId).emit('phase-updated', phase);
  });

  socket.on('submit-solution', ({ gameId, suspectId }) => {
    const game = games.get(gameId);
    if (!game) return;
    const isCorrect = suspectId === game.case.solution.culprit;
    io.to(gameId).emit('solution-result', { 
      correct: isCorrect, 
      solution: game.case.solution,
      submittedBy: socket.id
    });
  });

  socket.on('webrtc-offer', ({ gameId, offer }) => {
    socket.to(gameId).emit('webrtc-offer', { offer, from: socket.id });
  });

  socket.on('webrtc-answer', ({ gameId, answer }) => {
    socket.to(gameId).emit('webrtc-answer', { answer, from: socket.id });
  });

  socket.on('webrtc-ice', ({ gameId, candidate }) => {
    socket.to(gameId).emit('webrtc-ice', { candidate, from: socket.id });
  });

  socket.on('create-case', ({ caseData }) => {
    const caseId = 'custom-' + uuidv4().substring(0, 8);
    const newCase = { id: caseId, ...caseData, createdBy: socket.id, createdAt: Date.now() };
    cases.set(caseId, newCase);
    socket.emit('case-created', { caseId, case: newCase });
  });

  socket.on('get-cases', () => {
    socket.emit('cases-list', Array.from(cases.values()));
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    games.forEach((game, gameId) => {
      const player = game.players.find(p => p.id === socket.id);
      if (player) {
        player.connected = false;
        io.to(gameId).emit('player-disconnected', { playerId: socket.id, game });
      }
    });
  });
});

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.get('/api/cases', (req, res) => res.json(Array.from(cases.values())));

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));