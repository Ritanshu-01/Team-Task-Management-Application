import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuth from '../hooks/useAuth';

export default function Signup() {
  const { user, signup } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name is required');
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return toast.error('Invalid email');
    if (form.password.length < 6) return toast.error('Password must be at least 6 chars');
    setBusy(true);
    try {
      await signup(form.name.trim(), form.email, form.password);
      toast.success('Account created');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Signup failed');
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-md card p-8 shadow-sm">
        <h1 className="text-xl font-semibold">Create your account</h1>
        <p className="text-sm text-slate-500">The first user becomes the admin.</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div><label className="label">Name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="label">Email</label>
            <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><label className="label">Password</label>
            <input className="input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
          <button className="btn-primary w-full" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
        </form>
        <p className="mt-6 text-sm text-slate-500 text-center">
          Already have an account? <Link className="text-brand-600 font-medium" to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
