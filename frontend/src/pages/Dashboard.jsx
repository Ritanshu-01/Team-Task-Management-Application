import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import Loader from '../components/Loader';

function StatCard({ label, value, tone = 'slate' }) {
  const tones = {
    slate: 'text-slate-700',
    green: 'text-emerald-600',
    amber: 'text-amber-600',
    red: 'text-red-600',
  };
  return (
    <div className="card p-5">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${tones[tone]}`}>{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/dashboard')
      .then((r) => setData(r.data))
      .catch(() => toast.error('Failed to load dashboard'));
  }, []);

  if (!data) return <Loader />;
  const { stats, recentProjects, recentTasks, projectProgress = [] } = data;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Dashboard</h2>
        <p className="text-sm text-slate-500">Overview of your work.</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="Total tasks" value={stats.total} />
        <StatCard label="Completed" value={stats.completed} tone="green" />
        <StatCard label="Pending" value={stats.pending} tone="amber" />
        <StatCard label="Overdue" value={stats.overdue} tone="red" />
        <StatCard label="Completion rate" value={`${stats.completionRate ?? 0}%`} tone="green" />
      </div>
      {projectProgress.length > 0 && (
        <div className="card">
          <div className="px-5 py-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold">Project progress</h3>
          </div>
          <ul className="divide-y divide-slate-100">
            {projectProgress.map((p) => (
              <li key={p._id} className="px-5 py-3">
                <div className="flex items-center justify-between mb-1.5">
                  <Link to={`/projects/${p._id}`} className="text-sm font-medium text-slate-700 hover:text-brand-600">{p.name}</Link>
                  <span className="text-xs text-slate-500">{p.completedTasks}/{p.totalTasks} done · {p.progress}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-brand-600" style={{ width: `${p.progress}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Recent projects</h3>
            <Link to="/projects" className="text-xs text-brand-600">View all</Link>
          </div>
          <ul className="divide-y divide-slate-100">
            {recentProjects.length === 0 && <li className="px-5 py-6 text-sm text-slate-500">No projects yet.</li>}
            {recentProjects.map((p) => (
              <li key={p._id} className="px-5 py-3 flex items-center justify-between">
                <Link to={`/projects/${p._id}`} className="text-sm font-medium text-slate-700 hover:text-brand-600">{p.name}</Link>
                <span className="text-xs text-slate-400">{new Date(p.updatedAt).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Recent tasks</h3>
            <Link to="/tasks" className="text-xs text-brand-600">View all</Link>
          </div>
          <ul className="divide-y divide-slate-100">
            {recentTasks.length === 0 && <li className="px-5 py-6 text-sm text-slate-500">No tasks yet.</li>}
            {recentTasks.map((t) => (
              <li key={t._id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{t.title}</p>
                  <p className="text-xs text-slate-500">{t.project?.name}</p>
                </div>
                <span className={`badge ${
                  t.status === 'completed' ? 'bg-emerald-50 text-emerald-700'
                  : t.status === 'in_progress' ? 'bg-blue-50 text-blue-700'
                  : 'bg-slate-100 text-slate-600'}`}>
                  {t.status.replace('_', ' ')}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
