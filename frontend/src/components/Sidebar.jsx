import { NavLink } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition ${
    isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
  }`;

export default function Sidebar() {
  const { user } = useAuth();
  return (
    <aside className="hidden md:flex md:w-60 flex-col border-r border-slate-200 bg-white">
      <div className="px-5 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-brand-600 text-white grid place-items-center font-bold">T</div>
          <div>
            <p className="text-sm font-semibold">Team Tasks</p>
            <p className="text-xs text-slate-500">Workspace</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
        <NavLink to="/projects" className={linkClass}>Projects</NavLink>
        <NavLink to="/tasks" className={linkClass}>Tasks</NavLink>
        {user?.role === 'admin' && <NavLink to="/team" className={linkClass}>Team</NavLink>}
      </nav>
      <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
        Signed in as <span className="font-medium text-slate-700">{user?.name}</span>
        <span className="ml-1 badge bg-slate-100 text-slate-600 capitalize">{user?.role}</span>
      </div>
    </aside>
  );
}
