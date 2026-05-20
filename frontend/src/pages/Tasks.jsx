import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import useAuth from '../hooks/useAuth';

const PRIORITIES = ['low', 'medium', 'high'];
const STATUSES = ['todo', 'in_progress', 'completed'];

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState(null);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterProject, setFilterProject] = useState('all');
  const [taskOpen, setTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const blank = { title: '', description: '', priority: 'medium', status: 'todo', dueDate: '', assignedTo: '', project: '' };
  const [form, setForm] = useState(blank);

  const load = async () => {
    const responses = [api.get('/tasks')];
    if (user.role === 'admin') responses.push(api.get('/projects'), api.get('/users'));
    try {
      const results = await Promise.all(responses);
      setTasks(results[0].data);
      if (user.role === 'admin') {
        setProjects(results[1].data);
        setUsers(results[2].data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to load tasks');
    }
  };

  useEffect(() => { load(); }, []);

  const canUpdate = (t) =>
    user.role === 'admin' || (t.assignedTo && t.assignedTo._id === user.id);

  const canMutateTask = (t) =>
    user.role === 'admin' || (t.assignedTo && t.assignedTo._id === user.id);

  const openCreate = () => {
    setEditingTask(null);
    setForm({ ...blank, project: projects[0]?._id || '' });
    setTaskOpen(true);
  };

  const openEdit = (t) => {
    setEditingTask(t);
    setForm({
      title: t.title,
      description: t.description || '',
      priority: t.priority,
      status: t.status,
      dueDate: t.dueDate ? t.dueDate.slice(0, 10) : '',
      assignedTo: t.assignedTo?._id || '',
      project: t.project?._id || '',
    });
    setTaskOpen(true);
  };

  const saveTask = async () => {
    if (!form.title.trim()) return toast.error('Title required');
    if (!form.project) return toast.error('Project required');
    try {
      const payload = {
        title: form.title,
        description: form.description,
        priority: form.priority,
        status: form.status,
        dueDate: form.dueDate || null,
        assignedTo: form.assignedTo || null,
        project: form.project,
      };
      if (editingTask) await api.put(`/tasks/${editingTask._id}`, payload);
      else await api.post('/tasks', payload);
      toast.success('Saved');
      setTaskOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save task');
    }
  };

  const removeTask = async (t) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${t._id}`);
      toast.success('Deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete task');
    }
  };

  const changeStatus = async (t, status) => {
    if (!canUpdate(t)) return toast.error('You can only update tasks assigned to you');
    try {
      await api.put(`/tasks/${t._id}`, { status });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const selectedProject = projects.find((p) => p._id === form.project);
  const assignees = selectedProject?.members || [];

  const isOverdue = (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed';
  const summary = useMemo(() => {
    const counts = { todo: 0, in_progress: 0, completed: 0 };
    if (!tasks) return counts;
    tasks.forEach((t) => { counts[t.status] += 1; });
    return counts;
  }, [tasks]);

  if (!tasks) return <Loader />;

  const filtered = tasks.filter((t) =>
    (filterStatus === 'all' || t.status === filterStatus) &&
    (filterProject === 'all' || t.project?._id === filterProject)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Tasks</h2>
          <p className="text-sm text-slate-500">{user.role === 'admin' ? 'Manage tasks across projects.' : 'Track tasks assigned to you.'}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {user.role === 'admin' && <button className="btn-primary" onClick={openCreate}>+ New task</button>}
          <select className="input !w-auto" value={filterProject} onChange={(e) => setFilterProject(e.target.value)}>
            <option value="all">All projects</option>
            {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
          <select className="input !w-auto" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="card p-4">
          <div className="text-slate-500 text-sm">Todo</div>
          <div className="mt-2 text-3xl font-semibold">{summary.todo}</div>
        </div>
        <div className="card p-4">
          <div className="text-slate-500 text-sm">In progress</div>
          <div className="mt-2 text-3xl font-semibold">{summary.in_progress}</div>
        </div>
        <div className="card p-4">
          <div className="text-slate-500 text-sm">Completed</div>
          <div className="mt-2 text-3xl font-semibold">{summary.completed}</div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No tasks" description="No tasks match these filters." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="text-left px-4 py-2">Title</th>
                <th className="text-left px-4 py-2">Project</th>
                <th className="text-left px-4 py-2">Assignee</th>
                <th className="text-left px-4 py-2">Created by</th>
                <th className="text-left px-4 py-2">Due</th>
                <th className="text-left px-4 py-2">Priority</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="text-left px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((t) => (
                <tr key={t._id} className={isOverdue(t) ? 'bg-red-50/50' : ''}>
                  <td className="px-4 py-2 font-medium text-slate-800">
                    {t.title}
                    {isOverdue(t) && <span className="ml-2 badge bg-red-50 text-red-600">Overdue</span>}
                  </td>
                  <td className="px-4 py-2">
                    {t.project && <Link to={`/projects/${t.project._id}`} className="text-brand-600">{t.project.name}</Link>}
                  </td>
                  <td className="px-4 py-2 text-slate-600">{t.assignedTo?.name || 'Unassigned'}</td>
                  <td className="px-4 py-2 text-slate-600">{t.createdBy?.name || '—'}</td>
                  <td className="px-4 py-2 text-slate-600">{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-2 capitalize">{t.priority}</td>
                  <td className="px-4 py-2">
                    <select
                      className="input !w-auto !py-1 text-xs"
                      value={t.status}
                      disabled={!canUpdate(t)}
                      onChange={(e) => changeStatus(t, e.target.value)}
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2 text-xs">
                      {user.role === 'admin' && (
                        <>
                          <button onClick={() => openEdit(t)} className="text-slate-500 hover:text-brand-600">Edit</button>
                          <button onClick={() => removeTask(t)} className="text-slate-400 hover:text-red-600">Delete</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={taskOpen}
        onClose={() => setTaskOpen(false)}
        title={editingTask ? 'Edit Task' : 'New Task'}
        footer={(
          <>
            <button className="btn-secondary" onClick={() => setTaskOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={saveTask}>Save</button>
          </>
        )}
      >
        <div className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              className="input"
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="label">Project</label>
              <select className="input" value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value, assignedTo: '' })}>
                <option value="">Select project</option>
                {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Assignee</label>
              <select className="input" value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}>
                <option value="">Unassigned</option>
                {assignees.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Due date</label>
              <input type="date" className="input" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
