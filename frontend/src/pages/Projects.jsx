import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import useAuth from '../hooks/useAuth';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';

export default function Projects() {
  const { user } = useAuth();
  const [items, setItems] = useState(null);
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', members: [] });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const results = [api.get('/projects')];
    if (user.role === 'admin') results.push(api.get('/users'));
    const [projectsRes, usersRes] = await Promise.all(results);
    setItems(projectsRes.data);
    if (user.role === 'admin' && usersRes) setUsers(usersRes.data);
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm({ name: '', description: '', members: [] }); setOpen(true); };
  const openEdit = (p) => { setEditing(p); setForm({ name: p.name, description: p.description || '', members: p.members?.map((m) => m._id) || [] }); setOpen(true); };

  const save = async () => {
    if (!form.name.trim()) return toast.error('Project name required');
    setBusy(true);
    try {
      if (editing) {
        await api.put(`/projects/${editing._id}`, form);
        toast.success('Project updated');
      } else {
        await api.post('/projects', form);
        toast.success('Project created');
      }
      setOpen(false); setForm({ name: '', description: '', members: [] }); setEditing(null);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setBusy(false); }
  };

  const remove = async (id) => {
    if (!confirm('Delete this project and its tasks?')) return;
    try {
      await api.delete(`/projects/${id}`);
      toast.success('Project deleted');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  if (!items) return <Loader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Projects</h2>
          <p className="text-sm text-slate-500">All projects you have access to.</p>
        </div>
        {user.role === 'admin' && (
          <button className="btn-primary" onClick={openCreate}>+ New project</button>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description={user.role === 'admin' ? 'Create your first project to get started.' : 'You have not been added to any project yet.'}
          action={user.role === 'admin' && <button className="btn-primary" onClick={openCreate}>Create project</button>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((p) => (
            <div key={p._id} className="card p-5 flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <Link to={`/projects/${p._id}`} className="font-semibold text-slate-800 hover:text-brand-600">{p.name}</Link>
                {user.role === 'admin' && (
                  <div className="flex gap-2 text-xs">
                    <button onClick={() => openEdit(p)} className="text-slate-500 hover:text-brand-600">Edit</button>
                    <button onClick={() => remove(p._id)} className="text-slate-400 hover:text-red-600">Delete</button>
                  </div>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-500 line-clamp-2 min-h-[2.5rem]">{p.description || 'No description'}</p>
              <div className="mt-3">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Progress</span>
                  <span>{p.progress ?? 0}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-brand-600" style={{ width: `${p.progress ?? 0}%` }} />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>{p.members.length} member{p.members.length === 1 ? '' : 's'} · {p.taskCount ?? 0} tasks</span>
                <span>{new Date(p.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Created by {p.createdBy?.name || 'Unknown'}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit project' : 'New project'}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={save} disabled={busy}>
              {busy ? 'Saving…' : editing ? 'Save' : 'Create'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div><label className="label">Name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="label">Description</label>
            <textarea className="input" rows={3} value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          {user.role === 'admin' && (
            <div>
              <label className="label">Members</label>
              <select
                className="input"
                multiple
                value={form.members}
                onChange={(e) => setForm({
                  ...form,
                  members: Array.from(e.target.selectedOptions, (option) => option.value),
                })}
              >
                {users.map((u) => (
                  <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">Hold Control (Windows) or Command (Mac) to select multiple members.</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
