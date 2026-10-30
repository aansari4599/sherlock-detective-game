import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCasesSocket, useSocket } from '../context/SocketContext';

function CasesListPage() {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { cases, loading } = useCasesSocket(socket);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filteredCases = cases.filter(c => {
    const matchesFilter = filter === 'all' || c.difficulty === filter;
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase()) || 
                         c.description.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const customCases = filteredCases.filter(c => c.id.startsWith('custom-'));
  const officialCases = filteredCases.filter(c => !c.id.startsWith('custom-'));

  return (
    <div className="page cases-page">
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate('/')}>← Back to Baker Street</button>
        <h1>Case Archives</h1>
        <p className="page-subtitle">Browse mysteries from Scotland Yard and fellow detectives</p>
      </div>

      <div className="cases-toolbar card">
        <div className="search-box">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cases..."
          />
        </div>
        <div className="filter-tabs">
          {['all', 'easy', 'medium', 'hard'].map(f => (
            <button
              key={f}
              className={`filter-tab ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All Cases' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="cases-sections">
        {officialCases.length > 0 && (
          <section className="cases-section">
            <h2 className="section-title">📜 Scotland Yard Archives</h2>
            <div className="cases-grid">
              {officialCases.map(caseItem => (
                <CaseCard key={caseItem.id} caseData={caseItem} onPlay={navigate} />
              ))}
            </div>
          </section>
        )}

        {customCases.length > 0 && (
          <section className="cases-section">
            <h2 className="section-title">✍️ Community Cases</h2>
            <div className="cases-grid">
              {customCases.map(caseItem => (
                <CaseCard key={caseItem.id} caseData={caseItem} onPlay={navigate} community />
              ))}
            </div>
          </section>
        )}

        {filteredCases.length === 0 && (
          <div className="empty-state card">
            <h3>No cases found</h3>
            <p>Try adjusting your search or filter</p>
            <Link to="/create-case" className="btn-primary">Create Your Own Case</Link>
          </div>
        )}
      </div>

      <div className="page-footer">
        <Link to="/create-case" className="btn-primary">✍️ Craft a New Mystery</Link>
      </div>
    </div>
  );
}

function CaseCard({ caseData, onPlay, community }) {
  return (
    <article className="case-card" onClick={() => onPlay(`/create?case=${caseData.id}`)}>
      <div className="case-image">
        <span className="case-icon">{getCaseIcon(caseData.difficulty)}</span>
        <span className={`difficulty-badge difficulty-${caseData.difficulty}`}>
          {caseData.difficulty}
        </span>
        {community && <span className="community-badge">Community</span>}
      </div>
      <div className="case-info">
        <h3>{caseData.title}</h3>
        <p className="case-location">📍 {caseData.location} • 🕰️ {caseData.timePeriod}</p>
        <p className="case-desc">{caseData.description.substring(0, 120)}...</p>
        <div className="case-meta">
          <span>👥 {caseData.suspects?.length || 3} Suspects</span>
          <span>🔍 {caseData.evidence?.length || 4} Evidence</span>
          {community && caseData.createdBy && <span>👤 By Detective</span>}
        </div>
      </div>
    </article>
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

export default CasesListPage;