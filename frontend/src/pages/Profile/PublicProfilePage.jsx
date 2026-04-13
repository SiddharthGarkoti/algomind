import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import api from '../../utils/api.js';

function PublicProfilePage({ theme, toggleTheme }) {
  const { username } = useParams();
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const surface = isDark ? '#1b1c1e' : '#FFFFFF';
  const surfLow = isDark ? '#292a2c' : '#F8FAFC';
  const border  = isDark ? 'rgba(70,69,84,0.15)' : 'rgba(0,0,0,0.08)';
  const textPri = isDark ? '#e3e2e5' : '#0F172A';
  const textSec = isDark ? '#908fa0' : '#64748B';

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    api.get(`/auth/profile/${username}/`)
      .then(data => setProfile(data))
      .catch(err => {
        if (err?.detail === 'Not found.' || err?.detail?.includes('404')) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [username]);

  const initials = (profile?.username ?? username ?? '??').slice(0, 2).toUpperCase();

  return (
    <DashboardLayout theme={theme} toggleTheme={toggleTheme}>
      <div className="max-w-xl mx-auto space-y-5">

        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && notFound && (
          <div className="rounded-2xl p-10 text-center" style={{ background: surface, border: `1px solid ${border}` }}>
            <p className="text-4xl mb-4">🔍</p>
            <h2 className="text-lg font-bold mb-2" style={{ color: textPri }}>User not found</h2>
            <p className="text-sm mb-5" style={{ color: textSec }}>No user with the username <strong>{username}</strong> exists.</p>
            <button
              onClick={() => navigate('/friends')}
              className="px-5 py-2 rounded-xl text-sm font-bold text-white"
              style={{ background: '#6366F1' }}>
              Back to Friends
            </button>
          </div>
        )}

        {!loading && profile && (
          <>
            {/* Profile Card */}
            <div className="rounded-2xl p-8 relative overflow-hidden"
              style={{ background: surface, border: `1px solid ${border}` }}>
              <div className="absolute top-0 left-0 right-0 h-28"
                style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(168,85,247,0.1))' }} />

              <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start">
                {/* Avatar */}
                <div className="relative mt-4 shrink-0">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-xl border-2"
                    style={{ borderColor: 'rgba(99,102,241,0.4)' }}>
                    {profile.avatar ? (
                      <img src={profile.avatar} alt="profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl font-extrabold text-white"
                        style={{ background: 'linear-gradient(135deg,#6366F1,#A855F7)' }}>
                        {initials}
                      </div>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-grow pt-4">
                  <h1 className="text-2xl font-headline font-extrabold tracking-tight" style={{ color: textPri }}>
                    {profile.username}
                  </h1>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {profile.is_admin && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(99,102,241,0.12)', color: '#6366F1' }}>Admin</span>
                    )}
                    <span className="text-[10px]" style={{ color: textSec }}>
                      Lv {profile.level ?? 1} · Rating {profile.rating ?? 1000}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Streak', value: `${profile.streak ?? 0}d`, color: '#6366F1' },
                { label: 'Level',  value: profile.level  ?? 1,        color: '#A855F7' },
                { label: 'Rating', value: profile.rating ?? 1000,     color: '#F59E0B' },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-2xl p-5 text-center"
                  style={{ background: surface, border: `1px solid ${border}` }}>
                  <p className="text-2xl font-headline font-extrabold" style={{ color }}>{value}</p>
                  <p className="text-[10px] uppercase tracking-widest mt-1" style={{ color: textSec }}>{label}</p>
                </div>
              ))}
            </div>

            {/* Back */}
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sm font-semibold transition-all hover:opacity-70"
              style={{ color: textSec }}>
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Go back
            </button>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

export default PublicProfilePage;
