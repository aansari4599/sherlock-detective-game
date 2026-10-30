import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCasesSocket, useSocket } from '../context/SocketContext';

function CreateGamePage() {
  const navigate = useNavigate();
  const { socket, connected } = useSocket();
  const { cases, loading, createCase } = useCasesSocket(socket);
  const [selectedCase, setSelectedCase] = useState(null);
  const [playerName] = useState(() => localStorage.getItem('playerName') || '');
  const [creating, setCreating] = useState(false);
  const [showCustomCase, setShowCustomCase] = useState(false);

  useEffect(() => {
    if (!playerName) {
      navigate('/');
    }
  }, [playerName, navigate]);

  const handleCreateGame = async (caseId) => {
    if (!socket || !playerName) return;
    setCreating(true);
    
    socket.emit('create-game', { playerName, caseId });
    
    socket.once('game-created', ({ gameId }) => {
      setCreating(false);
      navigate(`/game/${gameId}`);
    });
  };

  const handleCustomCaseSubmit = async (caseData) => {
    try {
      const { caseId } = await createCase(caseData);
      handleCreateGame(caseId);
      setShowCustomCase(false);
    } catch (err) {
      console.error('Failed to create case:', err);
      alert('Failed to create custom case. Please try again.');
    }
  };

  if (showCustomCase) {
    return (
      <div className="page create-case-page">
        <CaseCreatorForm 
          onSubmit={handleCustomCaseSubmit} 
          onCancel={() => setShowCustomCase(false)}
          initialData={{}}
        />
      </div>
    );
  }

  return (
    <div className="page create-game-page">
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate('/')}>← Back to Baker Street</button>
        <h1>Select Your Case</h1>
        <p className="page-subtitle">Choose a mystery for you and your partner to solve</p>
      </div>

      <div className="cases-grid">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="case-card skeleton">
              <div className="skeleton-loader" style={{ height: '200px' }} />
              <div className="case-info">
                <div className="skeleton-loader" style={{ height: '2rem', width: '60%' }} />
                <div className="skeleton-loader" style={{ height: '1rem', width: '40%' }} />
                <div className="skeleton-loader" style={{ height: '1rem', width: '80%' }} />
              </div>
            </div>
          ))
        ) : (
          cases.map((caseItem) => (
            <article 
              key={caseItem.id} 
              className={`case-card ${selectedCase === caseItem.id ? 'selected' : ''}`}
              onClick={() => setSelectedCase(caseItem.id)}
            >
              <div className="case-image">
                <span className="case-icon">{getCaseIcon(caseItem.difficulty)}</span>
                <span className={`difficulty-badge difficulty-${caseItem.difficulty}`}>
                  {caseItem.difficulty}
                </span>
              </div>
              <div className="case-info">
                <h3>{caseItem.title}</h3>
                <p className="case-location">📍 {caseItem.location} • 🕰️ {caseItem.timePeriod}</p>
                <p className="case-desc">{caseItem.description.substring(0, 120)}...</p>
                <div className="case-meta">
                  <span>👥 {caseItem.suspects?.length || 3} Suspects</span>
                  <span>🔍 {caseItem.evidence?.length || 4} Evidence</span>
                </div>
              </div>
            </article>
          ))
        )}

        <article className="case-card custom-case-card" onClick={() => setShowCustomCase(true)}>
          <div className="case-image custom">
            <span className="case-icon">✍️</span>
          </div>
          <div className="case-info">
            <h3>Create Your Own Case</h3>
            <p className="case-location">📝 Design a mystery for the community</p>
            <p className="case-desc">Write the story, plant the clues, choose the culprit. Your creation could baffle detectives worldwide.</p>
          </div>
        </article>
      </div>

      {selectedCase && (
        <div className="case-preview card gaslight">
          <h3>Selected: {cases.find(c => c.id === selectedCase)?.title}</h3>
          <p>{cases.find(c => c.id === selectedCase)?.description}</p>
          <button 
            className="btn-primary btn-large" 
            onClick={() => handleCreateGame(selectedCase)}
            disabled={creating || !connected}
          >
            {creating ? 'Summoning the Fog…' : !connected ? 'Connecting…' : 'Begin Investigation'}
          </button>
        </div>
      )}

      {!connected && (
        <p className="error-message" style={{ marginTop: '1.5rem' }}>
          Connecting to the detective server. If this is the first visit in a while, it can take up to a minute to wake.
        </p>
      )}

      <div className="page-footer">
        <Link to="/cases" className="footer-link">Browse all cases →</Link>
      </div>
    </div>
  );
}

