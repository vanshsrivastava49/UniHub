// src/EventsPage.tsx
import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users } from 'lucide-react';
import Header from './Header';
import api from '../api';

type EventItem = {
  event_id: number;
  title: string;
  description: string | null;
  category: string;
  venue: string | null;
  event_date: string;
  event_time: string | null;
  image_url: string | null;
  allows_teams: number;
  registration_count: number;
  is_registered: number;
};

const CATEGORIES = ['all', 'academic', 'cultural', 'sports', 'technical', 'other'];

const formatDate = (d: string) =>
  new Date(`${String(d).slice(0, 10)}T00:00:00`).toLocaleDateString(undefined, { dateStyle: 'long' });

const EventsPage: React.FC = () => {
  const role = localStorage.getItem('role') || 'student';
  const [events, setEvents] = useState<EventItem[]>([]);
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get<EventItem[]>('/api/events');
      setEvents(res.data);
    } catch (e: any) {
      alert(e.response?.data?.error || 'Could not load events');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleRegistration = async (ev: EventItem) => {
    setBusyId(ev.event_id);
    try {
      if (ev.is_registered) {
        await api.delete(`/api/events/${ev.event_id}/register`);
      } else {
        await api.post(`/api/events/${ev.event_id}/register`);
      }
      await load();
    } catch (e: any) {
      alert(e.response?.data?.error || 'Could not update registration');
    } finally {
      setBusyId(null);
    }
  };

  const visible = category === 'all' ? events : events.filter((e) => e.category === category);

  return (
    <div>
      <Header />
      <div className="min-h-screen pt-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto py-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white neon-text">Campus Events</h2>
            <p className="text-gray-300 mt-2">Upcoming events approved for your college</p>
          </div>

          <div className="mb-8 flex flex-wrap gap-3">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-4 py-2 rounded-full transition ${
                  category === c
                    ? 'bg-white/20 text-white font-semibold'
                    : 'border border-white/30 text-white hover:bg-white/10'
                }`}
              >
                {c === 'all' ? 'All Events' : c[0].toUpperCase() + c.slice(1)}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="text-gray-300">Loading events...</p>
          ) : visible.length === 0 ? (
            <p className="text-gray-300">No upcoming events in this category yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visible.map((ev) => (
                <div key={ev.event_id} className="bg-black/30 backdrop-blur-md rounded-lg overflow-hidden hover:shadow-[0_0_15px_rgba(255,215,0,0.3)] transition-all">
                  {ev.image_url && <img src={ev.image_url} alt={ev.title} className="w-full h-48 object-cover" />}
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-white mb-2">{ev.title}</h3>
                    <div className="flex items-center text-[#FFD700] mb-2">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>
                        {formatDate(ev.event_date)}
                        {ev.event_time && ` · ${ev.event_time.slice(0, 5)}`}
                      </span>
                    </div>
                    {ev.venue && (
                      <div className="flex items-center text-gray-300 mb-2">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span>{ev.venue}</span>
                      </div>
                    )}
                    <div className="flex items-center text-gray-400 mb-3 text-sm">
                      <Users className="w-4 h-4 mr-2" />
                      <span>{ev.registration_count} registered</span>
                    </div>
                    {ev.description && <p className="text-gray-300">{ev.description}</p>}

                    {role === 'student' ? (
                      <div className="mt-4 space-y-2">
                        <button
                          disabled={busyId === ev.event_id}
                          onClick={() => toggleRegistration(ev)}
                          className={`w-full py-2 rounded-full transition-all border ${
                            ev.is_registered
                              ? 'border-gray-400 text-gray-300 hover:bg-white/10'
                              : 'border-[#FFD700] text-[#FFD700] hover:shadow-[0_0_15px_#FFD700]'
                          }`}
                        >
                          {ev.is_registered ? 'Cancel registration' : 'Register Now'}
                        </button>
                        {ev.is_registered && !!ev.allows_teams && (
                          <Link
                            to="/team-finder"
                            className="block w-full text-center py-2 rounded-full bg-[#FFD700] text-black font-semibold"
                          >
                            Find teammates
                          </Link>
                        )}
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-gray-400">Students can register for this event.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventsPage;