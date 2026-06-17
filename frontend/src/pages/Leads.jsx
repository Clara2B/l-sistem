import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Search, Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react';

// ─── Portal dropdown (renderiza no body, sem clipping) ────────────────────────
function DropdownPortal({ anchorRef, aberto, onFechar, children }) {
  const [pos, setPos] = useState({ top: 0, left: 0, openUp: false });
  const menuRef = useRef();

  useEffect(() => {
    if (!aberto || !anchorRef.current) return;

    function calcPos() {
      const rect = anchorRef.current.getBoundingClientRect();
      const menuH = menuRef.current?.offsetHeight || 220;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < menuH + 8 && rect.top > menuH + 8;
      setPos({
        top: openUp ? rect.top + window.scrollY - menuH - 4 : rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        openUp,
      });
    }

    calcPos();
    window.addEventListener('scroll', calcPos, true);
    window.addEventListener('resize', calcPos);
    return () => {
      window.removeEventListener('scroll', calcPos, true);
      window.removeEventListener('resize', calcPos);
    };
  }, [aberto, anchorRef]);

  useEffect(() => {
    if (!aberto) return;
    function fechar(e) {
      if (menuRef.current && !menuRef.current.contains(e.target) &&
          anchorRef.current && !anchorRef.current.contains(e.target)) {
        onFechar();
      }
    }
    document.addEventListener('mousedown', fechar);
    return () => document.removeEventListener('mousedown', fechar);
  }, [aberto, onFechar, anchorRef]);

  if (!aberto) return null;

  return createPortal(
    <div
      ref={menuRef}
      style={{ position: 'absolute', top: pos.top, left: pos.left, zIndex: 9999 }}
      className="bg-white rounded-xl shadow-xl border border-gray-100 py-1 min-w-[160px]"
    >
      {children}
    </div>,
    document.body
  );
}

const STATUS_LABELS = {
  negociacao: 'Negociação',
  nao_atende: 'Não Atende',
  descarte: 'Descarte',
  venda: 'Venda',
};

const STATUS_CORES = {
  negociacao: 'bg-yellow-100 text-yellow-800',
  nao_atende: 'bg-gray-100 text-gray-600',
  descarte: 'bg-red-100 text-red-700',
  venda: 'bg-green-100 text-green-700',
};

// Salva um campo único via PATCH e retorna o lead atualizado
async function salvarCampo(leadId, campo, valor) {
  const { data } = await api.patch(`/leads/${leadId}`, { campo, valor });
  return data;
}

// ─── Célula de Status ────────────────────────────────────────────────────────
function CelulaStatus({ lead, podeeditar, onAtualizar }) {
  const [salvando, setSalvando] = useState(false);
  const [aberto, setAberto] = useState(false);
  const btnRef = useRef();

  async function selecionar(novoStatus) {
    if (novoStatus === lead.status) { setAberto(false); return; }
    setSalvando(true);
    setAberto(false);
    try {
      const atualizado = await salvarCampo(lead.id, 'status', novoStatus);
      onAtualizar(atualizado);
      toast.success('Status atualizado');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao salvar status');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div>
      <button
        ref={btnRef}
        onClick={() => podeeditar && setAberto(v => !v)}
        disabled={salvando}
        className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full transition-all
          ${STATUS_CORES[lead.status]}
          ${podeeditar ? 'cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-gray-300' : 'cursor-default'}
          ${salvando ? 'opacity-60' : ''}
        `}
      >
        {salvando && <Loader2 size={10} className="animate-spin" />}
        {STATUS_LABELS[lead.status]}
        {podeeditar && !salvando && <span className="text-gray-400 text-[10px]">▾</span>}
      </button>

      <DropdownPortal anchorRef={btnRef} aberto={aberto} onFechar={() => setAberto(false)}>
        {Object.entries(STATUS_LABELS).map(([val, label]) => (
          <button
            key={val}
            onClick={() => selecionar(val)}
            className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-2 transition-colors
              ${lead.status === val ? 'font-semibold' : ''}
            `}
          >
            <span className={`inline-block w-2 h-2 rounded-full ${
              val === 'negociacao' ? 'bg-yellow-400' :
              val === 'nao_atende' ? 'bg-gray-400' :
              val === 'descarte' ? 'bg-red-400' : 'bg-green-500'
            }`} />
            {label}
            {lead.status === val && <span className="ml-auto text-blue-500">✓</span>}
          </button>
        ))}
      </DropdownPortal>
    </div>
  );
}

