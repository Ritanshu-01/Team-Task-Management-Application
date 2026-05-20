import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const linkClass = ({ isActive }) =>
  `block rounded-md px-3 py-2 text-sm font-medium ${
    isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
  }`;

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="h-14 px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-md"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
          <h1 className="text-sm font-semibold text-slate-700">Team Task Manager</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-xs text-slate-500">{user?.name}</span>
          <div className="h-8 w-8 rounded-full bg-brand-100 text-brand-700 grid place-items-center text-sm font-semibold">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <button onClick={handleLogout} className="btn-secondary !py-1.5 !px-3 text-xs">
            Logout
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="md:hidden border-t border-slate-100 px-3 py-2 space-y-1" onClick={() => setMenuOpen(false)}>
          <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
          <NavLink to="/projects" className={linkClass}>Projects</NavLink>
          <NavLink to="/tasks" className={linkClass}>Tasks</NavLink>
          {user?.role === 'admin' && <NavLink to="/team" className={linkClass}>Team</NavLink>}
        </nav>
      )}
    </header>
  );
}
