import { useState, useRef } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, X } from 'lucide-react';
import { useEffect } from 'react';

const STATUS_LABELS = { negociacao: 'Negociação', nao_atende: 'Não Atende', descarte: 'Descarte', venda: 'Venda' };

export default function Importacao() {
  const [step, setStep] = useState('upload'); // upload | preview | done
  const [preview, setPreview] = useState(null);
  const [arquivo, setArquivo] = useState(null);
  const [vendedorId, setVendedorId] = useState('');
  const [vendedores, setVendedores] = useState([]);
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef();

  useEffect(() => {
    api.get('/usuarios').then(r => setVendedores(r.data)).catch(() => {});
  }, []);

  async function handleFile(file) {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext)) return toast.error('Use .xlsx, .xls ou .csv');

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('planilha', file);
      const { data } = await api.post('/importar/preview', fd);
      setPreview(data);
      setArquivo(data.arquivo);
      setStep('preview');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao ler planilha');
    } finally {
      setLoading(false);
    }
  }

  async function confirmar() {
    setLoading(true);
    try {
      const { data } = await api.post('/importar/confirmar', { arquivo, vendedor_id: vendedorId || undefined });
      setResultado(data);
      setStep('done');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro na importação');
    } finally {
      setLoading(false);
    }
  }

  function resetar() {
    setStep('upload');
    setPreview(null);
    setArquivo(null);
    setResultado(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Importar Leads</h1>
        <p className="text-sm text-gray-500 mt-0.5">Faça upload de uma planilha para importar leads em massa</p>
      </div>

      {/* Progresso */}
      <div className="flex items-center gap-3">
        {['upload', 'preview', 'done'].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              step === s ? 'bg-blue-600 text-white' : (['preview', 'done'].includes(step) && i === 0) || (step === 'done' && i === 1) ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
            }`}>{i + 1}</div>
            <span className="text-sm text-gray-600">{['Upload', 'Pré-visualizar', 'Concluído'][i]}</span>
            {i < 2 && <div className="w-8 h-px bg-gray-200" />}
          </div>
        ))}
      </div>

      {step === 'upload' && (
        <div className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors cursor-pointer ${dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
            onClick={() => inputRef.current?.click()}
          >
            <FileSpreadsheet size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600 font-medium">Arraste sua planilha aqui ou clique para selecionar</p>
            <p className="text-sm text-gray-400 mt-1">Formatos aceitos: .xlsx, .xls, .csv — máximo 10MB</p>
            <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
              onChange={e => handleFile(e.target.files[0])} />
          </div>

          <div className="card bg-blue-50 border-blue-100">
            <h3 className="font-medium text-blue-900 mb-2 text-sm">Colunas reconhecidas automaticamente:</h3>
            <div className="flex flex-wrap gap-2">
              {['Nome', 'Parcela', 'Endereço', 'Email', 'Telefone / Celular / WhatsApp'].map(c => (
                <span key={c} className="bg-white text-blue-700 text-xs px-2 py-1 rounded-lg border border-blue-200">{c}</span>
              ))}
            </div>
          </div>

          {loading && <p className="text-center text-blue-600 text-sm">Lendo planilha...</p>}
        </div>
      )}

      {step === 'preview' && preview && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 text-green-600 rounded-lg"><FileSpreadsheet size={20} /></div>
              <div>
                <p className="font-medium text-gray-900">Planilha carregada</p>
                <p className="text-sm text-gray-500">{preview.total} registros encontrados</p>
              </div>
            </div>
            <button onClick={resetar} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><X size={18} /></button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Atribuir a um vendedor (opcional)</label>
            <select className="input max-w-xs" value={vendedorId} onChange={e => setVendedorId(e.target.value)}>
              <option value="">Sem vendedor atribuído</option>
              {vendedores.map(v => <option key={v.id} value={v.id}>{v.nome}</option>)}
            </select>
          </div>

          <div className="card p-0 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 text-sm font-medium text-gray-500">
              Pré-visualização (primeiros 5 registros)
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Nome', 'Telefone', 'Email', 'Parcela', 'Endereço'].map(h => (
                      <th key={h} className="px-4 py-2 text-left font-medium text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {preview.preview.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium">{row.nome || '—'}</td>
                      <td className="px-4 py-2 text-gray-500">{row.telefone || '—'}</td>
                      <td className="px-4 py-2 text-gray-500">{row.email || '—'}</td>
                      <td className="px-4 py-2 text-gray-500">{row.parcela || '—'}</td>
                      <td className="px-4 py-2 text-gray-500">{row.endereco || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={confirmar} className="btn-primary flex items-center gap-2" disabled={loading}>
              {loading ? 'Importando...' : <><Upload size={16} /> Confirmar Importação ({preview.total} leads)</>}
            </button>
            <button onClick={resetar} className="btn-secondary">Cancelar</button>
          </div>
        </div>
      )}

      {step === 'done' && resultado && (
        <div className="card text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mx-auto">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Importação concluída!</h2>
            <p className="text-gray-500 mt-1">{resultado.message}</p>
          </div>
          <div className="flex justify-center gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{resultado.importados}</p>
              <p className="text-sm text-gray-500">importados</p>
            </div>
            {resultado.erros > 0 && (
              <div className="text-center">
                <p className="text-3xl font-bold text-red-500">{resultado.erros}</p>
                <p className="text-sm text-gray-500">com erro</p>
              </div>
            )}
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <button onClick={resetar} className="btn-secondary">Nova importação</button>
            <a href="/leads" className="btn-primary">Ver leads</a>
          </div>
        </div>
      )}
    </div>
  );
}
