import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginEmpresa from './pages/LoginEmpresa';
import LoginUsuario from './pages/LoginUsuario';
import RegistrarEmpresa from './pages/RegistrarEmpresa';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Importacao from './pages/Importacao';
import Usuarios from './pages/Usuarios';
import Configuracoes from './pages/Configuracoes';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <Routes>
          <Route path="/" element={<LoginEmpresa />} />
          <Route path="/login" element={<LoginUsuario />} />
          <Route path="/registrar" element={<RegistrarEmpresa />} />
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/importar" element={<ProtectedRoute donoOnly><Importacao /></ProtectedRoute>} />
            <Route path="/usuarios" element={<ProtectedRoute donoOnly><Usuarios /></ProtectedRoute>} />
            <Route path="/configuracoes" element={<ProtectedRoute donoOnly><Configuracoes /></ProtectedRoute>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
