import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  TrendingUp, Users, DollarSign, Target, XCircle, PhoneOff, CheckCircle, ArrowUpRight
} from 'lucide-react';

const COLORS = { negociacao: '#f59e0b', nao_atende: '#6b7280', descarte: '#ef4444', venda: '#10b981' };

function MetricCard({ icon: Icon, label, value, sub, accent = false }) {
  return (
    <div className="card flex items-start gap-3" style={accent ? { borderTop: '2px solid #1565F5' } : {}}>
      <div
        className="p-2 rounded-xl shrink-0 mt-0.5"
        style={accent
          ? { background: 'linear-gradient(135deg, #1565F5, #00D4F5)', color: '#fff' }
          : { background: '#f1f5f9', color: '#64748b' }
        }
      >
        <Icon size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide leading-tight">{label}</p>
        <p className="text-lg sm:text-xl font-bold text-gray-900 mt-0.5 break-words leading-tight">{value}</p>
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

  const evolMap = {};
  data.evolucao.forEach(({ data: dt, status, count }) => {
    if (!evolMap[dt]) evolMap[dt] = { data: dt, negociacao: 0, nao_atende: 0, descarte: 0, venda: 0 };
    evolMap[dt][status] = count;
  });
  const evolucaoData = Object.values(evolMap).slice(-14);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Visão geral da performance</p>
      </div>

      {/* Filtros */}
      <div className="card p-3 md:p-4">
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:items-end">
          <div className="flex gap-3 flex-1 min-w-0">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">Data início</label>
              <input type="date" className="input text-sm w-full" value={filtros.data_inicio}
                onChange={e => setFiltros(f => ({ ...f, data_inicio: e.target.value }))} />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">Data fim</label>
              <input type="date" className="input text-sm w-full" value={filtros.data_fim}
                onChange={e => setFiltros(f => ({ ...f, data_fim: e.target.value }))} />
            </div>
          </div>
          {isDono && vendedores.length > 0 && (
            <div className="sm:w-44">
              <label className="block text-xs font-medium text-gray-500 mb-1">Vendedor</label>
              <select className="input text-sm w-full" value={filtros.vendedor_id}
                onChange={e => setFiltros(f => ({ ...f, vendedor_id: e.target.value }))}>
                <option value="">Todos</option>
                {vendedores.map(v => <option key={v.id} value={v.id}>{v.nome}</option>)}
              </select>
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={load} className="btn-primary text-sm flex-1 sm:flex-none">Filtrar</button>
            <button onClick={() => { setFiltros({ data_inicio: '', data_fim: '', vendedor_id: '' }); setTimeout(load, 0); }} className="btn-secondary text-sm flex-1 sm:flex-none">Limpar</button>
          </div>
        </div>
      </div>

      {/* Cards principais — 2 cols mobile, 4 cols desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard icon={Users} label="Total de Leads" value={fmtN(resumo.total_leads)} accent />
        <MetricCard icon={CheckCircle} label="Vendas" value={fmtN(resumo.vendas)} />
        <MetricCard icon={TrendingUp} label="Conversão" value={`${resumo.taxa_conversao}%`} />
        <MetricCard icon={DollarSign} label="Total Vendido" value={`R$ ${fmt(resumo.total_vendido)}`} accent />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard icon={Target} label="Negociação" value={fmtN(resumo.negociacao)} />
        <MetricCard icon={PhoneOff} label="Não Atende" value={fmtN(resumo.nao_atende)} />
        <MetricCard icon={XCircle} label="Descarte" value={fmtN(resumo.descarte)} />
        <MetricCard icon={ArrowUpRight} label="Ticket Médio" value={`R$ ${fmt(resumo.ticket_medio)}`} />
      </div>

      {/* CPL / CPV / Investido */}
      {isDono && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <MetricCard icon={DollarSign} label="Valor Investido" value={`R$ ${fmt(resumo.valor_investido)}`} />
            <MetricCard icon={Target} label="CPL" value={resumo.cpl > 0 ? `R$ ${fmt(resumo.cpl)}` : '—'} sub="Custo por lead" />
            <MetricCard icon={Target} label="CPV" value={resumo.cpv > 0 ? `R$ ${fmt(resumo.cpv)}` : '—'} sub="Custo por venda" />
          </div>

          {/* Imposto da Meta */}
          {(
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold uppercase tracking-wide text-amber-600">Imposto da Meta (12,75%)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-xl bg-gray-50">
                  <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-1">CPL sem imposto</p>
                  <p className="text-lg font-bold text-gray-900">{resumo.cpl > 0 ? `R$ ${fmt(resumo.cpl)}` : '—'}</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-amber-50">
                  <p className="text-[11px] text-amber-600 uppercase tracking-wide mb-1">Imposto (12,75%)</p>
                  <p className="text-lg font-bold text-amber-700">{resumo.cpl > 0 ? `R$ ${fmt(+(resumo.cpl * 0.1275).toFixed(2))}` : '—'}</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-red-50">
                  <p className="text-[11px] text-red-500 uppercase tracking-wide mb-1">CPL com imposto</p>
                  <p className="text-lg font-bold text-red-600">{resumo.cpl > 0 ? `R$ ${fmt(+(resumo.cpl * 1.1275).toFixed(2))}` : '—'}</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Gráficos */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4 text-sm sm:text-base">Distribuição por Status</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%" cy="50%"
                  outerRadius={70}
                  dataKey="value"
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v, name) => [v, name]} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400 text-sm text-center py-10">Sem dados</p>}
          {/* Legenda manual para caber no mobile */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 justify-center">
            {pieData.map(d => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                {d.name}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4 text-sm sm:text-base">Leads por Dia (últimos 14 dias)</h3>
          {evolucaoData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={evolucaoData} margin={{ left: -20 }}>
                <XAxis dataKey="data" tick={{ fontSize: 9 }} tickFormatter={v => v.slice(5)} />
                <YAxis tick={{ fontSize: 9 }} width={30} />
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
