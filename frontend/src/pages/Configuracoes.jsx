import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Settings, DollarSign, Building2, Lock, Save, Briefcase } from 'lucide-react';

export default function Configuracoes() {
  const { empresa, refreshEmpresa } = useAuth();
  const [config, setConfig] = useState(null);
  const [form, setForm] = useState({
    valor_investido: '',
    nome_empresa: '',
    senha_empresa: '',
    confirmar_senha: '',
    tipo_operacao: 'vendas',
  });
  const [recruForm, setRecruForm] = useState({
    budget: '', verba_utilizada: '', projecao_1: '', projecao_2: '', projecao_3: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingRecru, setSavingRecru] = useState(false);

  useEffect(() => {
    api.get('/configuracoes').then(({ data }) => {
      setConfig(data);
      setForm(f => ({
        ...f,
        nome_empresa: data.empresa?.nome || '',
        valor_investido: data.config?.valor_investido ?? '',
        tipo_operacao: data.empresa?.tipo_operacao || 'vendas',
      }));
      if (data.recrutamento) {
        setRecruForm({
          budget: data.recrutamento.budget ?? '',
          verba_utilizada: data.recrutamento.verba_utilizada ?? '',
          projecao_1: data.recrutamento.projecao_1 ?? '',
          projecao_2: data.recrutamento.projecao_2 ?? '',
          projecao_3: data.recrutamento.projecao_3 ?? '',
        });
      }
    }).catch(() => toast.error('Erro ao carregar configurações')).finally(() => setLoading(false));
  }, []);

  async function salvarVendas(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/configuracoes', { valor_investido: +form.valor_investido });
      toast.success('Valor investido atualizado');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  async function salvarEmpresa(e) {
    e.preventDefault();
    const payload = {};
    if (form.nome_empresa && form.nome_empresa !== config?.empresa?.nome) payload.nome_empresa = form.nome_empresa;
    if (form.senha_empresa) {
      if (form.senha_empresa !== form.confirmar_senha) return toast.error('As senhas não coincidem');
      if (form.senha_empresa.length < 6) return toast.error('Senha deve ter ao menos 6 caracteres');
      payload.senha_empresa = form.senha_empresa;
    }
    if (form.tipo_operacao !== config?.empresa?.tipo_operacao) payload.tipo_operacao = form.tipo_operacao;
    if (!Object.keys(payload).length) return toast.error('Nenhuma alteração detectada');
    setSaving(true);
    try {
      await api.put('/configuracoes', payload);
      toast.success('Configurações da empresa atualizadas');
      setForm(f => ({ ...f, senha_empresa: '', confirmar_senha: '' }));
      await refreshEmpresa();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  async function salvarRecrutamento(e) {
    e.preventDefault();
    setSavingRecru(true);
    try {
      const payload = {};
      if (recruForm.budget !== '')         payload.budget = +recruForm.budget;
      if (recruForm.verba_utilizada !== '') payload.verba_utilizada = +recruForm.verba_utilizada;
      if (recruForm.projecao_1 !== '')     payload.projecao_1 = +recruForm.projecao_1;
      if (recruForm.projecao_2 !== '')     payload.projecao_2 = +recruForm.projecao_2;
      if (recruForm.projecao_3 !== '')     payload.projecao_3 = +recruForm.projecao_3;
      await api.put('/recrutamento/config', payload);
      toast.success('Configurações de recrutamento salvas');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao salvar');
    } finally {
      setSavingRecru(false);
    }
  }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const setR = k => e => setRecruForm(f => ({ ...f, [k]: e.target.value }));

  const hasRecrutamento = ['recrutamento', 'vendas_recrutamento'].includes(form.tipo_operacao);
  const hasVendas = ['vendas', 'vendas_recrutamento'].includes(form.tipo_operacao);

  if (loading) return <div className="text-center py-12 text-gray-400">Carregando...</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-sm text-gray-500 mt-0.5">Gerencie as configurações da sua empresa</p>
      </div>

      {/* Tipo de Operação */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Briefcase size={18} className="text-blue-600" />
          <h2 className="font-semibold text-gray-900">Tipo de Operação</h2>
        </div>
        <form onSubmit={salvarEmpresa} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Módulos ativos</label>
            <select className="input" value={form.tipo_operacao} onChange={set('tipo_operacao')}>
              <option value="vendas">Apenas Vendas</option>
              <option value="recrutamento">Apenas Recrutamento</option>
              <option value="vendas_recrutamento">Vendas + Recrutamento</option>
            </select>
            <p className="text-xs text-gray-400 mt-1">Define quais módulos e perfis de usuário ficam disponíveis na empresa.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Empresa</label>
            <input className="input" value={form.nome_empresa} onChange={set('nome_empresa')} />
          </div>
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Lock size={16} className="text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Alterar senha de acesso da empresa</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nova senha</label>
                <input type="password" className="input" placeholder="Mínimo 6 caracteres" value={form.senha_empresa} onChange={set('senha_empresa')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar senha</label>
                <input type="password" className="input" placeholder="Repita a senha" value={form.confirmar_senha} onChange={set('confirmar_senha')} />
              </div>
            </div>
          </div>
          <button type="submit" className="btn-primary flex items-center gap-2" disabled={saving}>
            <Save size={16} /> Salvar Configurações da Empresa
          </button>
        </form>
      </div>

      {/* Valor investido (vendas) */}
      {hasVendas && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign size={18} className="text-blue-600" />
            <h2 className="font-semibold text-gray-900">Investimento em Vendas</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">Valor total investido em tráfego/marketing para calcular CPL e CPV.</p>
          <form onSubmit={salvarVendas} className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
                <input type="number" step="0.01" className="input pl-9" placeholder="0,00"
                  value={form.valor_investido} onChange={set('valor_investido')} />
              </div>
            </div>
            <button type="submit" className="btn-primary flex items-center justify-center gap-2 sm:w-auto w-full" disabled={saving}>
              <Save size={16} /> Salvar
            </button>
          </form>
        </div>
      )}

      {/* Configurações de Recrutamento */}
      {hasRecrutamento && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase size={18} className="text-green-600" />
            <h2 className="font-semibold text-gray-900">Configurações de Recrutamento</h2>
          </div>
          <form onSubmit={salvarRecrutamento} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget da Campanha (R$)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
                  <input type="number" step="0.01" className="input pl-9" placeholder="0,00"
                    value={recruForm.budget} onChange={setR('budget')} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Verba Utilizada (R$)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
                  <input type="number" step="0.01" className="input pl-9" placeholder="0,00"
                    value={recruForm.verba_utilizada} onChange={setR('verba_utilizada')} />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Projeções de Budget (R$)</label>
              <div className="grid grid-cols-3 gap-2">
                {['projecao_1', 'projecao_2', 'projecao_3'].map((k, i) => (
                  <div key={k}>
                    <label className="block text-xs text-gray-500 mb-1">Projeção {i + 1}</label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">R$</span>
                      <input type="number" step="0.01" className="input pl-7 text-sm" placeholder="0"
                        value={recruForm[k]} onChange={setR(k)} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">Usadas no dashboard de recrutamento para projetar quantidade de candidatos.</p>
            </div>
            <button type="submit" className="btn-primary flex items-center gap-2" disabled={savingRecru}>
              <Save size={16} /> Salvar Configurações de Recrutamento
            </button>
          </form>
        </div>
      )}

      {/* Info */}
      <div className="card bg-gray-50 border-gray-100">
        <h3 className="text-sm font-medium text-gray-600 mb-2">Informações do sistema</h3>
        <dl className="space-y-1 text-sm text-gray-500">
          <div className="flex justify-between"><dt>ID da empresa</dt><dd className="font-mono text-xs">{config?.empresa?.id?.slice(0, 8)}...</dd></div>
          <div className="flex justify-between"><dt>Cadastrada em</dt><dd>{new Date(config?.empresa?.criado_em).toLocaleDateString('pt-BR')}</dd></div>
        </dl>
      </div>
    </div>
  );
}
