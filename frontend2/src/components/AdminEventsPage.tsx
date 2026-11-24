// src/AdminEventsPage.tsx
import React, { useCallback, useEffect, useState } from 'react';
import Header from './Header';
import api from '../api';

type PendingEvent = {
  event_id: number;
  title: string;
  description: string | null;
  category: string;
  venue: string | null;
  event_date: string;
  event_time: string | null;
  allows_teams: number;
  created_by_name: string;
  created_at: string;
};

const inputCls =
  'w-full bg-white/10 text-white placeholder-gray-400 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD700]';

const AdminEventsPage = () => {
  const role = localStorage.getItem('role');
  const [pending, setPending] = useState<PendingEvent[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [roleUserId, setRoleUserId] = useState('');
  const [roleValue, setRoleValue] = useState('staff');

  const load = useCallback(async () => {
    try {
      const res = await api.get<PendingEvent[]>('/api/events/admin/pending');
      setPending(res.data);
    } catch (e: any) {
      setMsg({ type: 'err', text: e.response?.data?.error || 'Could not load pending events' });
    }
  }, []);

  useEffect(() => {
    if (role === 'admin') load();
  }, [role, load]);

  if (role !== 'admin') {
    return (
      <div>
        <Header />
        <p className="pt-24 text-center text-white">Only admins can review events.</p>
      </div>
    );
  }

  const review = async (id: number, action: 'approve' | 'reject') => {
    setBusyId(id);
    setMsg(null);
    try {
      await api.patch(`/api/events/admin/${id}/review`, { action });
      setMsg({ type: 'ok', text: action === 'approve' ? 'Event approved' : 'Event rejected' });
      load();
    } catch (e: any) {
      setMsg({ type: 'err', text: e.response?.data?.error || 'Could not update event' });
    } finally {
      setBusyId(null);
    }
  };

  const assignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    try {
      await api.put(`/api/events/admin/users/${roleUserId}/role`, { role: roleValue });
      setMsg({ type: 'ok', text: 'Role updated' });
      setRoleUserId('');
    } catch (err: any) {
      setMsg({ type: 'err', text: err.response?.data?.error || 'Could not update role' });
    }
  };

  return (
    <div>
      <Header />
      <div className="min-h-screen pt-24 px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-6xl mx-auto space-y-10">
          <h2 className="text-3xl font-bold text-white neon-text">Event approvals</h2>

          {msg && (
            <div className={`px-4 py-2 rounded-lg text-sm ${
              msg.type === 'ok' ? 'bg-green-500/20 text-green-200' : 'bg-red-500/20 text-red-200'
            }`}>
              {msg.text}
            </div>
          )}

          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Pending ({pending.length})</h3>
            {pending.length === 0 && <p className="text-gray-400 text-sm">No events waiting for review.</p>}
            {pending.map((ev) => (
              <div key={ev.event_id} className="bg-white/10 rounded-xl p-5 space-y-2">
                <p className="text-lg font-semibold text-white">{ev.title}</p>
                <p className="text-xs text-gray-400">
                  {ev.category} · {String(ev.event_date).slice(0, 10)}
                  {ev.event_time && ` ${ev.event_time.slice(0, 5)}`}
                  {ev.venue && ` · ${ev.venue}`} · submitted by {ev.created_by_name}
                  {!!ev.allows_teams && ' · team participation'}
                </p>
                {ev.description && <p className="text-sm text-gray-300">{ev.description}</p>}
                <div className="flex gap-2 pt-2">
                  <button disabled={busyId === ev.event_id} onClick={() => review(ev.event_id, 'approve')}
                    className="bg-[#FFD700] text-black font-semibold px-4 py-2 rounded-full disabled:opacity-50">
                    Approve
                  </button>
                  <button disabled={busyId === ev.event_id} onClick={() => review(ev.event_id, 'reject')}
                    className="border border-white/30 text-white px-4 py-2 rounded-full hover:bg-white/10 disabled:opacity-50">
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </section>

          <section className="bg-white/10 rounded-xl p-5 max-w-md space-y-4">
            <h3 className="text-lg font-semibold text-white">Assign a role</h3>
            <form onSubmit={assignRole} className="space-y-3">
              <input className={inputCls} type="number" min={1} placeholder="User ID" required
                value={roleUserId} onChange={(e) => setRoleUserId(e.target.value)} />
              <select className={inputCls} value={roleValue} onChange={(e) => setRoleValue(e.target.value)}>
                <option value="staff">Staff</option>
                <option value="student">Student</option>
                <option value="admin">Admin</option>
              </select>
              <button className="bg-[#FFD700] text-black font-semibold px-4 py-2 rounded-full">Update role</button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AdminEventsPage;