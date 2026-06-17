import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  });
  const [empresa, setEmpresa] = useState(() => {
    const e = localStorage.getItem('empresa');
    return e ? JSON.parse(e) : null;
  });
  const [empresaToken, setEmpresaToken] = useState(localStorage.getItem('empresa_token') || null);

  // Etapa 1: login empresa
  async function loginEmpresa(nome, senha) {
    const { data } = await api.post('/auth/empresa', { nome, senha });
    setEmpresa(data.empresa);
    setEmpresaToken(data.token);
    localStorage.setItem('empresa', JSON.stringify(data.empresa));
    localStorage.setItem('empresa_token', data.token);
    return data;
  }

  // Etapa 2: login usuário
  async function loginUsuario(email, senha) {
    const { data } = await api.post('/auth/usuario', { email, senha }, {
      headers: { Authorization: `Bearer ${empresaToken}` }
    });
    setUser(data.usuario);
    localStorage.setItem('user', JSON.stringify(data.usuario));
    localStorage.setItem('token', data.token);
    return data;
  }

  function logout() {
    setUser(null);
    setEmpresa(null);
    setEmpresaToken(null);
    localStorage.clear();
  }

  const isDono = user?.tipo === 'dono';

  return (
    <AuthContext.Provider value={{ user, empresa, empresaToken, loginEmpresa, loginUsuario, logout, isDono }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
