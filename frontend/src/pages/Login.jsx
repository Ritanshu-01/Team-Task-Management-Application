import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuth from '../hooks/useAuth';

export default function Login() {
  const { user, login } = useAuth();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={location.state?.from?.pathname || '/dashboard'} replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return toast.error('Invalid email');
    if (!form.password) return toast.error('Password required');
    setBusy(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-md card p-8 shadow-sm">
        <div className="mb-6">
          <div className="h-9 w-9 rounded-md bg-brand-600 text-white grid place-items-center font-bold">T</div>
          <h1 className="mt-4 text-xl font-semibold">Sign in to your workspace</h1>
          <p className="text-sm text-slate-500">Manage your team's projects and tasks.</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@company.com" />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
          </div>
          <button className="btn-primary w-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        </form>
        <p className="mt-6 text-sm text-slate-500 text-center">
          No account? <Link className="text-brand-600 font-medium" to="/signup">Create one</Link>
        </p>
      </div>
    </div>
  );
}
