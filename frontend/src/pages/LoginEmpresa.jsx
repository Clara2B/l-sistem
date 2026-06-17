import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Lock, ArrowRight, Building2 } from 'lucide-react';

export default function LoginEmpresa() {
  const { loginEmpresa } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nome: '', senha: '' });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.nome.trim() || !form.senha) return toast.error('Preencha todos os campos');
    setLoading(true);
    try {
      await loginEmpresa(form.nome.trim(), form.senha);
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Empresa ou senha inválidos');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#050505' }}>
      {/* Lado esquerdo — branding */}
      <div className="hidden lg:flex flex-col items-center justify-center flex-1 p-12">
        <img src="/logo.png" alt="B.BOTH" className="w-72 object-contain mb-8" />
        <p className="text-white/30 text-sm tracking-widest uppercase">Sistema de Gestão de Leads</p>
      </div>

      {/* Divisor vertical */}
      <div className="hidden lg:block w-px" style={{ background: 'linear-gradient(to bottom, transparent, rgba(21,101,245,0.4), rgba(0,212,245,0.4), transparent)' }} />

      {/* Lado direito — formulário */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12">
        {/* Logo mobile */}
        <div className="lg:hidden mb-8">
          <img src="/logo.png" alt="B.BOTH" className="h-16 object-contain mx-auto" />
        </div>

        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold text-white mb-1">Acesso da Empresa</h2>
          <p className="text-white/40 text-sm mb-8">Entre com as credenciais da sua empresa</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Nome da Empresa</label>
              <div className="relative">
                <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  className="w-full pl-9 pr-4 py-3 rounded-xl text-sm text-white placeholder-white/20 border border-white/10 focus:outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/15 transition-all"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                  placeholder="Nome da empresa"
                  value={form.nome}
                  onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Senha</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="password"
                  className="w-full pl-9 pr-4 py-3 rounded-xl text-sm text-white placeholder-white/20 border border-white/10 focus:outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/15 transition-all"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                  placeholder="••••••••"
                  value={form.senha}
                  onChange={e => setForm(f => ({ ...f, senha: e.target.value }))}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2"
              style={{ background: 'linear-gradient(135deg, #1565F5 0%, #00D4F5 100%)', boxShadow: '0 4px 20px rgba(21,101,245,0.35)' }}
            >
              {loading ? 'Verificando...' : <><span>Acessar</span><ArrowRight size={16} /></>}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/8 text-center">
            <p className="text-sm text-white/30">
              Empresa nova?{' '}
              <Link to="/registrar" className="font-semibold" style={{ color: '#00D4F5' }}>
                Cadastrar empresa
              </Link>
            </p>
          </div>

          <p className="text-center text-white/15 text-xs mt-8">
            Demo: empresa "Demo" · senha "demo123"
          </p>
        </div>
      </div>
    </div>
  );
}
