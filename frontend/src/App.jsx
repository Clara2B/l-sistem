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
import Candidatos from './pages/Candidatos';
import DashboardRecrutamento from './pages/DashboardRecrutamento';
import ImportacaoCandidatos from './pages/ImportacaoCandidatos';

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
            {/* Vendas */}
            <Route path="/dashboard" element={<ProtectedRoute roles={['dono','vendedor']}><Dashboard /></ProtectedRoute>} />
            <Route path="/leads" element={<ProtectedRoute roles={['dono','vendedor']}><Leads /></ProtectedRoute>} />
            <Route path="/importar" element={<ProtectedRoute donoOnly><Importacao /></ProtectedRoute>} />
            {/* Recrutamento */}
            <Route path="/recrutamento/dashboard" element={<ProtectedRoute roles={['dono','rh']}><DashboardRecrutamento /></ProtectedRoute>} />
            <Route path="/recrutamento/candidatos" element={<ProtectedRoute roles={['dono','rh']}><Candidatos /></ProtectedRoute>} />
            <Route path="/recrutamento/importar" element={<ProtectedRoute donoOnly><ImportacaoCandidatos /></ProtectedRoute>} />
            {/* Admin */}
            <Route path="/usuarios" element={<ProtectedRoute donoOnly><Usuarios /></ProtectedRoute>} />
            <Route path="/configuracoes" element={<ProtectedRoute donoOnly><Configuracoes /></ProtectedRoute>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