function CaseCreatorForm({ onSubmit, onCancel, initialData }) {
  const [formData, setFormData] = useState({
    title: '',
    difficulty: 'medium',
    description: '',
    location: '',
    timePeriod: '1895',
    suspects: [{ name: '', motive: '', alibi: '' }, { name: '', motive: '', alibi: '' }, { name: '', motive: '', alibi: '' }],
    evidence: [{ type: 'physical', title: '', description: '', location: '' }, { type: 'document', title: '', description: '', location: '' }, { type: 'testimony', title: '', description: '', location: '' }, { type: 'physical', title: '', description: '', location: '' }],
    solution: { culpritIndex: 0, explanation: '' }
  });

  const evidenceTypes = ['physical', 'document', 'testimony', 'digital'];

  const handleSubmit = (e) => {
    e.preventDefault();
    const caseData = {
      ...formData,
      suspects: formData.suspects.map((s, i) => ({ id: `s${i+1}`, ...s })),
      evidence: formData.evidence.map((e, i) => ({ id: `e${i+1}`, ...e })),
      solution: { culprit: `s${formData.solution.culpritIndex + 1}`, explanation: formData.solution.explanation }
    };
    onSubmit(caseData);
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal card large" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px' }}>
        <button className="modal-close" onClick={onCancel}>×</button>
        <h2>✍️ Craft a New Mystery</h2>
        <form onSubmit={handleSubmit} className="case-form scrollbar">
          <div className="form-row">
            <div className="form-group">
              <label>Case Title *</label>
              <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required placeholder="The Mystery of..." />
            </div>
            <div className="form-group">
              <label>Difficulty *</label>
              <select value={formData.difficulty} onChange={e => setFormData({...formData, difficulty: e.target.value})}>
                <option value="easy">Elementary</option>
                <option value="medium">Challenging</option>
                <option value="hard">Master Detective</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Location *</label>
              <input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} required placeholder="221B Baker Street, London" />
            </div>
            <div className="form-group">
              <label>Time Period *</label>
              <input type="text" value={formData.timePeriod} onChange={e => setFormData({...formData, timePeriod: e.target.value})} required placeholder="1895" />
            </div>
          </div>

          <div className="form-group">
            <label>Case Description *</label>
            <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={4} required placeholder="Set the scene... A dark and stormy night..." />
          </div>

          <fieldset className="form-section">
            <legend>👥 Suspects (Minimum 3)</legend>
            {formData.suspects.map((suspect, i) => (
              <div key={i} className="suspect-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Name *</label>
                    <input type="text" value={suspect.name} onChange={e => {
                      const newSuspects = [...formData.suspects];
                      newSuspects[i] = {...suspect, name: e.target.value};
                      setFormData({...formData, suspects: newSuspects});
                    }} required placeholder={`Suspect ${i+1}`} />
                  </div>
                  <div className="form-group">
                    <label>Motive *</label>
                    <input type="text" value={suspect.motive} onChange={e => {
                      const newSuspects = [...formData.suspects];
                      newSuspects[i] = {...suspect, motive: e.target.value};
                      setFormData({...formData, suspects: newSuspects});
                    }} required placeholder="Why would they do it?" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Alibi *</label>
                  <input type="text" value={suspect.alibi} onChange={e => {
                    const newSuspects = [...formData.suspects];
                    newSuspects[i] = {...suspect, alibi: e.target.value};
                    setFormData({...formData, suspects: newSuspects});
                  }} required placeholder="Where were they?" />
                </div>
                {formData.suspects.length > 3 && (
                  <button type="button" className="btn-danger btn-sm" onClick={() => {
                    setFormData({...formData, suspects: formData.suspects.filter((_, idx) => idx !== i)});
                  }}>Remove</button>
                )}
              </div>
            ))}
            <button type="button" className="btn-secondary" onClick={() => setFormData({...formData, suspects: [...formData.suspects, { name: '', motive: '', alibi: '' }]})}>
              + Add Suspect
            </button>
          </fieldset>

          <fieldset className="form-section">
            <legend>🔍 Evidence (Minimum 4)</legend>
            {formData.evidence.map((ev, i) => (
              <div key={i} className="evidence-form">
                <div className="form-row">
                  <div className="form-group" style={{ width: '150px' }}>
                    <label>Type *</label>
                    <select value={ev.type} onChange={e => {
                      const newEvidence = [...formData.evidence];
                      newEvidence[i] = {...ev, type: e.target.value};
                      setFormData({...formData, evidence: newEvidence});
                    }}>
                      {evidenceTypes.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Title *</label>
                    <input type="text" value={ev.title} onChange={e => {
                      const newEvidence = [...formData.evidence];
                      newEvidence[i] = {...ev, title: e.target.value};
                      setFormData({...formData, evidence: newEvidence});
                    }} required placeholder="Brief title" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Description *</label>
                    <textarea value={ev.description} onChange={e => {
                      const newEvidence = [...formData.evidence];
                      newEvidence[i] = {...ev, description: e.target.value};
                      setFormData({...formData, evidence: newEvidence});
                    }} rows={2} required placeholder="Detailed description" />
                  </div>
                  <div className="form-group">
                    <label>Location Found *</label>
                    <input type="text" value={ev.location} onChange={e => {
                      const newEvidence = [...formData.evidence];
                      newEvidence[i] = {...ev, location: e.target.value};
                      setFormData({...formData, evidence: newEvidence});
                    }} required placeholder="Where was it discovered?" />
                  </div>
                </div>
                {formData.evidence.length > 4 && (
                  <button type="button" className="btn-danger btn-sm" onClick={() => {
                    setFormData({...formData, evidence: formData.evidence.filter((_, idx) => idx !== i)});
                  }}>Remove</button>
                )}
              </div>
            ))}
            <button type="button" className="btn-secondary" onClick={() => setFormData({...formData, evidence: [...formData.evidence, { type: 'physical', title: '', description: '', location: '' }]})}>
              + Add Evidence
            </button>
          </fieldset>

          <fieldset className="form-section">
            <legend>🎯 Solution</legend>
            <div className="form-group">
              <label>The Culprit *</label>
              <select value={formData.solution.culpritIndex} onChange={e => setFormData({...formData, solution: {...formData.solution, culpritIndex: parseInt(e.target.value)}})}>
                {formData.suspects.map((s, i) => <option key={i} value={i}>{s.name || `Suspect ${i+1}`}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Explanation *</label>
              <textarea value={formData.solution.explanation} onChange={e => setFormData({...formData, solution: {...formData.solution, explanation: e.target.value}})} rows={4} required placeholder="How does the evidence point to the culprit?" />
            </div>
          </fieldset>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
            <button type="submit" className="btn-primary">Publish Case →</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function getCaseIcon(difficulty) {
  switch(difficulty) {
    case 'easy': return '🟢';
    case 'medium': return '🟡';
    case 'hard': return '🔴';
    default: return '🔍';
  }
}

export default CreateGamePage;