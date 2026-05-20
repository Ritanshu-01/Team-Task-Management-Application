import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import Loader from '../components/Loader';
import useAuth from '../hooks/useAuth';

export default function Team() {
  const [users, setUsers] = useState(null);

  const load = () => api.get('/users').then((r) => setUsers(r.data));
  useEffect(() => { load(); }, []);

  const setRole = async (id, role) => {
    try { await api.put(`/users/${id}/role`, { role }); toast.success('Role updated'); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const { user } = useAuth();

  if (!users) return <Loader />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Team</h2>
        <p className="text-sm text-slate-500">Manage user roles.</p>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[480px]">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="text-left px-4 py-2">Name</th>
              <th className="text-left px-4 py-2">Email</th>
              <th className="text-left px-4 py-2">Joined</th>
              <th className="text-left px-4 py-2">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u._id}>
                <td className="px-4 py-2 font-medium">{u.name}</td>
                <td className="px-4 py-2 text-slate-600">{u.email}</td>
                <td className="px-4 py-2 text-slate-600">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-2">
                  <select
                    className="input !w-auto !py-1 text-xs"
                    value={u.role}
                    onChange={(e) => setRole(u._id, e.target.value)}
                    disabled={user?.id === u._id}
                  >
                    <option value="member">member</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
