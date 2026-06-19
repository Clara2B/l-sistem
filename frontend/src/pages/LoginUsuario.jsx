import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { User, Lock, ArrowRight, ArrowLeft, Eye, EyeOff } from 'lucide-react';

export default function LoginUsuario() {
  const { loginUsuario, empresa, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', senha: '' });
  const [loading, setLoading] = useState(false);
  const [showSenha, setShowSenha] = useState(false);

  useEffect(() => { if (!empresa) navigate('/'); }, [empresa, navigate]);
  if (!empresa) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.email || !form.senha) return toast.error('Preencha todos os campos');
    setLoading(true);
    try {
      const data = await loginUsuario(form.email, form.senha);
      const tipo = data.usuario.tipo;
      const tipoOp = empresa?.tipo_operacao || 'vendas';
      // RH ou empresa só-recrutamento → dashboard recrutamento
      if (tipo === 'rh' || tipoOp === 'recrutamento') {
        navigate('/recrutamento/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Usuário ou senha inválidos');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#050505' }}>
      <div className="hidden lg:flex flex-col items-center justify-center flex-1 p-12">
        <img src="/logo.png" alt="B.BOTH" className="w-72 object-contain mb-8" />
        <p className="text-white/30 text-sm tracking-widest uppercase">Sistema de Gestão de Leads</p>
      </div>

      <div className="hidden lg:block w-px" style={{ background: 'linear-gradient(to bottom, transparent, rgba(21,101,245,0.4), rgba(0,212,245,0.4), transparent)' }} />

      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12">
        <div className="lg:hidden mb-8">
          <img src="/logo.png" alt="B.BOTH" className="h-16 object-contain mx-auto" />
        </div>

        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: 'rgba(21,101,245,0.2)', color: '#60b0ff' }}>
              {empresa.nome}
            </span>
            <button onClick={() => { logout(); navigate('/'); }} className="text-xs text-white/30 hover:text-white/60 flex items-center gap-1 transition-colors">
              <ArrowLeft size={12} /> Trocar empresa
            </button>
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">Bem-vindo</h2>
          <p className="text-white/40 text-sm mb-8">Entre com seu email e senha</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Email</label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="email"
                  className="w-full pl-9 pr-4 py-3 rounded-xl text-sm text-white placeholder-white/20 border border-white/10 focus:outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/15 transition-all"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                  placeholder="seu@email.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Senha</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type={showSenha ? 'text' : 'password'}
                  className="w-full pl-9 pr-10 py-3 rounded-xl text-sm text-white placeholder-white/20 border border-white/10 focus:outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/15 transition-all"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                  placeholder="••••••••"
                  value={form.senha}
                  onChange={e => setForm(f => ({ ...f, senha: e.target.value }))}
                />
                <button type="button" onClick={() => setShowSenha(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                  {showSenha ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2"
              style={{ background: 'linear-gradient(135deg, #1565F5 0%, #00D4F5 100%)', boxShadow: '0 4px 20px rgba(21,101,245,0.35)' }}
            >
              {loading ? 'Entrando...' : <><span>Entrar</span><ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="text-center text-white/15 text-xs mt-10">
            Demo: dono@demo.com · senha dono123
          </p>
        </div>
      </div>
    </div>
  );
}
