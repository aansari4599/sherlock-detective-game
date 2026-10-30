import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

function SiteNav() {
  const { connected } = useSocket();

  return (
    <nav className="site-nav">
      <div className="nav-inner">
        <Link to="/" className="nav-brand">
          <span className="nav-mark" aria-hidden="true">🕯️</span>
          <span className="nav-name">
            Baker Street
            <small>Investigations</small>
          </span>
        </Link>

        <div className="nav-links">
          <NavLink to="/" end className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
            Home
          </NavLink>
          <NavLink to="/cases" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
            Cases
          </NavLink>
          <NavLink to="/create" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
            Host a Case
          </NavLink>
          <NavLink to="/create-case" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
            Write a Case
          </NavLink>
        </div>

        <div className="nav-actions">
          <span className="nav-connection">
            <span className={`status-dot ${connected ? 'connected' : 'disconnected'}`} />
            {connected ? 'Online' : 'Connecting'}
          </span>
        </div>
      </div>
    </nav>
  );
}

export default SiteNav;
