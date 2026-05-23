import { NavLink, useNavigate } from 'react-router-dom';
import { toast }                from 'react-toastify';
import { useAuth }              from '../context/AuthContext';
import { logoutUser }           from '../services/authService';

export default function Navbar() {
  const { userProfile, setUserProfile } = useAuth();
  const navigate = useNavigate();
  if (!userProfile) return null;

  const isAdmin = userProfile.role === 'admin';
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
    <nav className="sticky top-0 z-50 flex items-center justify-between px-6 h-16"
      style={{ background: 'rgba(255,255,255,0.93)', backdropFilter: 'blur(18px)',
        borderBottom: '1px solid rgba(102,126,234,0.1)', boxShadow: '0 2px 14px rgba(0,0,0,0.06)' }}>
      <div className="flex items-center gap-5">
        <NavLink to={isAdmin ? '/admin/dashboard' : '/home'} className="font-black text-xl flex items-center gap-1"
          style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)', WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent', backgroundClip: 'text', letterSpacing: '-0.4px' }}>
          <span>SnapGrade</span>
        </NavLink>
        <div className="flex gap-1">
          {links.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              {icon && <span>{icon}</span>}<span className={icon ? 'hidden sm:inline' : ''}>{label}</span>
            </NavLink>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400 font-semibold hidden md:block">{userProfile.name}</span>
        <button onClick={handleLogout} className="text-sm font-bold px-3 py-1.5 rounded-md transition-all"
          style={{ background: '#fff5f5', color: '#ef4444', border: '1px solid #fecaca', cursor: 'pointer' }}>
          Logout
        </button>
      </div>
    </nav>
  );
}
