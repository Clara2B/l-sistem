import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, X, User, Shield, UserCog } from 'lucide-react';

const TIPO_LABELS = { dono: 'Dono', rh: 'RH', vendedor: 'Vendedor' };
const TIPO_COLORS = {
  dono:    'bg-blue-100 text-blue-700',
  rh:      'bg-green-100 text-green-700',
  vendedor:'bg-gray-100 text-gray-600',
};

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold">{title}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function UsuarioForm({ usuario, onSave, onClose }) {
  const { hasVendas, hasRecrutamento } = useAuth();
  const [form, setForm] = useState({
    nome: usuario?.nome || '',
    email: usuario?.email || '',
    senha: '',
    tipo: usuario?.tipo || 'vendedor',
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.nome || !form.email) return toast.error('Nome e email obrigatórios');
    if (!usuario && !form.senha) return toast.error('Senha obrigatória para novo usuário');
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.senha) delete payload.senha;
      if (usuario) {
        await api.put(`/usuarios/${usuario.id}`, payload);
        toast.success('Usuário atualizado');
      } else {
        await api.post('/usuarios', payload);
        toast.success('Usuário criado');
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
        <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
        <input className="input" value={form.nome} onChange={set('nome')} placeholder="Nome completo" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
        <input type="email" className="input" value={form.email} onChange={set('email')} placeholder="email@empresa.com" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{usuario ? 'Nova senha (deixe em branco para manter)' : 'Senha *'}</label>
        <input type="password" className="input" value={form.senha} onChange={set('senha')} placeholder="Mínimo 6 caracteres" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de acesso</label>
        <select className="input" value={form.tipo} onChange={set('tipo')}>
          <option value="dono">Dono (administrador completo)</option>
          {hasVendas    && <option value="vendedor">Vendedor (acesso a leads e vendas)</option>}
          {hasRecrutamento && <option value="rh">RH (acesso a candidatos e recrutamento)</option>}
        </select>
      </div>
      <div className="flex gap-2 pt-1">
        <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
        <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
      </div>
    </form>
  );
}

export default function Usuarios() {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get('/usuarios');
      setUsuarios(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function deletar(id) {
    if (!confirm('Remover este usuário?')) return;
    try {
      await api.delete(`/usuarios/${id}`);
      toast.success('Usuário removido');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao remover');
    }
  }

  const TipoIcon = ({ tipo }) => {
    if (tipo === 'dono') return <Shield size={18} />;
    if (tipo === 'rh') return <UserCog size={18} />;
    return <User size={18} />;
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gerencie os membros da sua equipe</p>
        </div>
        <button onClick={() => setModal({})} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Novo Usuário
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : (
        <div className="space-y-2">
          {usuarios.map(u => (
            <div key={u.id} className="card flex items-center justify-between gap-3 p-3 sm:p-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${u.tipo === 'dono' ? 'bg-blue-100 text-blue-600' : u.tipo === 'rh' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                  <TipoIcon tipo={u.tipo} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900 text-sm truncate">{u.nome}</span>
                    {u.id === user.id && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded shrink-0">você</span>}
                  </div>
                  <p className="text-xs text-gray-400 truncate">{u.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`hidden sm:inline text-xs px-2.5 py-1 rounded-full font-medium ${TIPO_COLORS[u.tipo]}`}>
                  {TIPO_LABELS[u.tipo]}
                </span>
                <div className="flex gap-1">
                  <button onClick={() => setModal(u)} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg"><Pencil size={15} /></button>
                  {u.id !== user.id && (
                    <button onClick={() => deletar(u.id)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg"><Trash2 size={15} /></button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal !== null && (
        <Modal title={modal.id ? 'Editar Usuário' : 'Novo Usuário'} onClose={() => setModal(null)}>
          <UsuarioForm usuario={modal.id ? modal : null} onSave={() => { setModal(null); load(); }} onClose={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}