// ─── Célula de Vendedor ──────────────────────────────────────────────────────
function CelulaVendedor({ lead, vendedores, isDono, onAtualizar }) {
  const [salvando, setSalvando] = useState(false);
  const [aberto, setAberto] = useState(false);
  const btnRef = useRef();

  async function selecionar(novoVendedorId) {
    if (novoVendedorId === (lead.vendedor_id || '')) { setAberto(false); return; }
    setSalvando(true);
    setAberto(false);
    try {
      const atualizado = await salvarCampo(lead.id, 'vendedor_id', novoVendedorId || null);
      onAtualizar(atualizado);
      toast.success('Vendedor atualizado');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao salvar vendedor');
    } finally {
      setSalvando(false);
    }
  }

  const nomeAtual = lead.vendedor_nome || null;

  if (!isDono) {
    return <span className="text-sm text-gray-500">{nomeAtual || <span className="text-gray-300">—</span>}</span>;
  }

  return (
    <div>
      <button
        ref={btnRef}
        onClick={() => setAberto(v => !v)}
        disabled={salvando}
        className="flex items-center gap-1 text-sm text-gray-700 hover:text-blue-600 transition-colors group"
      >
        {salvando
          ? <Loader2 size={12} className="animate-spin text-gray-400" />
          : nomeAtual
            ? <span className="underline-offset-2 group-hover:underline">{nomeAtual}</span>
            : <span className="text-gray-300 italic group-hover:text-blue-400">Atribuir</span>
        }
        {!salvando && <span className="text-gray-300 text-[10px]">▾</span>}
      </button>

      <DropdownPortal anchorRef={btnRef} aberto={aberto} onFechar={() => setAberto(false)}>
        <div className="max-h-52 overflow-y-auto">
          <button
            onClick={() => selecionar('')}
            className="w-full text-left px-3 py-2 text-xs text-gray-400 hover:bg-gray-50 italic"
          >
            Sem vendedor
          </button>
          <div className="border-t border-gray-50 my-0.5" />
          {vendedores.map(v => (
            <button
              key={v.id}
              onClick={() => selecionar(v.id)}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center justify-between transition-colors
                ${lead.vendedor_id === v.id ? 'font-semibold text-blue-600' : 'text-gray-700'}
              `}
            >
              <span>{v.nome}</span>
              {lead.vendedor_id === v.id && <span className="text-blue-500">✓</span>}
            </button>
          ))}
        </div>
      </DropdownPortal>
    </div>
  );
}

// ─── Célula de Valor ─────────────────────────────────────────────────────────
function CelulaValor({ lead, podeeditar, onAtualizar }) {
  const [editando, setEditando] = useState(false);
  const [valorLocal, setValorLocal] = useState('');
  const [salvando, setSalvando] = useState(false);
  const inputRef = useRef();

  function iniciarEdicao() {
    if (!podeeditar) return;
    setValorLocal(lead.valor != null ? String(lead.valor) : '');
    setEditando(true);
  }

  useEffect(() => {
    if (editando && inputRef.current) inputRef.current.focus();
  }, [editando]);

  async function salvar() {
    setEditando(false);
    const valorTrimado = valorLocal.trim();
    const valorAnterior = lead.valor;
    const novoValor = valorTrimado === '' ? null : Number(valorTrimado.replace(',', '.'));

    if (novoValor !== null && isNaN(novoValor)) {
      toast.error('Valor inválido');
      return;
    }
    // Sem mudança
    if (novoValor === valorAnterior) return;

    setSalvando(true);
    try {
      const atualizado = await salvarCampo(lead.id, 'valor', novoValor);
      onAtualizar(atualizado);
      toast.success('Valor atualizado');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao salvar valor');
    } finally {
      setSalvando(false);
    }
  }

  if (salvando) {
    return <span className="text-gray-400 text-sm flex items-center gap-1"><Loader2 size={12} className="animate-spin" />...</span>;
  }

  if (editando) {
    return (
      <input
        ref={inputRef}
        type="number"
        step="0.01"
        className="w-28 border border-blue-400 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={valorLocal}
        onChange={e => setValorLocal(e.target.value)}
        onBlur={salvar}
        onKeyDown={e => { if (e.key === 'Enter') salvar(); if (e.key === 'Escape') setEditando(false); }}
        placeholder="0,00"
      />
    );
  }

  return (
    <span
      onClick={iniciarEdicao}
      className={`text-sm transition-colors ${
        podeeditar ? 'cursor-pointer hover:text-blue-600 group' : ''
      }`}
      title={podeeditar ? 'Clique para editar' : ''}
    >
      {lead.valor != null
        ? <span className={podeeditar ? 'underline-offset-2 group-hover:underline text-gray-700' : 'text-gray-700'}>
            R$ {Number(lead.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        : <span className={podeeditar ? 'text-gray-300 italic hover:text-blue-400' : 'text-gray-300'}>
            {podeeditar ? 'Adicionar' : '—'}
          </span>
      }
    </span>
  );
}

// ─── Modal de edição completa ─────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function LeadForm({ lead, vendedores, onSave, onClose, isDono }) {
  const [form, setForm] = useState({
    nome: lead?.nome || '',
    parcela: lead?.parcela || '',
    endereco: lead?.endereco || '',
    email: lead?.email || '',
    telefone: lead?.telefone || '',
    status: lead?.status || 'negociacao',
    valor: lead?.valor != null ? lead.valor : '',
    vendedor_id: lead?.vendedor_id || '',
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.nome.trim()) return toast.error('Nome é obrigatório');
    setSaving(true);
    try {
      const payload = { ...form, valor: form.valor !== '' ? +form.valor : null, vendedor_id: form.vendedor_id || null };
      if (lead) {
        await api.put(`/leads/${lead.id}`, payload);
        toast.success('Lead atualizado');
      } else {
        await api.post('/leads', payload);
        toast.success('Lead criado');
      }
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Dados do Lead</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
            <input className="input" value={form.nome} onChange={set('nome')} placeholder="Nome do lead" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
            <input className="input" value={form.telefone} onChange={set('telefone')} placeholder="(11) 99999-9999" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Parcela</label>
            <input className="input" value={form.parcela} onChange={set('parcela')} placeholder="Ex: 3x de R$ 500" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" className="input" value={form.email} onChange={set('email')} placeholder="email@exemplo.com" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
            <input className="input" value={form.endereco} onChange={set('endereco')} placeholder="Rua, número, cidade" />
          </div>
        </div>
      </div>
      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Atendimento</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select className="input" value={form.status} onChange={set('status')}>
              {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
            <input type="number" step="0.01" className="input" value={form.valor} onChange={set('valor')} placeholder="0,00" />
          </div>
          {isDono && (
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Vendedor</label>
              <select className="input" value={form.vendedor_id} onChange={set('vendedor_id')}>
                <option value="">Sem vendedor</option>
                {vendedores.map(v => <option key={v.id} value={v.id}>{v.nome}{v.tipo === 'dono' ? ' (dono)' : ''}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
        <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
      </div>
    </form>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function Leads() {
  const { isDono, user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalLead, setModalLead] = useState(null);
  const [filtros, setFiltros] = useState({ busca: '', status: '', vendedor_id: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filtros).filter(([, v]) => v));
      const { data } = await api.get('/leads', { params });
      setLeads(data);
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  useEffect(() => {
    api.get('/usuarios').then(r => setVendedores(r.data)).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  // Atualiza um lead na lista local sem recarregar tudo
  function atualizarLead(leadAtualizado) {
    setLeads(prev => prev.map(l => l.id === leadAtualizado.id ? leadAtualizado : l));
  }

  async function deletarLead(id) {
    if (!confirm('Remover este lead?')) return;
    try {
      await api.delete(`/leads/${id}`);
      toast.success('Lead removido');
      setLeads(prev => prev.filter(l => l.id !== id));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao remover');
    }
  }

  function podeEditar(lead) {
    if (isDono) return true;
    return lead.vendedor_id === null || lead.vendedor_id === user.id;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-sm text-gray-500 mt-0.5">{leads.length} registros encontrados</p>
        </div>
        {isDono && (
          <button onClick={() => setModalLead({})} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Novo Lead
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input pl-9 text-sm"
              placeholder="Buscar por nome, email ou telefone..."
              value={filtros.busca}
              onChange={e => setFiltros(f => ({ ...f, busca: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && load()}
            />
          </div>
          <select className="input text-sm w-44" value={filtros.status}
            onChange={e => setFiltros(f => ({ ...f, status: e.target.value }))}>
            <option value="">Todos os status</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          {isDono && vendedores.length > 0 && (
            <select className="input text-sm w-44" value={filtros.vendedor_id}
              onChange={e => setFiltros(f => ({ ...f, vendedor_id: e.target.value }))}>
              <option value="">Todos vendedores</option>
              {vendedores.map(v => <option key={v.id} value={v.id}>{v.nome}</option>)}
            </select>
          )}
          <button onClick={load} className="btn-secondary text-sm">Buscar</button>
        </div>
      </div>

      {/* Legenda de edição inline */}
      <p className="text-xs text-gray-400 -mt-2 px-1">
        💡 Clique diretamente em <strong>Status</strong>, <strong>Vendedor</strong> ou <strong>Valor</strong> na tabela para editar sem abrir modal.
      </p>

      {/* Tabela */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-400">Carregando...</div>
        ) : leads.length === 0 ? (
          <div className="text-center py-12 text-gray-400">Nenhum lead encontrado</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-left">
                  <th className="px-4 py-3 font-medium text-gray-500">Nome</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Parcela</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Endereço</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Telefone</th>
                  <th className="px-4 py-3 font-medium text-gray-500">
                    Status
                    <span className="ml-1 text-blue-400 font-normal text-[10px]">✏ editável</span>
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-500">
                    Vendedor
                    {isDono && <span className="ml-1 text-blue-400 font-normal text-[10px]">✏ editável</span>}
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-500">
                    Valor
                    <span className="ml-1 text-blue-400 font-normal text-[10px]">✏ editável</span>
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-500">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {leads.map(lead => {
                  const pode = podeEditar(lead);
                  return (
                    <tr key={lead.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 leading-tight">{lead.nome}</div>
                        {lead.email && <div className="text-xs text-gray-400 mt-0.5">{lead.email}</div>}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-sm">
                        {lead.parcela || <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-sm max-w-[150px]">
                        <span className="block truncate" title={lead.endereco || ''}>
                          {lead.endereco || <span className="text-gray-300">—</span>}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-sm">
                        {lead.telefone || <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <CelulaStatus
                          lead={lead}
                          podeeditar={pode}
                          onAtualizar={atualizarLead}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <CelulaVendedor
                          lead={lead}
                          vendedores={vendedores}
                          isDono={isDono}
                          onAtualizar={atualizarLead}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <CelulaValor
                          lead={lead}
                          podeeditar={pode}
                          onAtualizar={atualizarLead}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {pode && (
                            <button
                              onClick={() => setModalLead(lead)}
                              className="p-1.5 hover:bg-blue-50 text-blue-500 rounded-lg"
                              title="Editar todos os campos"
                            >
                              <Pencil size={14} />
                            </button>
                          )}
                          {isDono && (
                            <button
                              onClick={() => deletarLead(lead.id)}
                              className="p-1.5 hover:bg-red-50 text-red-400 rounded-lg"
                              title="Remover lead"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalLead !== null && (
        <Modal
          title={modalLead.id ? 'Editar Lead' : 'Novo Lead'}
          onClose={() => setModalLead(null)}
        >
          <LeadForm
            lead={modalLead.id ? modalLead : null}
            vendedores={vendedores}
            isDono={isDono}
            onSave={() => { setModalLead(null); load(); }}
            onClose={() => setModalLead(null)}
          />
        </Modal>
      )}
    </div>
  );
}
