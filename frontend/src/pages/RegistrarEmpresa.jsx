import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';

export default function RegistrarEmpresa() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nome: '', senha: '', nomeAdmin: '', emailAdmin: '', senhaAdmin: '' });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const { nome, senha, nomeAdmin, emailAdmin, senhaAdmin } = form;
    if (!nome || !senha || !nomeAdmin || !emailAdmin || !senhaAdmin) return toast.error('Preencha todos os campos');
    if (senha.length < 6) return toast.error('Senha da empresa deve ter ao menos 6 caracteres');
    if (senhaAdmin.length < 6) return toast.error('Senha do admin deve ter ao menos 6 caracteres');
    setLoading(true);
    try {
      await api.post('/auth/registrar', form);
      toast.success('Empresa cadastrada! Faça login.');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao cadastrar empresa');
    } finally {
      setLoading(false);
    }
  }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const inputClass = "w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 border border-white/10 focus:outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/15 transition-all";
  const inputStyle = { background: 'rgba(255,255,255,0.06)' };
  const labelClass = "block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5";

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#050505' }}>
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="B.BOTH" className="h-16 object-contain mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white">Cadastrar Nova Empresa</h1>
          <p className="text-white/40 text-sm mt-1">Preencha os dados abaixo para criar sua conta</p>
        </div>

        <div className="rounded-2xl p-8 border border-white/8" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Dados da empresa */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#00D4F5' }}>
                Dados da Empresa
              </p>
              <div className="space-y-3">
                <div>
                  <label className={labelClass}>Nome da Empresa</label>
                  <input className={inputClass} style={inputStyle} placeholder="Minha Empresa" value={form.nome} onChange={set('nome')} />
                </div>
                <div>
                  <label className={labelClass}>Senha de Acesso da Empresa</label>
                  <input type="password" className={inputClass} style={inputStyle} placeholder="Mínimo 6 caracteres" value={form.senha} onChange={set('senha')} />
                </div>
              </div>
            </div>

            {/* Divisor */}
            <div className="border-t border-white/8 pt-5">
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#00D4F5' }}>
                Conta do Administrador
              </p>
              <div className="space-y-3">
                <div>
                  <label className={labelClass}>Nome</label>
                  <input className={inputClass} style={inputStyle} placeholder="Seu nome" value={form.nomeAdmin} onChange={set('nomeAdmin')} />
                </div>
                <div>
                  <label className={labelClass}>Email</label>
                  <input type="email" className={inputClass} style={inputStyle} placeholder="admin@empresa.com" value={form.emailAdmin} onChange={set('emailAdmin')} />
                </div>
                <div>
                  <label className={labelClass}>Senha</label>
                  <input type="password" className={inputClass} style={inputStyle} placeholder="Mínimo 6 caracteres" value={form.senhaAdmin} onChange={set('senhaAdmin')} />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-50 mt-2"
              style={{ background: 'linear-gradient(135deg, #1565F5 0%, #00D4F5 100%)', boxShadow: '0 4px 20px rgba(21,101,245,0.35)' }}
            >
              {loading ? 'Cadastrando...' : 'Cadastrar Empresa'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <Link to="/" className="text-sm text-white/30 hover:text-white/60 flex items-center justify-center gap-1 transition-colors">
              <ArrowLeft size={14} /> Voltar ao login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
