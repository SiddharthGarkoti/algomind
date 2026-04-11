import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';

const BADGES = [
  { icon: '🔥', label: '14-Day Streak', earned: true  },
  { icon: '⚡', label: 'Speed Solver',  earned: true  },
  { icon: '🧠', label: 'DP Master',     earned: false },
  { icon: '🌐', label: 'Graph Explorer',earned: false },
  { icon: '🏆', label: 'Top 100',       earned: false },
  { icon: '💎', label: 'Diamond Coder', earned: false },
];

function ProfilePage({ theme, toggleTheme }) {
  const isDark   = theme === 'dark';
  const navigate = useNavigate();
  const fileRef  = useRef(null);

  const [editing,  setEditing]  = useState(false);
  const [name,     setName]     = useState('Alex Chen');
  const [bio,      setBio]      = useState('Competitive programmer & placement aspirant. Grinding DSA daily.');
  const [avatar,   setAvatar]   = useState(null);   // null = show initials
  const [uploading,setUploading]= useState(false);

  const surface  = isDark ? '#1b1c1e' : '#FFFFFF';
  const surfLow  = isDark ? '#292a2c' : '#F8FAFC';
  const border   = isDark ? 'rgba(70,69,84,0.15)' : 'rgba(0,0,0,0.08)';
  const textPri  = isDark ? '#e3e2e5' : '#0F172A';
  const textSec  = isDark ? '#908fa0' : '#64748B';

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatar(ev.target.result);
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <DashboardLayout theme={theme} toggleTheme={toggleTheme}>
      <div className="space-y-6 max-w-3xl mx-auto">

        {/* Profile Card */}
        <div className="rounded-2xl p-8 relative overflow-hidden"
          style={{ background: surface, border: `1px solid ${border}` }}>
          {/* Banner stripe */}
          <div className="absolute top-0 left-0 right-0 h-28"
            style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(168,85,247,0.1))' }} />

          <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start">
            {/* Avatar with upload */}
            <div className="relative mt-4 shrink-0 group">
              <div
                className="w-20 h-20 rounded-2xl overflow-hidden shadow-xl cursor-pointer border-2"
                style={{ borderColor: 'rgba(99,102,241,0.4)' }}
                onClick={() => fileRef.current?.click()}
              >
                {avatar ? (
                  <img src={avatar} alt="profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-extrabold text-white"
                    style={{ background: 'linear-gradient(135deg,#6366F1,#A855F7)' }}>
                    {name.split(' ').map(p => p[0]).join('').slice(0,2)}
                  </div>
                )}
                {/* Overlay hover */}
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                  {uploading
                    ? <span className="material-symbols-outlined text-white text-2xl spinner">progress_activity</span>
                    : <span className="material-symbols-outlined text-white text-2xl">photo_camera</span>
                  }
                </div>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              {/* Change text */}
              <button
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                style={{ background: '#6366F1', color: '#fff' }}
                onClick={() => fileRef.current?.click()}
              >
                Change
              </button>
            </div>

            {/* Info */}
            <div className="flex-grow pt-4">
              {editing ? (
                <div className="space-y-3">
                  <input value={name} onChange={e => setName(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl text-lg font-bold outline-none"
                    style={{ background: surfLow, border: `1px solid ${border}`, color: textPri }} />
                  <textarea value={bio} onChange={e => setBio(e.target.value)} rows={2}
                    className="w-full px-4 py-2 rounded-xl text-sm outline-none resize-none"
                    style={{ background: surfLow, border: `1px solid ${border}`, color: textSec }} />
                  <button onClick={() => setEditing(false)}
                    className="px-5 py-2 rounded-xl text-sm font-bold text-white"
                    style={{ background: '#6366F1' }}>
                    Save
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <h1 className="text-2xl font-headline font-extrabold tracking-tight" style={{ color: textPri }}>{name}</h1>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {/* Basic plan badge (not Pro) */}
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(34,197,94,0.12)', color: '#22C55E' }}>
                          Basic
                        </span>
                        {/* Upgrade CTA */}
                        <button
                          className="text-[10px] font-bold flex items-center gap-1 px-2 py-0.5 rounded-full transition-all hover:opacity-80"
                          style={{ background: 'linear-gradient(135deg,rgba(245,158,11,0.12),rgba(239,68,68,0.08))', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.25)' }}
                          onClick={() => navigate('/plans')}>
                          ⚡ Upgrade Plan
                        </button>
                        <span className="text-[10px]" style={{ color: textSec }}>Rank #4 · Intermediate</span>
                      </div>
                    </div>
                    <button onClick={() => setEditing(true)}
                      className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all hover:opacity-80"
                      style={{ background: surfLow, color: textSec, border: `1px solid ${border}` }}>
                      <span className="material-symbols-outlined text-sm">edit</span> Edit
                    </button>
                  </div>
                  <p className="text-sm mt-2 leading-relaxed" style={{ color: textSec }}>{bio}</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Problems Solved', value: '412', color: '#6366F1' },
            { label: 'Current Streak',  value: '14d',  color: '#A855F7' },
            { label: 'Global Rank',     value: '#204', color: '#F59E0B' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-2xl p-5 text-center card-3d"
              style={{ background: surface, border: `1px solid ${border}` }}>
              <p className="text-2xl font-headline font-extrabold" style={{ color }}>{value}</p>
              <p className="text-[10px] uppercase tracking-widest mt-1" style={{ color: textSec }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Badges */}
        <div className="rounded-2xl p-6" style={{ background: surface, border: `1px solid ${border}` }}>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: textSec }}>Achievements</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {BADGES.map(({ icon, label, earned }) => (
              <div key={label}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl text-center ${earned ? 'badge-pop' : 'opacity-25 grayscale'}`}
                style={{ background: surfLow }}>
                <span className="text-3xl">{icon}</span>
                <span className="text-[9px] font-semibold leading-tight" style={{ color: textSec }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Platform Links */}
        <div className="rounded-2xl p-6" style={{ background: surface, border: `1px solid ${border}` }}>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: textSec }}>Platforms</h2>
          <div className="space-y-3">
            {[
              { name: 'LeetCode',   handle: 'alex_chen_lc',  url: 'https://leetcode.com',   color: '#FFA116' },
              { name: 'Codeforces', handle: 'alex.chen.cf',  url: 'https://codeforces.com', color: '#1F8ACB' },
            ].map(({ name, handle, url, color }) => (
              <a key={name} href={url} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-between p-4 rounded-xl transition-all hover:scale-[1.005]"
                style={{ background: surfLow, border: `1px solid ${border}` }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: `${color}18` }}>
                    <span className="material-symbols-outlined text-base" style={{ color }}>link</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: textPri }}>{name}</p>
                    <p className="text-[10px]" style={{ color }}>{handle}</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-base" style={{ color: textSec }}>open_in_new</span>
              </a>
            ))}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}

export default ProfilePage;
