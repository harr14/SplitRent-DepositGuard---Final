import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ activeTab, setActiveTab }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleTabClick = (tabName) => {
    if (setActiveTab) {
      setActiveTab(tabName);
    }
    navigate('/dashboard', { state: { tab: tabName } });
  };

  return (
    <header className="w-full bg-white py-5 px-6 sm:px-12 border-b border-slate-100">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Left: Bold Brand Wordmark */}
        <Link
          to={user ? '/dashboard' : '/login'}
          onClick={() => setActiveTab && setActiveTab('DEPOSIT_GUARD')}
          className="text-2xl font-extrabold tracking-tight text-slate-900"
        >
          SplitRent & DepositGuard<span className="text-indigo-600">.</span>
        </Link>

        {/* Right: Clean Navigation Links + CTA Button */}
        <div className="flex items-center gap-6 sm:gap-8">
          {user ? (
            <>
              <button
                type="button"
                onClick={() => handleTabClick('DEPOSIT_GUARD')}
                className={`text-sm font-medium transition cursor-pointer ${
                  activeTab === 'DEPOSIT_GUARD'
                    ? 'text-indigo-600 font-semibold'
                    : 'text-slate-700 hover:text-indigo-600'
                }`}
              >
                Home
              </button>

              <button
                type="button"
                onClick={() => handleTabClick('DEPOSIT_GUARD')}
                className={`text-sm font-medium transition cursor-pointer ${
                  activeTab === 'DEPOSIT_GUARD'
                    ? 'text-indigo-600 font-semibold'
                    : 'text-slate-700 hover:text-indigo-600'
                }`}
              >
                DepositGuard
              </button>

              <button
                type="button"
                onClick={() => handleTabClick('SPLIT_RENT')}
                className={`text-sm font-medium transition cursor-pointer ${
                  activeTab === 'SPLIT_RENT'
                    ? 'text-indigo-600 font-semibold'
                    : 'text-slate-700 hover:text-indigo-600'
                }`}
              >
                SplitRent
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow-md transition cursor-pointer"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-slate-700 hover:text-indigo-600 transition"
              >
                Home
              </Link>
              <Link
                to="/signup"
                className="text-sm font-medium text-slate-700 hover:text-indigo-600 transition"
              >
                Sign Up
              </Link>
              <Link
                to="/login"
                className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow-md transition"
              >
                Login
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}