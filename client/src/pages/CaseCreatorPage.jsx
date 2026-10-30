import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCasesSocket, useSocket } from '../context/SocketContext';

function CaseCreatorPage() {
  const navigate = useNavigate();
  const { caseId } = useParams();
  const { socket } = useSocket();
  const { cases, createCase } = useCasesSocket(socket);
  const editing = !!caseId;
  const existingCase = cases.find(c => c.id === caseId);
  
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

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editing && existingCase) {
      setFormData({
        title: existingCase.title,
        difficulty: existingCase.difficulty,
        description: existingCase.description,
        location: existingCase.location,
        timePeriod: existingCase.timePeriod,
        suspects: existingCase.suspects.map(s => ({ name: s.name, motive: s.motive, alibi: s.alibi })),
        evidence: existingCase.evidence.map(e => ({ type: e.type, title: e.title, description: e.description, location: e.location })),
        solution: { culpritIndex: existingCase.suspects.findIndex(s => s.id === existingCase.solution.culprit), explanation: existingCase.solution.explanation }
      });
    }
  }, [editing, existingCase]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.timePeriod.trim()) newErrors.timePeriod = 'Time period is required';
    
    formData.suspects.forEach((s, i) => {
      if (!s.name.trim()) newErrors[`suspect${i}_name`] = 'Name required';
      if (!s.motive.trim()) newErrors[`suspect${i}_motive`] = 'Motive required';
      if (!s.alibi.trim()) newErrors[`suspect${i}_alibi`] = 'Alibi required';
    });
    
    formData.evidence.forEach((e, i) => {
      if (!e.title.trim()) newErrors[`evidence${i}_title`] = 'Title required';
      if (!e.description.trim()) newErrors[`evidence${i}_description`] = 'Description required';
      if (!e.location.trim()) newErrors[`evidence${i}_location`] = 'Location required';
    });
    
    if (!formData.solution.explanation.trim()) newErrors.explanation = 'Explanation required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setSubmitting(true);
    try {
      const caseData = {
        ...formData,
        suspects: formData.suspects.map((s, i) => ({ id: `s${i+1}`, ...s })),
        evidence: formData.evidence.map((e, i) => ({ id: `e${i+1}`, ...e })),
        solution: { culprit: `s${formData.solution.culpritIndex + 1}`, explanation: formData.solution.explanation }
      };
      
      if (editing) {
        // For editing, we'd need a backend update endpoint
        // For now, create as new
        await createCase(caseData);
      } else {
        await createCase(caseData);
      }
      navigate('/cases');
    } catch (err) {
      console.error('Failed to save case:', err);
      setErrors({ submit: 'Failed to save case. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const evidenceTypes = ['physical', 'document', 'testimony', 'digital'];

  return (
    <div className="page case-creator-page">
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate('/cases')}>← Back to Archives</button>
        <h1>{editing ? 'Edit Case' : 'Craft a New Mystery'}</h1>
        <p className="page-subtitle">{editing ? 'Modify your mystery' : 'Design a case for detectives worldwide'}</p>
      </div>

      <form onSubmit={handleSubmit} className="case-form card scrollbar">
        <div className="form-row">
          <div className="form-group">
            <label>Case Title *</label>
            <input 
              type="text" 
              value={formData.title} 
              onChange={e => setFormData({...formData, title: e.target.value})} 
              required 
              placeholder="The Mystery of the Vanishing..."
              className={errors.title ? 'error' : ''}
            />
            {errors.title && <span className="error-text">{errors.title}</span>}
          </div>
          <div className="form-group">
            <label>Difficulty *</label>
            <select value={formData.difficulty} onChange={e => setFormData({...formData, difficulty: e.target.value})}>
              <option value="easy">🟢 Elementary - New detectives</option>
              <option value="medium">🟡 Challenging - Experienced pairs</option>
              <option value="hard">🔴 Master Detective - Experts only</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Location *</label>
            <input 
              type="text" 
              value={formData.location} 
              onChange={e => setFormData({...formData, location: e.target.value})} 
              required 
              placeholder="221B Baker Street, London"
              className={errors.location ? 'error' : ''}
            />
            {errors.location && <span className="error-text">{errors.location}</span>}
          </div>
          <div className="form-group">
            <label>Time Period *</label>
            <input 
              type="text" 
              value={formData.timePeriod} 
              onChange={e => setFormData({...formData, timePeriod: e.target.value})} 
              required 
              placeholder="1895"
              className={errors.timePeriod ? 'error' : ''}
            />
            {errors.timePeriod && <span className="error-text">{errors.timePeriod}</span>}
          </div>
        </div>

        <div className="form-group">
          <label>Case Description *</label>
          <textarea 
            value={formData.description} 
            onChange={e => setFormData({...formData, description: e.target.value})} 
            rows={4} 
            required 
            placeholder="Set the scene... A dark and stormy night. The clock struck midnight..."
            className={errors.description ? 'error' : ''}
          />
          {errors.description && <span className="error-text">{errors.description}</span>}
        </div>

        <fieldset className="form-section">
          <legend>👥 Suspects (Minimum 3, Maximum 6)</legend>
          {formData.suspects.map((suspect, i) => (
            <div key={i} className="suspect-form">
              <div className="suspect-header">
                <h4>Suspect {i + 1}</h4>
                {formData.suspects.length > 3 && (
                  <button type="button" className="btn-danger btn-sm" onClick={() => {
                    setFormData({...formData, suspects: formData.suspects.filter((_, idx) => idx !== i)});
                  }}>Remove</button>
                )}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Name *</label>
                  <input 
                    type="text" 
                    value={suspect.name} 
                    onChange={e => {
                      const newSuspects = [...formData.suspects];
                      newSuspects[i] = {...suspect, name: e.target.value};
                      setFormData({...formData, suspects: newSuspects});
                    }} 
                    required 
                    placeholder={`Suspect ${i+1}`}
                    className={errors[`suspect${i}_name`] ? 'error' : ''}
                  />
                  {errors[`suspect${i}_name`] && <span className="error-text">{errors[`suspect${i}_name`]}</span>}
                </div>
                <div className="form-group">
                  <label>Motive *</label>
                  <input 
                    type="text" 
                    value={suspect.motive} 
                    onChange={e => {
                      const newSuspects = [...formData.suspects];
                      newSuspects[i] = {...suspect, motive: e.target.value};
                      setFormData({...formData, suspects: newSuspects});
                    }} 
                    required 
                    placeholder="Why would they do it?"
                    className={errors[`suspect${i}_motive`] ? 'error' : ''}
                  />
                  {errors[`suspect${i}_motive`] && <span className="error-text">{errors[`suspect${i}_motive`]}</span>}
                </div>
              </div>
              <div className="form-group">
                <label>Alibi *</label>
                <input 
                  type="text" 
                  value={suspect.alibi} 
                  onChange={e => {
                    const newSuspects = [...formData.suspects];
                    newSuspects[i] = {...suspect, alibi: e.target.value};
                    setFormData({...formData, suspects: newSuspects});
                  }} 
                  required 
                  placeholder="Where were they at the time?"
                  className={errors[`suspect${i}_alibi`] ? 'error' : ''}
                />
                {errors[`suspect${i}_alibi`] && <span className="error-text">{errors[`suspect${i}_alibi`]}</span>}
              </div>
            </div>
          ))}
          <button type="button" className="btn-secondary" onClick={() => setFormData({...formData, suspects: [...formData.suspects, { name: '', motive: '', alibi: '' }]})} disabled={formData.suspects.length >= 6}>
            + Add Suspect
          </button>
        </fieldset>

        <fieldset className="form-section">
          <legend>🔍 Evidence (Minimum 4, Maximum 8)</legend>
          {formData.evidence.map((ev, i) => (
            <div key={i} className="evidence-form">
              <div className="evidence-header">
                <h4>Evidence {i + 1}</h4>
                {formData.evidence.length > 4 && (
                  <button type="button" className="btn-danger btn-sm" onClick={() => {
                    setFormData({...formData, evidence: formData.evidence.filter((_, idx) => idx !== i)});
                  }}>Remove</button>
                )}
              </div>
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
                  <input 
                    type="text" 
                    value={ev.title} 
                    onChange={e => {
                      const newEvidence = [...formData.evidence];
                      newEvidence[i] = {...ev, title: e.target.value};
                      setFormData({...formData, evidence: newEvidence});
                    }} 
                    required 
                    placeholder="Brief title"
                    className={errors[`evidence${i}_title`] ? 'error' : ''}
                  />
                  {errors[`evidence${i}_title`] && <span className="error-text">{errors[`evidence${i}_title`]}</span>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Description *</label>
                  <textarea 
                    value={ev.description} 
                    onChange={e => {
                      const newEvidence = [...formData.evidence];
                      newEvidence[i] = {...ev, description: e.target.value};
                      setFormData({...formData, evidence: newEvidence});
                    }} 
                    rows={2} 
                    required 
                    placeholder="Detailed description of the evidence"
                    className={errors[`evidence${i}_description`] ? 'error' : ''}
                  />
                  {errors[`evidence${i}_description`] && <span className="error-text">{errors[`evidence${i}_description`]}</span>}
                </div>
                <div className="form-group">
                  <label>Location Found *</label>
                  <input 
                    type="text" 
                    value={ev.location} 
                    onChange={e => {
                      const newEvidence = [...formData.evidence];
                      newEvidence[i] = {...ev, location: e.target.value};
                      setFormData({...formData, evidence: newEvidence});
                    }} 
                    required 
                    placeholder="Where was it discovered?"
                    className={errors[`evidence${i}_location`] ? 'error' : ''}
                  />
                  {errors[`evidence${i}_location`] && <span className="error-text">{errors[`evidence${i}_location`]}</span>}
                </div>
              </div>
            </div>
          ))}
          <button type="button" className="btn-secondary" onClick={() => setFormData({...formData, evidence: [...formData.evidence, { type: 'physical', title: '', description: '', location: '' }]})} disabled={formData.evidence.length >= 8}>
            + Add Evidence
          </button>
        </fieldset>

        <fieldset className="form-section">
          <legend>🎯 Solution</legend>
          <div className="form-group">
            <label>The Culprit *</label>
            <select 
              value={formData.solution.culpritIndex} 
              onChange={e => setFormData({...formData, solution: {...formData.solution, culpritIndex: parseInt(e.target.value)}})}
            >
              {formData.suspects.map((s, i) => <option key={i} value={i}>{s.name || `Suspect ${i+1}`}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Explanation *</label>
            <textarea 
              value={formData.solution.explanation} 
              onChange={e => setFormData({...formData, solution: {...formData.solution, explanation: e.target.value}})} 
              rows={4} 
              required 
              placeholder="How does the evidence point to the culprit? Explain the chain of deduction..."
              className={errors.explanation ? 'error' : ''}
            />
            {errors.explanation && <span className="error-text">{errors.explanation}</span>}
          </div>
        </fieldset>

        {errors.submit && <div className="error-banner">{errors.submit}</div>}

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate('/cases')}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Publishing...' : (editing ? 'Update Case' : 'Publish Case')}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CaseCreatorPage;