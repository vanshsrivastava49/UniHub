// src/StaffEventsPage.tsx
import React, { useCallback, useEffect, useState } from 'react';
import Header from './Header';
import api from '../api';

type MyEvent = {
  event_id: number;
  title: string;
  category: string;
  event_date: string;
  status: 'pending' | 'approved' | 'rejected';
  allows_teams: number;
  registration_count: number;
};

const emptyForm = {
  title: '',
  description: '',
  category: 'technical',
  venue: '',
  event_date: '',
  event_time: '',
  image_url: '',
  allows_teams: false,
};

const inputCls =
  'w-full bg-white/10 text-white placeholder-gray-400 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD700]';

const todayStr = () => {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
};

const statusCls = (s: string) =>
  s === 'approved' ? 'text-green-300' : s === 'rejected' ? 'text-red-300' : 'text-[#FFD700]';

const StaffEventsPage = () => {
  const role = localStorage.getItem('role');
  const [form, setForm] = useState(emptyForm);
  const [mine, setMine] = useState<MyEvent[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get<MyEvent[]>('/api/events/staff/mine');
      setMine(res.data);
    } catch (e: any) {
      setMsg({ type: 'err', text: e.response?.data?.error || 'Could not load your events' });
    }
  }, []);

  useEffect(() => {
    if (role === 'staff') load();
  }, [role, load]);

  if (role !== 'staff') {
    return (
      <div>
        <Header />
        <p className="pt-24 text-center text-white">Only staff can add events.</p>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      await api.post('/api/events/staff', form);
      setMsg({ type: 'ok', text: 'Event submitted for admin approval' });
      setForm(emptyForm);
      load();
    } catch (err: any) {
      setMsg({ type: 'err', text: err.response?.data?.error || 'Could not submit event' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Header />
      <div className="min-h-screen pt-24 px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          <form onSubmit={submit} className="lg:col-span-2 bg-white/10 rounded-xl p-6 space-y-4">
            <h2 className="text-2xl font-bold text-white neon-text">Add an event</h2>
            <p className="text-gray-300 text-sm">New events are reviewed by an admin before students can see them.</p>

            {msg && (
              <div className={`px-4 py-2 rounded-lg text-sm ${
                msg.type === 'ok' ? 'bg-green-500/20 text-green-200' : 'bg-red-500/20 text-red-200'
              }`}>
                {msg.text}
              </div>
            )}

            <input className={inputCls} placeholder="Event title" maxLength={100} required
              value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />

            <textarea className={inputCls} rows={4} maxLength={2000} placeholder="Description"
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select className={inputCls} value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="academic">Academic</option>
                <option value="cultural">Cultural</option>
                <option value="sports">Sports</option>
                <option value="technical">Technical</option>
                <option value="other">Other</option>
              </select>
              <input className={inputCls} placeholder="Venue" maxLength={150}
                value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
              <div>
                <label className="text-xs text-gray-400">Event date</label>
                <input className={inputCls} type="date" min={todayStr()} required
                  value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-gray-400">Start time (optional)</label>
                <input className={inputCls} type="time"
                  value={form.event_time} onChange={(e) => setForm({ ...form, event_time: e.target.value })} />
              </div>
            </div>

            <input className={inputCls} placeholder="Image URL (optional, https://...)" maxLength={255}
              value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />

            <label className="flex items-center gap-2 text-gray-200">
              <input type="checkbox" checked={form.allows_teams}
                onChange={(e) => setForm({ ...form, allows_teams: e.target.checked })} />
              Students can form teams for this event (shows in Team Finder)
            </label>

            <button disabled={saving}
              className="bg-[#FFD700] text-black font-semibold px-6 py-2 rounded-full hover:shadow-[0_0_10px_#FFD700] transition-all disabled:opacity-50">
              {saving ? 'Submitting...' : 'Submit for approval'}
            </button>
          </form>

          <div className="bg-white/10 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white">My events</h3>
            {mine.length === 0 && <p className="text-gray-400 text-sm">You have not added any events yet.</p>}
            {mine.map((ev) => (
              <div key={ev.event_id} className="bg-black/30 rounded-lg p-4">
                <p className="font-semibold text-white">{ev.title}</p>
                <p className="text-xs text-gray-400">
                  {String(ev.event_date).slice(0, 10)} · {ev.registration_count} registered
                </p>
                <p className={`text-sm capitalize ${statusCls(ev.status)}`}>{ev.status}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffEventsPage;