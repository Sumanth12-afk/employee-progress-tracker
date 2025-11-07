import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../utils/firebase';

const Navbar = ({ user }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold">Employee Progress Tracker</h1>
            {user && (
              <span className="px-3 py-1 bg-blue-500 rounded-full text-sm">
                {user.role === 'admin' || user.role === 'super-admin' ? 'Admin' : 'Employee'}
              </span>
            )}
          </div>
          {user && (
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <p className="font-medium">{user.name}</p>
                <p className="text-sm text-blue-200">{user.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

