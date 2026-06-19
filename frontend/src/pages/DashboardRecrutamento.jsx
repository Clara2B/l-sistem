import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Users, DollarSign, TrendingUp, Wallet, MessageCircle, Link2 } from 'lucide-react';

const fmt = n => (n ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
const fmtN = n => (n ?? 0).toLocaleString('pt-BR');

const STATUS_INFO = {
  novo_contato: { label: 'Novo Contato',  color: 'bg-sky-100 text-sky-800',        bar: '#0ea5e9' },
  em_analise:   { label: 'Em Análise',    color: 'bg-amber-100 text-amber-800',     bar: '#f59e0b' },
  entrevistado: { label: 'Entrevistado',  color: 'bg-purple-100 text-purple-800',   bar: '#a855f7' },
  aprovado:     { label: 'Aprovado',      color: 'bg-emerald-100 text-emerald-800', bar: '#10b981' },
  reprovado:    { label: 'Reprovado',     color: 'bg-red-100 text-red-700',         bar: '#ef4444' },
};

function MetricCard({ icon: Icon, label, value, sub, accent, color }) {
  return (
    <div className="card flex items-start gap-3" style={accent ? { borderTop: `2px solid ${color || '#1565F5'}` } : {}}>
      <div className="p-2 rounded-xl shrink-0 mt-0.5"
        style={accent
          ? { background: color ? `${color}22` : 'linear-gradient(135deg,#1565F5,#00D4F5)', color: color || '#fff' }
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

export default function DashboardRecrutamento() {
  const { isDono } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/recrutamento/dashboard')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Carregando...</div>;
  if (!data) return null;

  const { config, resumo, funil, projecoes } = data;
  const totalFunil = (funil.whatsapp || 0) + (funil.linkedin || 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard Recrutamento</h1>
        <p className="text-sm text-gray-500 mt-0.5">Visão geral do processo seletivo</p>
      </div>

      {/* Cards principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard icon={Users} label="Total Candidatos" value={fmtN(resumo.total_candidatos)} accent color="#1565F5" />
        <MetricCard icon={TrendingUp} label="Aprovados" value={fmtN(resumo.aprovado)} />
        <MetricCard icon={DollarSign} label="Custo por Conversa" value={resumo.custo_por_conversa > 0 ? `R$ ${fmt(resumo.custo_por_conversa)}` : '—'} />
        <MetricCard icon={Wallet} label="Saldo" value={`R$ ${fmt(config.saldo)}`} sub={`de R$ ${fmt(config.budget)}`} />
      </div>

      {/* Budget — barra de progresso */}
      {isDono && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 text-sm">Utilização do Budget</h3>
            <span className="text-sm font-bold text-blue-600">{config.utilizacao_pct}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
            <div
              className="h-3 rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(config.utilizacao_pct, 100)}%`,
                background: config.utilizacao_pct > 90
                  ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                  : config.utilizacao_pct > 70
                    ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                    : 'linear-gradient(90deg, #1565F5, #00D4F5)'
              }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>R$ {fmt(config.verba_utilizada)} utilizado</span>
            <span>R$ {fmt(config.budget)} total</span>
          </div>
        </div>
      )}

      {/* Funil por status */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4 text-sm sm:text-base">Funil de Candidatos</h3>
        <div className="space-y-3">
          {Object.entries(STATUS_INFO).map(([key, info]) => {
            const count = resumo[key] || 0;
            const pct = resumo.total_candidatos > 0 ? (count / resumo.total_candidatos) * 100 : 0;
            return (
              <div key={key} className="flex items-center gap-3">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 w-28 text-center ${info.color}`}>
                  {info.label}
                </span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: info.bar }} />
                </div>
                <span className="text-sm font-bold text-gray-700 w-6 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Funil por canal */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4 text-sm sm:text-base">Candidatos por Canal</h3>
          <div className="space-y-3">
            {[
              { key: 'whatsapp', label: 'WhatsApp', Icon: MessageCircle, color: '#25d366', bg: 'bg-green-50 text-green-700' },
              { key: 'linkedin', label: 'LinkedIn', Icon: Link2, color: '#0077b5', bg: 'bg-blue-50 text-blue-700' },
            ].map(({ key, label, Icon, color, bg }) => {
              const count = funil[key] || 0;
              const pct = totalFunil > 0 ? (count / totalFunil) * 100 : 0;
              return (
                <div key={key} className="flex items-center gap-3">
                  <div className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-lg shrink-0 w-28 ${bg}`}>
                    <Icon size={12} /> {label}
                  </div>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: color }} />
                  </div>
                  <span className="text-sm font-bold text-gray-700 w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Projeções */}
        {isDono && (
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4 text-sm sm:text-base">Projeções de Candidatos</h3>
            {resumo.custo_por_conversa > 0 ? (
              <div className="space-y-3">
                {[
                  { label: 'Projeção 1', valor: config.projecao_1, candidatos: projecoes.p1_candidatos },
                  { label: 'Projeção 2', valor: config.projecao_2, candidatos: projecoes.p2_candidatos },
                  { label: 'Projeção 3', valor: config.projecao_3, candidatos: projecoes.p3_candidatos },
                ].map(({ label, valor, candidatos }) => (
                  <div key={label} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                    <div>
                      <p className="text-xs text-gray-500">{label}</p>
                      <p className="text-sm font-bold text-gray-900">R$ {fmt(valor)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Estimativa</p>
                      <p className="text-lg font-bold text-blue-600">{fmtN(candidatos)} cand.</p>
                    </div>
                  </div>
                ))}
                <p className="text-xs text-gray-400 text-center">Custo atual: R$ {fmt(resumo.custo_por_conversa)}/conversa</p>
              </div>
            ) : (
              <p className="text-gray-400 text-sm text-center py-4">
                Configure o budget e verba utilizada nas Configurações para ver as projeções.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
