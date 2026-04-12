import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../utils/api.js';

const TYPE_COLORS = { update: '#6366F1', tip: '#22C55E', note: '#F59E0B' };
const TYPE_ICONS  = { update: 'campaign', tip: 'lightbulb', note: 'edit_note' };
const FILTERS = [
  { label: 'All',      value: '' },
  { label: 'Updates',  value: 'update' },
  { label: 'Tips',     value: 'tip' },
  { label: 'Dev Notes', value: 'note' },
];

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60)   return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)    return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function CommunityPage({ theme, toggleTheme }) {
  const isDark  = theme === 'dark';
  const { user } = useAuth();

  const [posts,        setPosts]        = useState([]);
  const [filter,       setFilter]       = useState('');
  const [loading,      setLoading]      = useState(true);
  const [likeLoading,  setLikeLoading]  = useState({});

  /* Admin post creation state */
  const isAdmin = user?.is_admin || user?.is_staff;
  const [showCreate,   setShowCreate]   = useState(false);
  const [newPost,      setNewPost]      = useState({ post_type: 'update', title: '', body: '', tags: '' });
  const [creating,     setCreating]     = useState(false);

  const surface  = isDark ? '#1b1c1e' : '#FFFFFF';
  const surfLow  = isDark ? '#292a2c' : '#F8FAFC';
  const border   = isDark ? 'rgba(70,69,84,0.15)' : 'rgba(0,0,0,0.08)';
  const textPri  = isDark ? '#e3e2e5' : '#0F172A';
  const textSec  = isDark ? '#908fa0' : '#64748B';

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const url = filter ? `/community/posts/?type=${filter}` : '/community/posts/';
      const data = await api.get(url);
      setPosts(Array.isArray(data) ? data : (data?.results ?? []));
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleLike = async (postId) => {
    if (likeLoading[postId]) return;
    setLikeLoading(l => ({ ...l, [postId]: true }));
    try {
      const res = await api.post(`/community/posts/${postId}/like/`);
      setPosts(prev => prev.map(p =>
        p.id === postId
          ? { ...p, liked_by_me: res.liked, like_count: res.like_count }
          : p
      ));
    } catch { /* ignore */ }
    finally { setLikeLoading(l => ({ ...l, [postId]: false })); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newPost.title.trim() || !newPost.body.trim()) return;
    setCreating(true);
    try {
      await api.post('/community/posts/create/', newPost);
      setNewPost({ post_type: 'update', title: '', body: '', tags: '' });
      setShowCreate(false);
      fetchPosts();
    } catch (err) {
      alert(err?.detail ?? 'Could not create post.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <DashboardLayout theme={theme} toggleTheme={toggleTheme}>
      <div className="space-y-6 max-w-3xl mx-auto">

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-headline font-extrabold tracking-tight" style={{ color: textPri }}>Community</h1>
            <p className="text-sm mt-1" style={{ color: textSec }}>Updates, notes, and tips from the AlgoMind team</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowCreate(v => !v)}
              className="shrink-0 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all hover:opacity-90"
              style={{ background: '#6366F1', color: '#fff' }}>
              <span className="material-symbols-outlined text-sm">add</span>
              New Post
            </button>
          )}
        </div>

        {/* Admin: Create Post form */}
        {isAdmin && showCreate && (
          <form onSubmit={handleCreate}
            className="rounded-2xl p-6 space-y-4"
            style={{ background: surface, border: `1px solid rgba(99,102,241,0.3)` }}>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#6366F1' }}>New Post</p>
            <div className="flex gap-3">
              {['update', 'tip', 'note'].map(t => (
                <button key={t} type="button"
                  onClick={() => setNewPost(p => ({ ...p, post_type: t }))}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all"
                  style={newPost.post_type === t
                    ? { background: TYPE_COLORS[t], color: '#fff' }
                    : { background: surfLow, color: textSec, border: `1px solid ${border}` }}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            <input
              required
              placeholder="Post title…"
              value={newPost.title}
              onChange={e => setNewPost(p => ({ ...p, title: e.target.value }))}
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
              style={{ background: surfLow, border: `1px solid ${border}`, color: textPri }}
            />
            <textarea
              required
              rows={4}
              placeholder="Post body…"
              value={newPost.body}
              onChange={e => setNewPost(p => ({ ...p, body: e.target.value }))}
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none resize-none"
              style={{ background: surfLow, border: `1px solid ${border}`, color: textPri }}
            />
            <input
              placeholder="Tags (comma-separated, e.g. Feature, Arena)"
              value={newPost.tags}
              onChange={e => setNewPost(p => ({ ...p, tags: e.target.value }))}
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
              style={{ background: surfLow, border: `1px solid ${border}`, color: textPri }}
            />
            <div className="flex gap-3">
              <button type="submit" disabled={creating}
                className="px-6 py-2 rounded-xl text-xs font-bold disabled:opacity-50"
                style={{ background: '#6366F1', color: '#fff' }}>
                {creating ? 'Publishing…' : 'Publish'}
              </button>
              <button type="button" onClick={() => setShowCreate(false)}
                className="px-6 py-2 rounded-xl text-xs font-bold"
                style={{ background: surfLow, color: textSec, border: `1px solid ${border}` }}>
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Filter chips */}
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map(f => (
            <button key={f.value}
              onClick={() => setFilter(f.value)}
              className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all hover:opacity-80"
              style={filter === f.value
                ? { background: '#6366F1', color: '#fff' }
                : { background: surfLow, color: textSec, border: `1px solid ${border}` }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-40 rounded-2xl animate-pulse" style={{ background: surface }} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && posts.length === 0 && (
          <div className="text-center py-16" style={{ color: textSec }}>
            <span className="material-symbols-outlined text-4xl block mb-3">forum</span>
            <p className="text-sm">No posts yet. Check back soon!</p>
          </div>
        )}

        {/* Posts */}
        {!loading && (
          <div className="space-y-4">
            {posts.map(post => {
              const color   = TYPE_COLORS[post.post_type] ?? '#6366F1';
              const icon    = TYPE_ICONS[post.post_type]  ?? 'article';
              const author  = post.author_info;
              const isLiked = post.liked_by_me;
              const authorIsAdmin = author?.is_staff || author?.is_admin;

              return (
                <div key={post.id}
                  className="community-post rounded-2xl p-6 transition-all card-3d"
                  style={{ background: surface, border: `1px solid ${border}`, boxShadow: isDark ? 'none' : '0 4px 16px -4px rgba(0,0,0,0.06)' }}>

                  {/* Author row */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center"
                      style={{ background: `${color}20` }}>
                      <span className="material-symbols-outlined text-base" style={{ color }}>{icon}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold" style={{ color: textPri }}>{author?.username ?? 'AlgoMind Team'}</p>
                        {(authorIsAdmin || author?.is_staff) && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(99,102,241,0.12)', color: '#6366F1' }}>
                            Admin
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: `${color}15`, color }}>
                          {post.post_type.charAt(0).toUpperCase() + post.post_type.slice(1)}
                        </span>
                        <span className="text-[9px]" style={{ color: textSec }}>{timeAgo(post.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div style={{ borderLeft: `3px solid ${color}`, paddingLeft: '16px' }}>
                    <h2 className="font-headline font-bold text-base mb-2" style={{ color: textPri }}>{post.title}</h2>
                    <p className="text-sm leading-relaxed" style={{ color: textSec }}>{post.body}</p>
                  </div>

                  {/* Tags + Actions */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex gap-2 flex-wrap">
                      {(post.tag_list ?? []).map(tag => (
                        <span key={tag} className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: surfLow, color: textSec }}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <button
                      disabled={likeLoading[post.id]}
                      className="flex items-center gap-1.5 text-[11px] font-bold transition-all hover:scale-110 disabled:opacity-50"
                      style={{ color: isLiked ? '#EF4444' : textSec }}
                      onClick={() => handleLike(post.id)}>
                      <span className="material-symbols-outlined text-base"
                        style={{ fontVariationSettings: isLiked ? "'FILL' 1" : "'FILL' 0" }}>
                        favorite
                      </span>
                      {post.like_count}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default CommunityPage;
