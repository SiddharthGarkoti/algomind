import { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';

const POSTS = [
  {
    id: 1, type: 'update', author: 'AlgoMind Team', role: 'Admin',
    time: '2 hours ago', title: 'New Feature: Arena Mode is Live! 🎉',
    body: 'We\'ve launched the Arena — free-roam problem solving with built-in C++ IDE. Explore topics freely, solve on LeetCode or Codeforces, or use our custom editor. Give it a try!',
    likes: 128, tags: ['Feature', 'Arena'],
  },
  {
    id: 2, type: 'tip', author: 'DSA Mentor Bot', role: 'AI',
    time: '5 hours ago', title: 'Pro Tip: Master Sliding Window in 3 Problems',
    body: 'Sliding window problems have exactly 3 patterns: fixed size, variable expand-shrink, and two-pointer variant. Once you recognize which pattern to use, 80% of the problem is solved.',
    likes: 94, tags: ['Tip', 'Technique'],
  },
  {
    id: 3, type: 'note', author: 'Siddharth (Dev)', role: 'Developer',
    time: '1 day ago', title: 'Development Note: AI Mentor Integration',
    body: 'We\'re actively working on integrating a real AI coach that will analyze your actual submissions and give personalized feedback. Backend is in progress — expect it in the next major update!',
    likes: 67, tags: ['Dev Update', 'AI'],
  },
  {
    id: 4, type: 'update', author: 'AlgoMind Team', role: 'Admin',
    time: '3 days ago', title: 'Weekly Challenge: Graph Week 🗺️',
    body: 'This week\'s theme is Graphs! Complete 5 graph problems to earn the "Graph Explorer" badge. Problems range from BFS basics to advanced shortest path algorithms.',
    likes: 201, tags: ['Challenge', 'Weekly'],
  },
];

const TYPE_COLORS = { update: '#6366F1', tip: '#22C55E', note: '#F59E0B' };
const TYPE_ICONS  = { update: 'campaign', tip: 'lightbulb', note: 'edit_note' };

function CommunityPage({ theme, toggleTheme }) {
  const isDark  = theme === 'dark';
  const [liked, setLiked] = useState({});

  const surface  = isDark ? '#1b1c1e' : '#FFFFFF';
  const surfLow  = isDark ? '#292a2c' : '#F8FAFC';
  const border   = isDark ? 'rgba(70,69,84,0.15)' : 'rgba(0,0,0,0.08)';
  const textPri  = isDark ? '#e3e2e5' : '#0F172A';
  const textSec  = isDark ? '#908fa0' : '#64748B';

  return (
    <DashboardLayout theme={theme} toggleTheme={toggleTheme}>
      <div className="space-y-6 max-w-3xl mx-auto">

        <div>
          <h1 className="text-3xl font-headline font-extrabold tracking-tight" style={{ color: textPri }}>Community</h1>
          <p className="text-sm mt-1" style={{ color: textSec }}>Updates, notes, and tips from the AlgoMind team</p>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 flex-wrap">
          {['All', 'Updates', 'Tips', 'Dev Notes', 'Challenges'].map(f => (
            <button key={f}
              className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all hover:opacity-80"
              style={{ background: surfLow, color: textSec, border: `1px solid ${border}` }}>
              {f}
            </button>
          ))}
        </div>

        {/* Posts */}
        <div className="space-y-4">
          {POSTS.map(post => {
            const isLiked = liked[post.id];
            const color   = TYPE_COLORS[post.type];
            return (
              <div key={post.id}
                className="community-post rounded-2xl p-6 transition-all card-3d"
                style={{ background: surface, border: `1px solid ${border}`, boxShadow: isDark ? 'none' : '0 4px 16px -4px rgba(0,0,0,0.06)' }}>

                {/* Author row */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center"
                    style={{ background: `${color}20` }}>
                    <span className="material-symbols-outlined text-base" style={{ color }}>{TYPE_ICONS[post.type]}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: textPri }}>{post.author}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: `${color}15`, color }}>
                        {post.role}
                      </span>
                      <span className="text-[9px]" style={{ color: textSec }}>{post.time}</span>
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
                  <div className="flex gap-2">
                    {post.tags.map(tag => (
                      <span key={tag} className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: surfLow, color: textSec }}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <button
                    className="flex items-center gap-1.5 text-[11px] font-bold transition-all hover:scale-110"
                    style={{ color: isLiked ? '#EF4444' : textSec }}
                    onClick={() => setLiked(l => ({ ...l, [post.id]: !l[post.id] }))}
                  >
                    <span className="material-symbols-outlined text-base"
                      style={{ fontVariationSettings: isLiked ? "'FILL' 1" : "'FILL' 0" }}>
                      favorite
                    </span>
                    {post.likes + (isLiked ? 1 : 0)}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default CommunityPage;
