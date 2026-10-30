const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5050',
  'http://127.0.0.1:3000',
  process.env.CLIENT_URL,
].filter(Boolean);

const corsOrigin = (origin, callback) => {
  if (!origin) return callback(null, true);
  if (allowedOrigins.includes(origin)) return callback(null, true);
  if (/^https:\/\/[a-z0-9-]+\.onrender\.com$/i.test(origin)) return callback(null, true);
  return callback(null, false);
};

app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: corsOrigin, methods: ['GET', 'POST'], credentials: true }
});

const games = new Map();
const cases = new Map();
const waitingPlayers = new Map();

const DEFAULT_CASES = [
  {
    id: 'case-001',
    title: 'The Missing Heirloom',
    difficulty: 'easy',
    description: "Lady Wellington's diamond necklace has vanished from a locked bedroom at Wellington Manor. The only trace of the intruder is a single muddy boot print beneath the open window — and the display case has been neatly cut, not smashed.",
    location: 'Wellington Manor, London',
    timePeriod: '1895',
    suspects: [
      { id: 's1', name: 'James Holloway, the Butler', motive: 'Owes a fortune to a London bookmaker', alibi: 'Claims he was polishing the silver in the pantry' },
      { id: 's2', name: 'Miss Eleanor Wellington', motive: 'Her aunt disinherited her last spring', alibi: 'Says she was reading in the library' },
      { id: 's3', name: 'Professor Blackwood', motive: 'A collector known to covet rare gems', alibi: 'Says he was lecturing at the university' }
    ],
    evidence: [
      { id: 'e1', type: 'physical', title: 'Muddy Boot Print', description: 'A size-ten print with a hobnail sole, set in fresh mud beneath the bedroom window. The window latch was forced from the outside.', location: 'Beneath the bedroom window' },
      { id: 'e2', type: 'document', title: 'Pawn Ticket', description: 'A pawnbroker\'s ticket for a "diamond necklace", dated the morning after the theft and sewn into the lining of the butler\'s coat.', location: 'Butler\'s quarters' },
      { id: 'e3', type: 'testimony', title: 'Maid\'s Testimony', description: 'At eleven o\'clock she heard Lady Wellington cry out, "You will never get away with this!" from behind the bedroom door.', location: 'Second-floor landing' },
      { id: 'e4', type: 'physical', title: 'Cut Display Case', description: 'The glass of the jewellery case was scored and lifted cleanly with a glass cutter — the careful work of someone who knew the room and had time to spare.', location: 'Bedroom display case' }
    ],
    solution: {
      culprit: 's1',
      explanation: 'The butler, James Holloway, forced the window and cut open the display case, then pawned the necklace the next morning to cover his gambling debts. The pawn ticket hidden in his coat is decisive, and the size-ten hobnail print matches his working boots. The cleanly cut glass shows an insider at work, not a smash-and-grab thief.'
    }
  },
  {
    id: 'case-004',
    title: 'The Vanishing Violinist',
    difficulty: 'easy',
    description: 'Madame Celeste vanished from the stage of the Royal Albert Hall the instant the gaslights failed. Her priceless Stradivarius lies smashed in her dressing room. A locked hall, a blackout, and a missing woman — was she taken, or did she run?',
    location: 'Royal Albert Hall, London',
    timePeriod: '1896',
    suspects: [
      { id: 's1', name: 'Signor Rossi, rival violinist', motive: 'Passed over for first chair', alibi: 'On stage in the dark with the orchestra' },
      { id: 's2', name: 'Abel Crane, theatre manager', motive: 'The hall is deep in debt', alibi: 'At the lighting box' },
      { id: 's3', name: 'Lily Marsh, the dresser', motive: 'Celeste owed her a large sum', alibi: 'In the wardrobe room' }
    ],
    evidence: [
      { id: 'e1', type: 'physical', title: 'Climbing Rope', description: 'A new rope with an iron hook, still damp, coiled beside the rooftop trapdoor. Someone left the hall by the roof.', location: 'Rooftop' },
      { id: 'e2', type: 'document', title: 'Insurance Policy', description: "The hall's policy on Madame Celeste's instrument was doubled only last month — and it pays out to the theatre, not to her.", location: 'Manager\'s office' },
      { id: 'e3', type: 'testimony', title: 'Stagehand\'s Testimony', description: 'Just before the blackout he saw the manager slip out of the lighting box, though he was meant to remain at his post.', location: 'Backstage' },
      { id: 'e4', type: 'physical', title: 'Smashed Violin', description: 'The violin in the dressing room is a cheap copy, not the Stradivarius. The real instrument is missing.', location: 'Dressing room' }
    ],
    solution: {
      culprit: 's2',
      explanation: 'Abel Crane, the manager, cut the gaslights himself, faked Celeste\'s disappearance, and lowered the real violin from the roof by rope while leaving a smashed replica behind. The doubled insurance policy payable to the theatre is his motive, the stagehand places him away from the lighting box at the crucial moment, and the rope proves the staged exit. Madame Celeste was later found unharmed, locked in the cellar until the fraud could be collected.'
    }
  },
  {
    id: 'case-002',
    title: 'The Poisoned Pen',
    difficulty: 'medium',
    description: 'The novelist Arthur Pym collapsed at his own book signing, poisoned by cyanide in the ink of his fountain pen. Four people were close enough to handle the pen that evening. One of them meant him to die.',
    location: 'The Literary Club, London',
    timePeriod: '1892',
    suspects: [
      { id: 's1', name: 'Victor Hargreaves, rival author', motive: 'Bitter that Pym\'s new novel eclipsed his own', alibi: 'Signing books at the next table' },
      { id: 's2', name: 'Mr. Thorne, publisher', motive: 'Pym was about to leave for a rival house', alibi: 'In a meeting with the printers' },
      { id: 's3', name: 'Miss Adler, devoted reader', motive: 'Obsessed, and enraged by the novel\'s ending', alibi: 'Waiting in the signing queue' },
      { id: 's4', name: 'Mr. Sterling, literary agent', motive: 'Stood to lose a forty per cent commission', alibi: 'Negotiating with a French publisher' }
    ],
    evidence: [
      { id: 'e1', type: 'physical', title: 'The Fountain Pen', description: 'A gold-nibbed fountain pen whose reservoir still smells of bitter almonds — cyanide. Its serial number marks it as a gift from Mr. Sterling.', location: 'Clutched in the victim\'s hand' },
      { id: 'e2', type: 'document', title: 'Contract Draft', description: 'An unsigned letter terminating Sterling\'s agency. If Pym left, the agent would forfeit his commission.', location: 'Sterling\'s briefcase' },
      { id: 'e3', type: 'testimony', title: 'Waiter\'s Testimony', description: 'He saw Hargreaves lean over Pym\'s pen and top up its reservoir from a small bottle while Pym was distracted by a reader.', location: 'The signing table' },
      { id: 'e4', type: 'physical', title: 'Ink Bottle', description: 'A blue-black ink bottle in Hargreaves\'s coat, from the same batch as the poisoned ink. The residue tests positive for cyanide.', location: 'Hargreaves\'s coat pocket' }
    ],
    solution: {
      culprit: 's1',
      explanation: 'Victor Hargreaves refilled Pym\'s pen from a cyanide-laced bottle while the author was distracted, then pocketed the bottle. The waiter saw him do it, and the matching ink in his coat is the final proof. The pen\'s serial number points to Sterling, but that is a cruel coincidence — the pen was a gift, not the weapon.'
    }
  },
  {
    id: 'case-005',
    title: 'The Stolen Cipher',
    difficulty: 'medium',
    description: 'A coded ledger that could expose a smuggling ring has vanished from the Admiralty. Only one copy was ever made. Four people held the keys to the office that night — and one of them has already sold its secrets to Dover.',
    location: 'The Admiralty, Whitehall',
    timePeriod: '1897',
    suspects: [
      { id: 's1', name: 'Harold Pike, clerk', motive: 'Gambling debts to dangerous men', alibi: 'Filing papers in the archive' },
      { id: 's2', name: 'Miss Ophelia Vance, secretary', motive: 'Her brother sails with the smugglers', alibi: 'Taking dictation for the Admiral' },
      { id: 's3', name: 'Mr. Grim, night guard', motive: 'Known to accept bribes', alibi: 'Patrolling the east wing' },
      { id: 's4', name: 'Captain Reed, the Admiral\'s aide', motive: 'In debt to a foreign agent', alibi: 'At dinner with his club' }
    ],
    evidence: [
      { id: 'e1', type: 'document', title: 'Half-Burnt Copy', description: 'A partial copy of the cipher found in the grate. The handwriting is a careful secretary\'s hand.', location: 'Office fireplace' },
      { id: 'e2', type: 'testimony', title: 'Telegraph Clerk\'s Testimony', description: 'A coded telegram went out to a Dover address at nine o\'clock that night.', location: 'Telegraph office' },
      { id: 'e3', type: 'physical', title: 'Broken Seal', description: 'A shattered Admiralty wax seal found in the night guard\'s locker. The guard swears it was planted.', location: 'Guard\'s locker' },
      { id: 'e4', type: 'document', title: 'Duty Roster', description: 'The roster shows Miss Vance alone in the office between eight and nine, though she claims the Admiral was dictating to her.', location: 'Office wall' },
      { id: 'e5', type: 'testimony', title: 'Scullery Maid\'s Testimony', description: 'She saw a woman in a grey cloak leave by the servants\' door carrying a satchel.', location: 'Servants\' entrance' }
    ],
    solution: {
      culprit: 's2',
      explanation: 'Miss Ophelia Vance copied the ledger, burned the draft in the grate, and telegraphed its key to a Dover address — her brother\'s smuggling contact. The duty roster proves she was alone when she claimed to be taking dictation, the burnt copy is in her hand, and the maid saw her leave with the satchel. The broken seal in the guard\'s locker was planted to throw suspicion on him.'
    }
  },
  {
    id: 'case-003',
    title: 'The Clockwork Conspiracy',
    difficulty: 'hard',
    description: 'Three bank vaults have been opened across London without a single forced lock and without a witness. At each scene the thieves left one small brass gear. Scotland Yard fears a criminal genius is at work — but the truth is stranger, and closer to home.',
    location: 'The City of London',
    timePeriod: '1898',
    suspects: [
      { id: 's1', name: 'Elias Croft, master watchmaker', motive: 'Ruined by the bank that foreclosed his father\'s shop', alibi: 'Claims he worked alone in his shop all night' },
      { id: 's2', name: 'Lady Victoria Ashford', motive: 'A bored aristocrat who craves danger', alibi: 'At the opera with the Duke of Wellington' },
      { id: 's3', name: 'Constable Percy Lestrade', motive: 'Buried gambling debts and inside knowledge', alibi: 'On duty at Scotland Yard' },
      { id: 's4', name: 'Professor Moriarty (rumoured)', motive: 'Unknown; named only in whispers', alibi: 'Nowhere to be found' }
    ],
    evidence: [
      { id: 'e1', type: 'physical', title: 'Brass Gear', description: 'A hand-cut gear of forty-seven teeth, the signature work of Croft\'s workshop. It was found on the floor of the third vault.', location: 'Third vault floor' },
      { id: 'e2', type: 'document', title: 'Stolen Blueprints', description: 'Vault schematics marked with the gearing of a master key. They were taken from Croft\'s apprentice.', location: 'An abandoned warehouse' },
      { id: 'e3', type: 'testimony', title: 'The Apprentice\'s Confession', description: 'Croft built a device that opens any vault of this make. A wealthy lady paid him to do it. He swears he never met any Professor Moriarty.', location: 'Scotland Yard' },
      { id: 'e4', type: 'physical', title: 'Opera Glove', description: 'A lady\'s lace glove dusted with brass filings, matching Lady Ashford\'s opera attire. It was found in the ventilation shaft of the first vault.', location: 'First vault ventilation shaft' }
    ],
    solution: {
      culprit: 's2',
      explanation: 'Lady Victoria Ashford financed and directed the robberies for the thrill of it. Elias Croft built the vault-opening device and left his own gears behind, which is why every clue points at him — but it was Ashford\'s money, her glove, and her plan. The apprentice\'s confession names her, and the brass dust on her opera glove places her inside the vault.'
    }
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

    const existing = game.players.find(p => p.name === playerName || p.id === socket.id);
    if (existing) {
      existing.id = socket.id;
      existing.connected = true;
      socket.join(gameId);
      socket.emit('game-state-update', game);
      return;
    }

    if (game.players.length >= 2) {
      socket.emit('error', { message: 'Game is full (couples only)' });
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