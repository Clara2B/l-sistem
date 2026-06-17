import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  TrendingUp, Users, DollarSign, Target, XCircle, PhoneOff, CheckCircle, ArrowUpRight
} from 'lucide-react';

const COLORS = { negociacao: '#f59e0b', nao_atende: '#6b7280', descarte: '#ef4444', venda: '#10b981' };

function MetricCard({ icon: Icon, label, value, sub, accent = false }) {
  return (
    <div className="card flex items-start gap-4" style={accent ? { borderTop: '2px solid #1565F5' } : {}}>
      <div
        className="p-2.5 rounded-xl shrink-0"
        style={accent
          ? { background: 'linear-gradient(135deg, #1565F5, #00D4F5)', color: '#fff' }
          : { background: '#f1f5f9', color: '#64748b' }
        }
      >
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5 truncate">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

const fmt = n => n?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) ?? '—';
const fmtN = n => n?.toLocaleString('pt-BR') ?? '0';

export default function Dashboard() {
  const { isDono } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({ data_inicio: '', data_fim: '', vendedor_id: '' });
  const [vendedores, setVendedores] = useState([]);

  useEffect(() => {
    if (isDono) api.get('/usuarios').then(r => setVendedores(r.data)).catch(() => {});
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filtros).filter(([, v]) => v));
      const { data: d } = await api.get('/dashboard', { params });
      setData(d);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Carregando...</div>;
  if (!data) return null;

  const { resumo } = data;

  const pieData = [
    { name: 'Negociação', value: resumo.negociacao, color: COLORS.negociacao },
    { name: 'Não atende', value: resumo.nao_atende, color: COLORS.nao_atende },
    { name: 'Descarte', value: resumo.descarte, color: COLORS.descarte },
    { name: 'Venda', value: resumo.vendas, color: COLORS.venda },
  ].filter(d => d.value > 0);

  // Agrupa evolução por data
  const evolMap = {};
  data.evolucao.forEach(({ data: dt, status, count }) => {
    if (!evolMap[dt]) evolMap[dt] = { data: dt, negociacao: 0, nao_atende: 0, descarte: 0, venda: 0 };
    evolMap[dt][status] = count;
  });
  const evolucaoData = Object.values(evolMap).slice(-14);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Visão geral da performance</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Data início</label>
            <input type="date" className="input text-sm w-40" value={filtros.data_inicio}
              onChange={e => setFiltros(f => ({ ...f, data_inicio: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Data fim</label>
            <input type="date" className="input text-sm w-40" value={filtros.data_fim}
              onChange={e => setFiltros(f => ({ ...f, data_fim: e.target.value }))} />
          </div>
          {isDono && vendedores.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Vendedor</label>
              <select className="input text-sm w-44" value={filtros.vendedor_id}
                onChange={e => setFiltros(f => ({ ...f, vendedor_id: e.target.value }))}>
                <option value="">Todos</option>
                {vendedores.map(v => <option key={v.id} value={v.id}>{v.nome}</option>)}
              </select>
            </div>
          )}
          <button onClick={load} className="btn-primary text-sm">Filtrar</button>
          <button onClick={() => { setFiltros({ data_inicio: '', data_fim: '', vendedor_id: '' }); setTimeout(load, 0); }} className="btn-secondary text-sm">Limpar</button>
        </div>
      </div>

      {/* Cards principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={Users} label="Total de Leads" value={fmtN(resumo.total_leads)} accent />
        <MetricCard icon={CheckCircle} label="Vendas" value={fmtN(resumo.vendas)} />
        <MetricCard icon={TrendingUp} label="Taxa de Conversão" value={`${resumo.taxa_conversao}%`} />
        <MetricCard icon={DollarSign} label="Total Vendido" value={`R$ ${fmt(resumo.total_vendido)}`} accent />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={Target} label="Negociação" value={fmtN(resumo.negociacao)} />
        <MetricCard icon={PhoneOff} label="Não Atende" value={fmtN(resumo.nao_atende)} />
        <MetricCard icon={XCircle} label="Descarte" value={fmtN(resumo.descarte)} />
        <MetricCard icon={ArrowUpRight} label="Ticket Médio" value={`R$ ${fmt(resumo.ticket_medio)}`} />
      </div>

      {isDono && (
        <div className="grid grid-cols-3 gap-4">
          <MetricCard icon={DollarSign} label="Valor Investido" value={`R$ ${fmt(resumo.valor_investido)}`} />
          <MetricCard icon={Target} label="CPL" value={resumo.cpl > 0 ? `R$ ${fmt(resumo.cpl)}` : '—'} sub="Custo por lead" />
          <MetricCard icon={Target} label="CPV" value={resumo.cpv > 0 ? `R$ ${fmt(resumo.cpv)}` : '—'} sub="Custo por venda" />
        </div>
      )}

      {/* Gráficos */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Distribuição por Status</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v) => [v, 'Leads']} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400 text-sm text-center py-10">Sem dados</p>}
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Leads por Dia (últimos 14 dias)</h3>
          {evolucaoData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={evolucaoData}>
                <XAxis dataKey="data" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="negociacao" name="Negociação" stackId="a" fill={COLORS.negociacao} />
                <Bar dataKey="nao_atende" name="Não atende" stackId="a" fill={COLORS.nao_atende} />
                <Bar dataKey="descarte" name="Descarte" stackId="a" fill={COLORS.descarte} />
                <Bar dataKey="venda" name="Venda" stackId="a" fill={COLORS.venda} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400 text-sm text-center py-10">Sem dados</p>}
        </div>
      </div>
    </div>
  );
}
