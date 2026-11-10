import { NavLink, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ darkMode, setDarkMode }) {
  const { userProfile, logout } = useAuth();
  const navigate = useNavigate();
  if (!userProfile) return null;
  const isAdmin = userProfile.role === 'admin';
  const links = isAdmin
    ? [['/admin/dashboard', 'Overview'], ['/admin/users', 'Users']]
    : [['/home', 'Create quiz'], ['/history', 'History'], ['/achievements', 'Progress'], ['/profile', 'Profile']];
  async function handleLogout() {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      toast.error(error.message || 'Could not sign out. Please try again.');
    }
  }
  return (
    <header className="app-header">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <div className="header-inner">
        <NavLink to={isAdmin ? '/admin/dashboard' : '/home'} className="brand">
          <span className="brand-mark" aria-hidden="true">s<span>g</span></span>SnapGrade
        </NavLink>
        <nav aria-label="Main navigation" className="main-nav">
          {links.map(([to, label]) => <NavLink key={to} to={to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>{label}</NavLink>)}
        </nav>
        <div className="header-actions">
          <span className="account-name">{userProfile.name}</span>
          <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)} aria-label={darkMode ? 'Use light theme' : 'Use dark theme'} aria-pressed={darkMode}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
              {darkMode ? <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></> : <path d="M20.7 13A8.8 8.8 0 0 1 11 3.3 8.8 8.8 0 1 0 20.7 13Z" />}
            </svg>
          </button>
          <button className="signout-button" onClick={handleLogout}>Sign out</button>
        </div>
      </div>
    </header>
  );
}
