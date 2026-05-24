import { useState }             from 'react';
import { motion }               from 'framer-motion';
import { NavLink, useNavigate } from 'react-router-dom';
import { toast }                from 'react-toastify';
import { useAuth }              from '../context/AuthContext';
import { logoutUser }           from '../services/authService';

export default function Navbar({ darkMode, setDarkMode }) {
  const { userProfile, setUserProfile } = useAuth();
  const navigate = useNavigate();
  const [hoveredItem, setHoveredItem] = useState(null);
  if (!userProfile) return null;

  const isAdmin = userProfile.role === 'admin';
  const animatedLabels = new Set(['History', 'Achievements', 'Profile']);
  const links = isAdmin
    ? [{ to: '/admin/dashboard', icon: '📊', label: 'Dashboard' }, { to: '/admin/users', icon: '👥', label: 'Users' }]
    : [{ to: '/home', icon: '+', label: 'Generate' }, { to: '/history', icon: '🕒', label: 'History' },
       { to: '/achievements', icon: '🏆', label: 'Achievements' }, { to: '/profile', icon: '👤', label: 'Profile' }];

  async function handleLogout() {
    await logoutUser();
    setUserProfile(null);
    navigate('/login');
    toast.success('Logged out successfully.');
  }

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex h-16 w-[92%] max-w-7xl items-center justify-between rounded-2xl border border-indigo-100/70 bg-white/80 px-6 shadow-xl shadow-indigo-500/5 backdrop-blur-md transition-colors duration-300 dark:border-indigo-400/15 dark:bg-[#11131d]/80 dark:shadow-indigo-500/10">
      <div className="flex items-center gap-5">
        <NavLink to={isAdmin ? '/admin/dashboard' : '/home'} className="font-black text-xl flex items-center gap-1"
          style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)', WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent', backgroundClip: 'text', letterSpacing: '-0.4px' }}>
          <span>SnapGrade</span>
        </NavLink>
        <div className="flex gap-1 rounded-full bg-indigo-50/60 p-1 transition-colors duration-300 dark:bg-white/5">
          {links.map(({ to, icon, label }) => {
            const hasMotionIndicator = animatedLabels.has(label);

            return (
              <NavLink
                key={to}
                to={to}
                onMouseEnter={() => hasMotionIndicator && setHoveredItem(to)}
                onMouseLeave={() => hasMotionIndicator && setHoveredItem(null)}
                className={({ isActive }) =>
                  `relative isolate flex items-center gap-1.5 overflow-hidden rounded-full px-3 py-2 text-sm font-bold transition-colors duration-200 ${
                    isActive ? 'text-indigo-700 dark:text-indigo-200' : 'text-gray-500 hover:text-indigo-700 dark:text-slate-400 dark:hover:text-indigo-200'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {hasMotionIndicator && (hoveredItem === to || (!hoveredItem && isActive)) && (
                      <motion.span
                        layoutId="navbar-pill-indicator"
                        className="absolute inset-0 z-0 rounded-full bg-white shadow-sm shadow-indigo-500/10 ring-1 ring-indigo-100/80 dark:bg-indigo-400/10 dark:shadow-indigo-500/20 dark:ring-indigo-300/20"
                        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                      />
                    )}
                    {icon && <span className="relative z-10">{icon}</span>}
                    <span className={`relative z-10 ${icon ? 'hidden sm:inline' : ''}`}>{label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400 font-semibold hidden md:block">{userProfile.name}</span>
        <motion.button
          type="button"
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          onClick={() => setDarkMode(!darkMode)}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-full border border-indigo-100 bg-white text-indigo-600 shadow-sm shadow-indigo-500/10 transition-colors duration-300 hover:border-indigo-200 hover:bg-indigo-50 dark:border-indigo-300/20 dark:bg-white/5 dark:text-amber-200 dark:hover:bg-indigo-400/10"
        >
          <motion.span
            key={darkMode ? 'moon' : 'sun'}
            initial={{ rotate: -45, scale: 0.6, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: 45, scale: 0.6, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 26 }}
          >
            {darkMode ? <MoonIcon /> : <SunIcon />}
          </motion.span>
        </motion.button>
        <button onClick={handleLogout} className="text-sm font-bold px-3 py-1.5 rounded-md transition-all"
          style={{ background: '#fff5f5', color: '#ef4444', border: '1px solid #fecaca', cursor: 'pointer' }}>
          Logout
        </button>
      </div>
    </nav>
  );
}

function SunIcon() {
  return (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 4V2M12 22v-2M4.93 4.93 3.51 3.51M20.49 20.49l-1.42-1.42M4 12H2M22 12h-2M4.93 19.07l-1.42 1.42M20.49 3.51l-1.42 1.42" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="12" r="4.2" fill="currentColor" opacity="0.22" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20.25 14.4A7.8 7.8 0 0 1 9.6 3.75a8.8 8.8 0 1 0 10.65 10.65Z" fill="currentColor" opacity="0.22" />
      <path d="M20.25 14.4A7.8 7.8 0 0 1 9.6 3.75a8.8 8.8 0 1 0 10.65 10.65Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M16.7 4.8h2.1M17.75 3.75v2.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
