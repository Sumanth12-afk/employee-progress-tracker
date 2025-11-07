import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles = [], children }) => {
  const token = localStorage.getItem('token');
  const rawUser = localStorage.getItem('user');

  if (!token || !rawUser) {
    return <Navigate to="/" replace />;
  }

  let user;
  try {
    user = JSON.parse(rawUser);
  } catch (error) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    const fallback = user.role === 'employee' ? '/employee/dashboard' : '/admin/dashboard';
    return <Navigate to={fallback} replace />;
  }

  return children;
};

export default ProtectedRoute;

