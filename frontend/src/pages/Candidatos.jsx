import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Trash2, ChevronDown } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'novo_contato',  label: 'Novo Contato',  color: 'bg-sky-100 text-sky-800' },
  { value: 'em_analise',    label: 'Em Análise',    color: 'bg-amber-100 text-amber-800' },
  { value: 'entrevistado',  label: 'Entrevistado',  color: 'bg-purple-100 text-purple-800' },
  { value: 'aprovado',      label: 'Aprovado',      color: 'bg-emerald-100 text-emerald-800' },
  { value: 'reprovado',     label: 'Reprovado',     color: 'bg-red-100 text-red-700' },
];

const CANAL_OPTIONS = [
  { value: 'whatsapp', label: 'WhatsApp', color: 'bg-green-100 text-green-700' },
  { value: 'linkedin', label: 'LinkedIn', color: 'bg-blue-100 text-blue-700' },
];

function getStatusInfo(v) { return STATUS_OPTIONS.find(s => s.value === v) || STATUS_OPTIONS[0]; }
function getCanalInfo(v)  { return CANAL_OPTIONS.find(c => c.value === v) || CANAL_OPTIONS[0]; }

function DropdownPortal({ trigger, children, isOpen, onClose }) {
  const [pos, setPos] = useState({ top: 0, left: 0, width: 120 });
  const triggerRef = useRef(null);

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX, width: Math.max(rect.width, 150) });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const close = e => { if (!triggerRef.current?.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [isOpen, onClose]);

  return (
    <>
      <div ref={triggerRef}>{trigger}</div>
      {isOpen && createPortal(
        <div className="fixed z-[9999] bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden"
          style={{ top: pos.top, left: pos.left, minWidth: pos.width }}>
          {children}
        </div>,
        document.body
      )}
    </>
  );
}

function CelulaStatus({ candidato, onChange }) {
  const [open, setOpen] = useState(false);
  const info = getStatusInfo(candidato.status);
  return (
    <DropdownPortal
      isOpen={open}
      onClose={() => setOpen(false)}
      trigger={
        <button onClick={() => setOpen(o => !o)}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold cursor-pointer ${info.color}`}>
          {info.label}<ChevronDown size={10} />
        </button>
      }
    >
      {STATUS_OPTIONS.map(s => (
        <button key={s.value}
          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
          onClick={() => { onChange(candidato.id, 'status', s.value); setOpen(false); }}>
          <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${s.color}`}>{s.label}</span>
        </button>
      ))}
    </DropdownPortal>
  );
}

function CelulaCanal({ candidato, onChange }) {
  const [open, setOpen] = useState(false);
  const info = getCanalInfo(candidato.canal);
  return (
    <DropdownPortal
      isOpen={open}
      onClose={() => setOpen(false)}
      trigger={
        <button onClick={() => setOpen(o => !o)}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold cursor-pointer ${info.color}`}>
          {info.label}<ChevronDown size={10} />
        </button>
      }
    >
      {CANAL_OPTIONS.map(c => (
        <button key={c.value}
          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
          onClick={() => { onChange(candidato.id, 'canal', c.value); setOpen(false); }}>
          <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${c.color}`}>{c.label}</span>
        </button>
      ))}
    </DropdownPortal>
  );
}

export default function Candidatos() {
  const { isDono } = useAuth();
  const [candidatos, setCandidatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({ status: '', canal: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filtros).filter(([, v]) => v));
      const { data } = await api.get('/candidatos', { params });
      setCandidatos(data);
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  useEffect(() => { load(); }, []);

  async function patch(id, campo, valor) {
    try {
      await api.patch(`/candidatos/${id}`, { [campo]: valor });
      setCandidatos(cs => cs.map(c => c.id === id ? { ...c, [campo]: valor } : c));
    } catch {
      toast.error('Erro ao atualizar');
    }
  }

  async function remover(id) {
    if (!confirm('Remover este candidato?')) return;
    try {
      await api.delete(`/candidatos/${id}`);
      toast.success('Candidato removido');
      setCandidatos(cs => cs.filter(c => c.id !== id));
    } catch {
      toast.error('Erro ao remover');
    }
  }

  const counts = STATUS_OPTIONS.reduce((acc, s) => {
    acc[s.value] = candidatos.filter(c => c.status === s.value).length;
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Candidatos</h1>
        <p className="text-sm text-gray-500 mt-0.5">Gerencie os candidatos do processo seletivo</p>
      </div>

      {/* Resumo por status */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {STATUS_OPTIONS.map(s => (
          <div key={s.value} className="card p-3 text-center">
            <p className="text-lg font-bold text-gray-900">{counts[s.value] || 0}</p>
            <p className={`text-xs font-semibold px-1.5 py-0.5 rounded-full mt-1 ${s.color}`}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="card p-3 md:p-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="flex gap-3 flex-1">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
              <select className="input text-sm w-full" value={filtros.status}
                onChange={e => setFiltros(f => ({ ...f, status: e.target.value }))}>
                <option value="">Todos</option>
                {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">Canal</label>
              <select className="input text-sm w-full" value={filtros.canal}
                onChange={e => setFiltros(f => ({ ...f, canal: e.target.value }))}>
                <option value="">Todos</option>
                {CANAL_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="btn-primary text-sm flex-1 sm:flex-none">Filtrar</button>
            <button onClick={() => { setFiltros({ status: '', canal: '' }); setTimeout(load, 0); }} className="btn-secondary text-sm flex-1 sm:flex-none">Limpar</button>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: 600 }}>
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs">Nome</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs">Cargo</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs">Telefone</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs">Canal</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs">Status</th>
                {isDono && <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Carregando...</td></tr>
              ) : candidatos.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Nenhum candidato encontrado</td></tr>
              ) : candidatos.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium text-gray-900">{c.nome}</td>
                  <td className="px-4 py-2.5 text-gray-500 text-xs">{c.cargo || '—'}</td>
                  <td className="px-4 py-2.5 text-gray-500 text-xs">{c.telefone || '—'}</td>
                  <td className="px-4 py-2.5"><CelulaCanal candidato={c} onChange={patch} /></td>
                  <td className="px-4 py-2.5"><CelulaStatus candidato={c} onChange={patch} /></td>
                  {isDono && (
                    <td className="px-4 py-2.5">
                      <button onClick={() => remover(c.id)} className="p-1 hover:bg-red-50 text-red-400 rounded-lg">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-400 text-right">{candidatos.length} candidato{candidatos.length !== 1 ? 's' : ''}</p>
    </div>
  );
}
