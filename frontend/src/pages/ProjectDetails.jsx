import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import useAuth from '../hooks/useAuth';
import Loader from '../components/Loader';
import Modal from '../components/Modal';

const PRIORITIES = ['low', 'medium', 'high'];
const STATUSES = ['todo', 'in_progress', 'completed'];

export default function ProjectDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [users, setUsers] = useState([]);
  const [taskOpen, setTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [memberOpen, setMemberOpen] = useState(false);
  const [memberPick, setMemberPick] = useState('');
  const isAdmin = user.role === 'admin';

  const blank = { title: '', description: '', priority: 'medium', status: 'todo', dueDate: '', assignedTo: '' };
  const [form, setForm] = useState(blank);

  const load = () => api.get(`/projects/${id}`).then((r) => setData(r.data));

  useEffect(() => {
    load();
    if (user.role === 'admin') api.get('/users').then((r) => setUsers(r.data));
  }, [id]);

  const openCreate = () => { setEditingTask(null); setForm(blank); setTaskOpen(true); };
  const openEdit = (t) => {
    setEditingTask(t);
    setForm({
      title: t.title, description: t.description || '', priority: t.priority, status: t.status,
      dueDate: t.dueDate ? t.dueDate.slice(0, 10) : '', assignedTo: t.assignedTo?._id || '',
    });
    setTaskOpen(true);
  };

  const saveTask = async () => {
    if (!form.title.trim()) return toast.error('Title required');
    try {
      const payload = { ...form, project: id, assignedTo: form.assignedTo || null, dueDate: form.dueDate || null };
      if (editingTask) await api.put(`/tasks/${editingTask._id}`, payload);
      else await api.post('/tasks', payload);
      toast.success('Saved'); setTaskOpen(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const removeTask = async (tid) => {
    if (!confirm('Delete this task?')) return;
    try { await api.delete(`/tasks/${tid}`); toast.success('Deleted'); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const changeStatus = async (t, status) => {
    try { await api.put(`/tasks/${t._id}`, { status }); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const addMember = async () => {
    if (!memberPick) return;
    try { await api.post(`/projects/${id}/members`, { userId: memberPick }); toast.success('Member added'); setMemberOpen(false); setMemberPick(''); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const removeMember = async (uid) => {
    try { await api.delete(`/projects/${id}/members/${uid}`); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  if (!data) return <Loader />;
  const { project, tasks, progress, updates = [] } = data;
  const canMutateTask = (t) => isAdmin || (t.assignedTo && t.assignedTo._id === user.id);

  const candidates = users.filter((u) => !project.members.some((m) => m._id === u._id));

  return (
    <div className="space-y-6">
      <div>
        <Link to="/projects" className="text-xs text-slate-500 hover:text-brand-600">← Projects</Link>
        <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold">{project.name}</h2>
            <p className="text-sm text-slate-500">{project.description || 'No description'}</p>
            <div className="mt-2 text-xs text-slate-500">
              Created by {project.createdBy?.name || 'Unknown'} · {new Date(project.createdAt).toLocaleDateString()}
            </div>
          </div>
          {isAdmin && <button className="btn-primary" onClick={openCreate}>+ New task</button>}
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-slate-700">Progress</p>
          <span className="text-sm text-slate-500">{progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full bg-brand-600 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {updates.length > 0 && (
        <div className="card">
          <div className="px-5 py-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold">Recent activity</h3>
          </div>
          <ul className="divide-y divide-slate-100">
            {updates.map((u) => (
              <li key={u._id} className="px-5 py-2.5 text-sm text-slate-600">
                <span className="font-medium text-slate-800">{u.updatedBy?.name}</span>
                {' moved '}
                <span className="font-medium">{u.task?.title}</span>
                {' '}
                {u.previousStatus ? `${u.previousStatus.replace('_', ' ')} → ` : ''}
                {u.newStatus.replace('_', ' ')}
                <span className="text-xs text-slate-400 ml-2">{new Date(u.createdAt).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card lg:col-span-2">
          <div className="px-5 py-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold">Tasks</h3>
          </div>
          {tasks.length === 0 ? (
            <p className="px-5 py-8 text-sm text-slate-500 text-center">
              {isAdmin ? 'No tasks yet.' : 'No tasks assigned to you in this project.'}
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {tasks.map((t) => (
                <li key={t._id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{t.title}</p>
                    <p className="text-xs text-slate-500">
                      {t.assignedTo ? t.assignedTo.name : 'Unassigned'} ·{' '}
                      {t.dueDate ? `Due ${new Date(t.dueDate).toLocaleDateString()}` : 'No due date'} ·{' '}
                      <span className="capitalize">{t.priority}</span>
                    </p>
                  </div>
                  <select
                    className="input !w-auto !py-1 text-xs"
                    value={t.status}
                    onChange={(e) => changeStatus(t, e.target.value)}
                    disabled={!canMutateTask(t)}
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                  {isAdmin && (
                    <div className="flex items-center gap-2 text-xs">
                      <button onClick={() => openEdit(t)} className="text-slate-500 hover:text-brand-600">Edit</button>
                      <button onClick={() => removeTask(t._id)} className="text-slate-400 hover:text-red-600">Delete</button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Members</h3>
            {isAdmin && <button onClick={() => setMemberOpen(true)} className="text-xs text-brand-600">Add</button>}
          </div>
          {project.members.length === 0 ? (
            <p className="px-5 py-6 text-sm text-slate-500">No members.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {project.members.map((m) => (
                <li key={m._id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{m.name}</p>
                    <p className="text-xs text-slate-500">{m.email}</p>
                  </div>
                  {isAdmin && (
                    <button onClick={() => removeMember(m._id)} className="text-xs text-slate-400 hover:text-red-600">Remove</button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <Modal
        open={taskOpen}
        onClose={() => setTaskOpen(false)}
        title={editingTask ? 'Edit task' : 'New task'}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setTaskOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={saveTask}>Save</button>
          </>
        }
      >
        <div className="space-y-4">
          <div><label className="label">Title</label>
            <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><label className="label">Description</label>
            <textarea className="input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Priority</label>
              <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select></div>
            <div><label className="label">Status</label>
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select></div>
            <div><label className="label">Due date</label>
              <input type="date" className="input" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></div>
            <div><label className="label">Assign to</label>
              <select className="input" value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}>
                <option value="">Unassigned</option>
                {project.members.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
              </select></div>
          </div>
        </div>
      </Modal>

      <Modal
        open={memberOpen}
        onClose={() => setMemberOpen(false)}
        title="Add member"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setMemberOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={addMember}>Add</button>
          </>
        }
      >
        {candidates.length === 0 ? (
          <p className="text-sm text-slate-500">No users left to add.</p>
        ) : (
          <select className="input" value={memberPick} onChange={(e) => setMemberPick(e.target.value)}>
            <option value="">Select user…</option>
            {candidates.map((u) => <option key={u._id} value={u._id}>{u.name} ({u.email})</option>)}
          </select>
        )}
      </Modal>
    </div>
  );
}
