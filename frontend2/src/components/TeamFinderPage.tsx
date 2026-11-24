import React, { useCallback, useEffect, useState } from 'react';
import api from '../api';
import Header from './Header';

// ---------- types ----------
type Skill = { skill_id: number; skill_name: string; category?: string };
type MySkill = Skill & { level: number };
type SkillRef = { skill_id: number; skill_name: string };

type TeamEvent = {
  event_id: number; title: string; event_date: string; category: string; is_registered: number;
};

type OpenPost = {
  team_post_id: number; event_id: number; title: string; event_name: string; event_type: string;
  description: string; team_size: number; member_count: number; deadline: string; creator_name: string;
  is_member: boolean; my_request_status: string | null; my_request_kind: string | null;
  match_pct: number; matched_skills: string[]; missing_skills: string[]; required_skills: SkillRef[];
};
type MyPost = {
  team_post_id: number; title: string; event_name: string; event_type: string; team_size: number;
  member_count: number; pending_count: number; deadline: string; status: string;
  required_skills: SkillRef[]; members: { id: number; fullname: string; course: string }[];
};
type Match = {
  id: number; fullname: string; reg_no: string; course: string; enrolledyear: number;
  score: number; skill_match_pct: number; matched_skills: string[]; missing_skills: string[]; reasons: string[];
};
type InviteItem = {
  request_id: number; message: string; title: string; event_name: string; other_name: string; other_course: string;
};
type ApplicationItem = {
  request_id: number; message: string; title: string; other_name: string; other_reg_no: string;
  other_course: string; skills: string | null;
};
type SentItem = { request_id: number; kind: 'invite' | 'apply'; status: string; title: string; other_name: string };
type Inbox = { invites: InviteItem[]; applications: ApplicationItem[]; sent: SentItem[] };

type Notify = (type: 'ok' | 'err', text: string) => void;
type Tab = 'find' | 'recruit' | 'inbox' | 'skills';

// ---------- small helpers ----------
const inputCls =
  'w-full bg-white/10 text-white placeholder-gray-400 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD700]';
const btnGold =
  'bg-[#FFD700] text-black font-semibold px-4 py-2 rounded-full hover:shadow-[0_0_10px_#FFD700] transition-all disabled:opacity-50';
const btnGhost = 'border border-white/30 text-white px-4 py-2 rounded-full hover:bg-white/10 transition';
const errMsg = (e: any, fallback: string): string => e?.response?.data?.error || fallback;
const fmtDate = (d: string) => String(d).slice(0, 10);
const todayStr = () => {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
};
const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

const Chip = ({ text, tone = 'plain' }: { text: string; tone?: 'match' | 'miss' | 'plain' }) => {
  const cls =
    tone === 'match' ? 'bg-green-500/20 text-green-300 border-green-500/40'
    : tone === 'miss' ? 'bg-red-500/10 text-red-300 border-red-500/30'
    : 'bg-white/10 text-gray-200 border-white/20';
  return <span className={`text-xs px-2 py-1 rounded-full border ${cls}`}>{text}</span>;
};

const MatchBar = ({ pct }: { pct: number }) => (
  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
    <div className="h-full bg-[#FFD700]" style={{ width: `${Math.min(pct, 100)}%` }} />
  </div>
);

const SkillPicker = ({
  skills, selected, onToggle,
}: { skills: Skill[]; selected: number[]; onToggle: (id: number) => void }) => (
  <div className="flex flex-wrap gap-2">
    {skills.map((s) => {
      const on = selected.includes(s.skill_id);
      return (
        <button
          type="button"
          key={s.skill_id}
          onClick={() => onToggle(s.skill_id)}
          className={`text-sm px-3 py-1 rounded-full border transition ${
            on ? 'bg-[#FFD700] text-black border-[#FFD700]' : 'text-gray-200 border-white/30 hover:bg-white/10'
          }`}
        >
          {s.skill_name}
        </button>
      );
    })}
  </div>
);

