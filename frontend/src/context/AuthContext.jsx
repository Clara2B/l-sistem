import { createContext, useContext, useState } from 'react';
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

  async function loginEmpresa(nome, senha) {
    const { data } = await api.post('/auth/empresa', { nome, senha });
    setEmpresa(data.empresa);
    setEmpresaToken(data.token);
    localStorage.setItem('empresa', JSON.stringify(data.empresa));
    localStorage.setItem('empresa_token', data.token);
    return data;
  }

  async function loginUsuario(email, senha) {
    const { data } = await api.post('/auth/usuario', { email, senha }, {
      headers: { Authorization: `Bearer ${empresaToken}` }
    });
    setUser(data.usuario);
    localStorage.setItem('user', JSON.stringify(data.usuario));
    localStorage.setItem('token', data.token);
    return data;
  }

  async function refreshEmpresa() {
    try {
      const { data } = await api.get('/configuracoes');
      if (data.empresa) {
        const updated = { ...empresa, ...data.empresa };
        setEmpresa(updated);
        localStorage.setItem('empresa', JSON.stringify(updated));
      }
    } catch {}
  }

  function logout() {
    setUser(null);
    setEmpresa(null);
    setEmpresaToken(null);
    localStorage.clear();
  }

  const isDono    = user?.tipo === 'dono';
  const isRH      = user?.tipo === 'rh';
  const isVendedor = user?.tipo === 'vendedor';

  const tipoOp = empresa?.tipo_operacao || 'vendas';
  const hasVendas      = tipoOp === 'vendas' || tipoOp === 'vendas_recrutamento';
  const hasRecrutamento = tipoOp === 'recrutamento' || tipoOp === 'vendas_recrutamento';

  return (
    <AuthContext.Provider value={{
      user, empresa, empresaToken,
      loginEmpresa, loginUsuario, logout, refreshEmpresa,
      isDono, isRH, isVendedor,
      hasVendas, hasRecrutamento,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
