import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { adminAPI } from '../services/api';

const ManageStudents = () => {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/');
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'super-admin') {
      navigate('/admin/dashboard');
      return;
    }
    
    setUser(parsedUser);
  }, [navigate]);

  const handleManageAdmin = async (action) => {
    if (!email) {
      alert('Please enter an email');
      return;
    }

    try {
      setLoading(true);
      await adminAPI.manageAdmin(email, action);
      alert(`Successfully ${action === 'add' ? 'added' : 'removed'} admin: ${email}`);
      setEmail('');
    } catch (error) {
      alert(error.response?.data?.detail || 'Error managing admin');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar user={user} />
      
      <div className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Manage Students & Admins</h2>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
          >
            Back to Dashboard
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
          <h3 className="text-xl font-bold mb-4">Admin Management</h3>
          <p className="text-gray-600 mb-6">
            Add or remove admin privileges for users. Only super-admins can perform these actions.
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">User Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={() => handleManageAdmin('add')}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50"
              >
                Add as Admin
              </button>
              
              <button
                onClick={() => handleManageAdmin('remove')}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50"
              >
                Remove Admin
              </button>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Important Notes:</h4>
            <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
              <li>Users must first register via Google Sign-in</li>
              <li>New users are automatically assigned the "student" role</li>
              <li>Only super-admins can promote/demote admin access</li>
              <li>You cannot remove your own super-admin status</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageStudents;

