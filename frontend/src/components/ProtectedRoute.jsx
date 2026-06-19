import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, donoOnly = false, roles }) {
  const { user, empresa } = useAuth();
  if (!empresa) return <Navigate to="/" replace />;
  if (!user) return <Navigate to="/login" replace />;
  if (donoOnly && user.tipo !== 'dono') return <Navigate to="/dashboard" replace />;
  if (roles && !roles.includes(user.tipo)) return <Navigate to="/dashboard" replace />;
  return children;
}