// ---------- My Skills ----------
const SkillsTab = ({
  allSkills, reloadSkills, notify,
}: { allSkills: Skill[]; reloadSkills: () => Promise<void>; notify: Notify }) => {
  const [levels, setLevels] = useState<Record<number, number>>({});
  const [custom, setCustom] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/api/team/skills/me')
      .then((res) => {
        const map: Record<number, number> = {};
        (res.data as MySkill[]).forEach((s) => { map[s.skill_id] = s.level; });
        setLevels(map);
      })
      .catch((e) => notify('err', errMsg(e, 'Could not load your skills')));
  }, [notify]);

  const selectedIds = Object.keys(levels).map(Number);

  const toggle = (id: number) =>
    setLevels((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id]; else next[id] = 2;
      return next;
    });

  const addCustom = async () => {
    if (!custom.trim()) return;
    try {
      const res = await api.post('/api/team/skills', { skill_name: custom.trim() });
      await reloadSkills();
      setLevels((prev) => ({ ...prev, [res.data.skill_id]: 2 }));
      setCustom('');
    } catch (e) {
      notify('err', errMsg(e, 'Could not add skill'));
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.put('/api/team/skills/me', {
        skills: selectedIds.map((id) => ({ skill_id: id, level: levels[id] })),
      });
      notify('ok', 'Skills saved');
    } catch (e) {
      notify('err', errMsg(e, 'Could not save skills'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-gray-300">Pick the skills you have. Teams are matched to you based on these.</p>
      <SkillPicker skills={allSkills} selected={selectedIds} onToggle={toggle} />

      <div className="flex gap-2 max-w-md">
        <input className={inputCls} placeholder="Skill not listed? Add it" value={custom}
          onChange={(e) => setCustom(e.target.value)} />
        <button className={btnGhost} onClick={addCustom}>Add</button>
      </div>

      {selectedIds.length > 0 && (
        <div className="bg-white/10 rounded-xl p-4 space-y-3 max-w-xl">
          <h3 className="text-white font-semibold">Your proficiency</h3>
          {selectedIds.map((id) => {
            const skill = allSkills.find((s) => s.skill_id === id);
            return (
              <div key={id} className="flex items-center justify-between gap-3">
                <span className="text-gray-100">{skill?.skill_name ?? id}</span>
                <select
                  className="bg-black/40 text-white rounded-lg px-2 py-1"
                  value={levels[id]}
                  onChange={(e) => setLevels((prev) => ({ ...prev, [id]: Number(e.target.value) }))}
                >
                  {LEVELS.map((l, i) => <option key={l} value={i + 1}>{l}</option>)}
                </select>
              </div>
            );
          })}
        </div>
      )}
      <button className={btnGold} disabled={saving} onClick={save}>{saving ? 'Saving...' : 'Save skills'}</button>
    </div>
  );
};

// ---------- Find Teams ----------
const FindTab = ({ events, notify }: { events: TeamEvent[]; notify: Notify }) => {
  const [posts, setPosts] = useState<OpenPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [applyingId, setApplyingId] = useState<number | null>(null);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/team/posts', {
        params: eventFilter === 'all' ? {} : { event_id: eventFilter },
      });
      setPosts(res.data);
    } catch (e) {
      notify('err', errMsg(e, 'Could not load teams'));
    } finally {
      setLoading(false);
    }
  }, [eventFilter, notify]);

  useEffect(() => { load(); }, [load]);

  const apply = async (id: number) => {
    try {
      await api.post(`/api/team/posts/${id}/apply`, { message });
      notify('ok', 'Application sent');
      setApplyingId(null);
      setMessage('');
      load();
    } catch (e) {
      notify('err', errMsg(e, 'Could not apply'));
    }
  };

  const status = (p: OpenPost) => {
    if (p.is_member) return <span className="text-green-300">You are in this team</span>;
    if (p.my_request_status === 'pending') {
      return (
        <span className="text-[#FFD700]">
          {p.my_request_kind === 'invite' ? 'Invited: check your Inbox' : 'Application pending'}
        </span>
      );
    }
    if (p.my_request_status === 'declined') return <span className="text-gray-400">Declined</span>;
    return null;
  };

  const eventFilterBar = (
    <div className="lg:col-span-2 flex flex-wrap items-center gap-3">
      <label className="text-sm text-gray-300">Event</label>
      <select className="bg-black/40 text-white rounded-lg px-3 py-2" value={eventFilter}
        onChange={(e) => setEventFilter(e.target.value)}>
        <option value="all">All events</option>
        {events.map((ev) => (
          <option key={ev.event_id} value={ev.event_id}>{ev.title}</option>
        ))}
      </select>
      <p className="text-gray-400 text-sm">Sorted by how well your skills fit.</p>
    </div>
  );

  if (loading) return <p className="text-gray-300">Loading teams...</p>;

  if (posts.length === 0) {
    return (
      <div className="space-y-6">
        {eventFilterBar}
        <p className="text-gray-300">No open teams for this selection. Create one in the Recruit tab.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {eventFilterBar}
      {posts.map((p) => (
        <div key={p.team_post_id} className="bg-white/10 text-white rounded-xl p-5 space-y-3">
          <div className="flex justify-between items-start gap-3">
            <div>
              <h3 className="text-lg font-semibold">{p.title}</h3>
              <p className="text-sm text-[#FFD700]">
                {p.event_name} · <span className="capitalize">{p.event_type}</span>
              </p>
              <p className="text-xs text-gray-400">
                By {p.creator_name} · apply by {fmtDate(p.deadline)} · {p.member_count}/{p.team_size} members
              </p>
            </div>
            <div className="text-right min-w-[64px]">
              <div className="text-2xl font-bold text-[#FFD700]">{p.match_pct}%</div>
              <div className="text-xs text-gray-400">match</div>
            </div>
          </div>
          <MatchBar pct={p.match_pct} />
          {p.description && <p className="text-sm text-gray-300">{p.description}</p>}
          <div className="flex flex-wrap gap-2">
            {p.matched_skills.map((s) => <Chip key={`m-${s}`} text={s} tone="match" />)}
            {p.missing_skills.map((s) => <Chip key={`x-${s}`} text={s} tone="miss" />)}
          </div>

          {applyingId === p.team_post_id ? (
            <div className="space-y-2">
              <textarea className={inputCls} rows={2} maxLength={500}
                placeholder="Tell them why you're a good fit..."
                value={message} onChange={(e) => setMessage(e.target.value)} />
              <div className="flex gap-2">
                <button className={btnGold} onClick={() => apply(p.team_post_id)}>Send application</button>
                <button className={btnGhost} onClick={() => setApplyingId(null)}>Cancel</button>
              </div>
            </div>
          ) : status(p) ?? (
            <button className={btnGold} onClick={() => { setApplyingId(p.team_post_id); setMessage(''); }}>
              Apply to join
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

// ---------- Recruit ----------
const emptyForm = {
  title: '', event_id: '', event_type: 'hackathon', description: '', team_size: 4, deadline: '',
};

const RecruitTab = ({
  allSkills, events, notify,
}: { allSkills: Skill[]; events: TeamEvent[]; notify: Notify }) => {
  const [form, setForm] = useState(emptyForm);
  const [skillIds, setSkillIds] = useState<number[]>([]);
  const [mine, setMine] = useState<MyPost[]>([]);
  const [matches, setMatches] = useState<Record<number, Match[]>>({});
  const [inviting, setInviting] = useState<{ postId: number; user: Match } | null>(null);
  const [inviteMsg, setInviteMsg] = useState('');
  const [creating, setCreating] = useState(false);

  const registeredEvents = events.filter((ev) => !!ev.is_registered);

  const loadMine = useCallback(async () => {
    try {
      const res = await api.get('/api/team/posts/mine');
      setMine(res.data);
    } catch (e) {
      notify('err', errMsg(e, 'Could not load your teams'));
    }
  }, [notify]);

  useEffect(() => { loadMine(); }, [loadMine]);

  const toggleSkill = (id: number) =>
    setSkillIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/api/team/posts', {
        ...form,
        event_id: Number(form.event_id),
        skill_ids: skillIds,
      });
      notify('ok', 'Team post created');
      setForm(emptyForm);
      setSkillIds([]);
      loadMine();
    } catch (err) {
      notify('err', errMsg(err, 'Could not create team post'));
    } finally {
      setCreating(false);
    }
  };

  const findMatches = async (postId: number) => {
    try {
      const res = await api.get(`/api/team/posts/${postId}/matches`);
      setMatches((prev) => ({ ...prev, [postId]: res.data }));
    } catch (err) {
      notify('err', errMsg(err, 'Could not load matches'));
    }
  };

  const startInvite = (post: MyPost, user: Match) => {
    setInviting({ postId: post.team_post_id, user });
    setInviteMsg(
      `Hi ${user.fullname.split(' ')[0]}, I'm putting together a team for ${post.event_name} and your skills in ` +
      `${user.matched_skills.join(', ')} would be a great fit. Want to join us?`
    );
  };

  const sendInvite = async () => {
    if (!inviting) return;
    const { postId, user } = inviting;
    try {
      await api.post(`/api/team/posts/${postId}/invite`, { user_id: user.id, message: inviteMsg });
      notify('ok', `Invite sent to ${user.fullname}`);
      setMatches((prev) => ({ ...prev, [postId]: (prev[postId] || []).filter((m) => m.id !== user.id) }));
      setInviting(null);
      loadMine();
    } catch (err) {
      notify('err', errMsg(err, 'Could not send invite'));
    }
  };

  const closePost = async (postId: number) => {
    try {
      await api.post(`/api/team/posts/${postId}/close`);
      notify('ok', 'Team closed');
      loadMine();
    } catch (err) {
      notify('err', errMsg(err, 'Could not close team'));
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
      {/* Create form */}
      <form onSubmit={create} className="bg-white/10 rounded-xl p-5 space-y-4 xl:col-span-1 h-fit">
        <h3 className="text-white text-lg font-semibold">Recruit a team</h3>

        <div>
          <label className="text-xs text-gray-400">Event (only events you are registered for)</label>
          <select className={inputCls} value={form.event_id}
            onChange={(e) => setForm({ ...form, event_id: e.target.value })} required>
            <option value="">Select an event</option>
            {registeredEvents.map((ev) => (
              <option key={ev.event_id} value={ev.event_id}>
                {ev.title} ({fmtDate(ev.event_date)})
              </option>
            ))}
          </select>
          {registeredEvents.length === 0 && (
            <p className="text-xs text-gray-400 mt-1">
              Register for an event that allows teams on the Events page first.
            </p>
          )}
        </div>

        <input className={inputCls} placeholder="Post title (e.g. Need 2 devs for SIH)" maxLength={100}
          value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <div className="grid grid-cols-2 gap-3">
          <select className={inputCls} value={form.event_type}
            onChange={(e) => setForm({ ...form, event_type: e.target.value })}>
            <option value="hackathon">Hackathon</option>
            <option value="competition">Competition</option>
            <option value="project">Project</option>
          </select>
          <input className={inputCls} type="number" min={2} max={10} value={form.team_size}
            onChange={(e) => setForm({ ...form, team_size: Number(e.target.value) })} />
        </div>
        <div>
          <label className="text-xs text-gray-400">Recruit until</label>
          <input className={inputCls} type="date" min={todayStr()} value={form.deadline}
            onChange={(e) => setForm({ ...form, deadline: e.target.value })} required />
        </div>
        <textarea className={inputCls} rows={3} maxLength={1000} placeholder="What are you building? What will each person do?"
          value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div className="space-y-2">
          <p className="text-sm text-gray-300">Required skills</p>
          <SkillPicker skills={allSkills} selected={skillIds} onToggle={toggleSkill} />
        </div>
        <button className={btnGold} disabled={creating || skillIds.length === 0 || !form.event_id}>
          {creating ? 'Creating...' : 'Create team post'}
        </button>
      </form>

      {/* My posts + matches */}
      <div className="xl:col-span-2 space-y-6">
        <h3 className="text-white text-lg font-semibold">My team posts</h3>
        {mine.length === 0 && <p className="text-gray-300">You haven't created any team posts yet.</p>}

        {mine.map((p) => (
          <div key={p.team_post_id} className="bg-white/10 text-white rounded-xl p-5 space-y-3">
            <div className="flex justify-between items-start gap-3">
              <div>
                <h4 className="text-lg font-semibold">{p.title}</h4>
                <p className="text-sm text-[#FFD700] capitalize">{p.event_type}: {p.event_name}</p>
                <p className="text-xs text-gray-400">
                  {p.member_count}/{p.team_size} members · until {fmtDate(p.deadline)} ·{' '}
                  <span className={p.status === 'open' ? 'text-green-300' : 'text-gray-400'}>{p.status}</span>
                  {p.pending_count > 0 && ` · ${p.pending_count} pending`}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {p.required_skills.map((s) => <Chip key={s.skill_id} text={s.skill_name} />)}
            </div>
            <p className="text-sm text-gray-300">
              Team: {p.members.map((m) => m.fullname).join(', ')}
            </p>

            {p.status === 'open' && (
              <div className="flex gap-2">
                <button className={btnGold} onClick={() => findMatches(p.team_post_id)}>Find matches</button>
                <button className={btnGhost} onClick={() => closePost(p.team_post_id)}>Close team</button>
              </div>
            )}

            {matches[p.team_post_id] && (
              <div className="space-y-3 pt-2">
                {matches[p.team_post_id].length === 0 && (
                  <p className="text-gray-400 text-sm">
                    No matching students found yet. Students need to add skills and register for this event first.
                  </p>
                )}
                {matches[p.team_post_id].map((m) => (
                  <div key={m.id} className="bg-black/30 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{m.fullname}</p>
                        <p className="text-xs text-gray-400">{m.reg_no} · {m.course} · {m.enrolledyear}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-[#FFD700]">{m.score}</div>
                        <div className="text-xs text-gray-400">score</div>
                      </div>
                    </div>
                    <MatchBar pct={m.score} />
                    <div className="flex flex-wrap gap-2">
                      {m.matched_skills.map((s) => <Chip key={`m-${s}`} text={s} tone="match" />)}
                      {m.missing_skills.map((s) => <Chip key={`x-${s}`} text={s} tone="miss" />)}
                    </div>
                    <p className="text-xs text-gray-400">Why: {m.reasons.join(' · ')}</p>

                    {inviting && inviting.postId === p.team_post_id && inviting.user.id === m.id ? (
                      <div className="space-y-2">
                        <textarea className={inputCls} rows={3} maxLength={500} value={inviteMsg}
                          onChange={(e) => setInviteMsg(e.target.value)} />
                        <div className="flex gap-2">
                          <button className={btnGold} onClick={sendInvite}>Send invite</button>
                          <button className={btnGhost} onClick={() => setInviting(null)}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button className={btnGold} onClick={() => startInvite(p, m)}>Message & invite</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ---------- Inbox ----------
const InboxTab = ({ notify }: { notify: Notify }) => {
  const [inbox, setInbox] = useState<Inbox>({ invites: [], applications: [], sent: [] });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/api/team/requests');
      setInbox(res.data);
    } catch (e) {
      notify('err', errMsg(e, 'Could not load your inbox'));
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => { load(); }, [load]);

  const act = async (id: number, action: 'accept' | 'decline') => {
    try {
      await api.post(`/api/team/requests/${id}/${action}`);
      notify('ok', action === 'accept' ? 'Accepted. They are now on the team.' : 'Declined');
      load();
    } catch (e) {
      notify('err', errMsg(e, `Could not ${action}`));
      load();
    }
  };

  if (loading) return <p className="text-gray-300">Loading...</p>;

  const statusColor = (s: string) =>
    s === 'accepted' ? 'text-green-300' : s === 'declined' ? 'text-red-300' : 'text-[#FFD700]';

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h3 className="text-white text-lg font-semibold">Invites for you</h3>
        {inbox.invites.length === 0 && <p className="text-gray-400 text-sm">No pending invites.</p>}
        {inbox.invites.map((i) => (
          <div key={i.request_id} className="bg-white/10 text-white rounded-xl p-4 space-y-2">
            <p className="font-semibold">{i.other_name} invited you to <span className="text-[#FFD700]">{i.title}</span></p>
            <p className="text-xs text-gray-400">{i.event_name} · {i.other_course}</p>
            {i.message && <p className="text-sm text-gray-200 bg-black/30 rounded-lg p-3">{i.message}</p>}
            <div className="flex gap-2">
              <button className={btnGold} onClick={() => act(i.request_id, 'accept')}>Accept</button>
              <button className={btnGhost} onClick={() => act(i.request_id, 'decline')}>Decline</button>
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h3 className="text-white text-lg font-semibold">Applications to your teams</h3>
        {inbox.applications.length === 0 && <p className="text-gray-400 text-sm">No pending applications.</p>}
        {inbox.applications.map((a) => (
          <div key={a.request_id} className="bg-white/10 text-white rounded-xl p-4 space-y-2">
            <p className="font-semibold">{a.other_name} applied to <span className="text-[#FFD700]">{a.title}</span></p>
            <p className="text-xs text-gray-400">{a.other_reg_no} · {a.other_course}</p>
            {a.skills && <p className="text-sm text-gray-300">Skills: {a.skills}</p>}
            {a.message && <p className="text-sm text-gray-200 bg-black/30 rounded-lg p-3">{a.message}</p>}
            <div className="flex gap-2">
              <button className={btnGold} onClick={() => act(a.request_id, 'accept')}>Accept</button>
              <button className={btnGhost} onClick={() => act(a.request_id, 'decline')}>Decline</button>
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h3 className="text-white text-lg font-semibold">Sent</h3>
        {inbox.sent.length === 0 && <p className="text-gray-400 text-sm">Nothing sent yet.</p>}
        {inbox.sent.map((s) => (
          <div key={s.request_id} className="bg-white/5 text-white rounded-lg px-4 py-3 flex justify-between text-sm">
            <span>
              {s.kind === 'invite' ? `Invite to ${s.other_name}` : `Application to ${s.other_name}`} · {s.title}
            </span>
            <span className={`capitalize ${statusColor(s.status)}`}>{s.status}</span>
          </div>
        ))}
      </section>
    </div>
  );
};

// ---------- Page ----------
const TABS: { key: Tab; label: string }[] = [
  { key: 'find', label: 'Find Teams' },
  { key: 'recruit', label: 'Recruit' },
  { key: 'inbox', label: 'Inbox' },
  { key: 'skills', label: 'My Skills' },
];

const TeamFinderPage = () => {
  const [tab, setTab] = useState<Tab>('find');
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [events, setEvents] = useState<TeamEvent[]>([]);
  const [notice, setNotice] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const notify = useCallback<Notify>((type, text) => {
    setNotice({ type, text });
    window.setTimeout(() => setNotice(null), 4000);
  }, []);

  const loadSkills = useCallback(async () => {
    try {
      const res = await api.get('/api/team/skills');
      setAllSkills(res.data);
    } catch (e) {
      notify('err', errMsg(e, 'Could not load skills'));
    }
  }, [notify]);

  const loadEvents = useCallback(async () => {
    try {
      const res = await api.get('/api/team/events');
      setEvents(res.data);
    } catch (e) {
      notify('err', errMsg(e, 'Could not load events'));
    }
  }, [notify]);

  useEffect(() => {
    loadSkills();
    loadEvents();
  }, [loadSkills, loadEvents]);

  return (
    <div className="pt-24">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <h1 className="text-3xl font-bold text-white neon-text">Team Finder</h1>
        <p className="text-gray-300 mt-2 mb-6">
          Find teammates for the team-friendly events you are registered for.
        </p>

        {notice && (
          <div className={`mb-4 px-4 py-2 rounded-lg text-sm ${
            notice.type === 'ok' ? 'bg-green-500/20 text-green-200' : 'bg-red-500/20 text-red-200'
          }`}>
            {notice.text}
          </div>
        )}

        <div className="flex flex-wrap gap-3 mb-8">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-full transition ${
                tab === t.key ? 'bg-[#FFD700] text-black font-semibold' : 'border border-white/30 text-white hover:bg-white/10'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'find' && <FindTab events={events} notify={notify} />}
        {tab === 'recruit' && <RecruitTab allSkills={allSkills} events={events} notify={notify} />}
        {tab === 'inbox' && <InboxTab notify={notify} />}
        {tab === 'skills' && <SkillsTab allSkills={allSkills} reloadSkills={loadSkills} notify={notify} />}
      </div>
    </div>
  );
};

export default TeamFinderPage;