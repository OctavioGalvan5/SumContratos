// @ts-nocheck
import { useState, useEffect } from 'react';
import axios from 'axios';
import { format, differenceInDays } from 'date-fns';
import { Download, Search, Lock, Unlock, EyeOff, Pencil, X, Save, ArrowUp, ArrowDown, ArrowUpDown, UploadCloud, Trash2 } from 'lucide-react';

export default function ContratosList() {
  const [contratos, setContratos]         = useState([]);
  const [categorias, setCategorias]       = useState([]);
  const [search, setSearch]               = useState('');
  const [filtroCat, setFiltroCat]         = useState('');
  const [mostrarBloqueados, setMostrarBloqueados] = useState(false);
  const [sortField, setSortField]         = useState('fecha_vencimiento');
  const [sortDir, setSortDir]             = useState('asc');

  // Edit
  const [editando, setEditando]   = useState(null); // contract id
  const [editForm, setEditForm]   = useState({});
  const [editNewFile, setEditNewFile]     = useState(null);
  const [editClearFile, setEditClearFile] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    fetchContratos();
    fetchCategorias();
  }, []);

  const fetchContratos = async () => {
    try { setContratos((await axios.get('/api/contratos/')).data); }
    catch (e) { console.error(e); }
  };
  const fetchCategorias = async () => {
    try { setCategorias((await axios.get('/api/categorias/')).data); }
    catch (e) { console.error(e); }
  };

  const handleDownload = async (id) => {
    try { window.open((await axios.get(`/api/contratos/${id}/archivo`)).data.url, '_blank'); }
    catch { alert("No se pudo obtener el archivo o no existe."); }
  };

  const handleToggleBloqueo = async (id) => {
    try { await axios.put(`/api/contratos/${id}/toggle-bloqueo`); fetchContratos(); }
    catch { alert("No se pudo cambiar el estado del contrato."); }
  };

  // ── Sort helpers ──────────────────────────────────────────────
  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };
  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5 ml-1 opacity-40" />;
    return sortDir === 'asc'
      ? <ArrowUp className="w-3.5 h-3.5 ml-1 text-primary-600" />
      : <ArrowDown className="w-3.5 h-3.5 ml-1 text-primary-600" />;
  };

  // ── Edit helpers ──────────────────────────────────────────────
  const contratoEditando = contratos.find(c => c.id === editando);

  const abrirEdicion = (c) => {
    setEditando(c.id);
    setEditForm({
      titular: c.titular,
      categoria_id: c.categoria_id || '',
      fecha_inicio: c.fecha_inicio,
      fecha_vencimiento: c.fecha_vencimiento,
      observaciones: c.observaciones || '',
      dias_aviso_alarma: c.dias_aviso_alarma,
    });
    setEditNewFile(null);
    setEditClearFile(false);
  };

  const handleEditChange = (e) => setEditForm({ ...editForm, [e.target.name]: e.target.value });

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const data = new FormData();
      data.append('titular', editForm.titular);
      data.append('categoria_id', editForm.categoria_id || '');
      data.append('fecha_inicio', editForm.fecha_inicio);
      data.append('fecha_vencimiento', editForm.fecha_vencimiento);
      data.append('observaciones', editForm.observaciones || '');
      data.append('dias_aviso_alarma', String(editForm.dias_aviso_alarma));
      if (editClearFile) data.append('clear_file', 'true');
      if (editNewFile)   data.append('file', editNewFile);
      await axios.put(`/api/contratos/${editando}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      setEditando(null);
      fetchContratos();
    } catch { alert("Error al guardar los cambios."); }
    finally { setGuardando(false); }
  };

  // ── Estado / badge ────────────────────────────────────────────
  const getEstado = (c) => {
    if (c.bloqueado) return 'Deshabilitado';
    const fVenc = new Date(c.fecha_vencimiento);
    const hoy   = new Date();
    if (c.estado === 'Vencido' || fVenc < hoy) return 'Vencido';
    if (differenceInDays(fVenc, hoy) <= c.dias_aviso_alarma) return 'Por vencer';
    return 'Activo';
  };
  const estadoBadge = (e) => ({
    'Activo':        'bg-green-100 text-green-700',
    'Por vencer':    'bg-amber-100 text-amber-700',
    'Vencido':       'bg-red-100 text-red-700',
    'Deshabilitado': 'bg-gray-100 text-gray-500',
  }[e] ?? '');

  // ── Filter + sort ─────────────────────────────────────────────
  const bloqueadosCount = contratos.filter(c => c.bloqueado).length;

  const filtered = contratos
    .filter(c => {
      if (c.bloqueado && !mostrarBloqueados) return false;
      if (filtroCat && c.categoria?.id !== filtroCat) return false;
      const q = search.toLowerCase();
      return c.titular.toLowerCase().includes(q) || (c.categoria?.nombre ?? '').toLowerCase().includes(q);
    })
    .sort((a, b) => {
      const da = new Date(a[sortField]), db2 = new Date(b[sortField]);
      return sortDir === 'asc' ? da - db2 : db2 - da;
    });

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* ── Toolbar ── */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-2xl font-bold text-gray-800">Lista de Contratos</h2>
          {/* Search */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text" placeholder="Buscar por nombre..."
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 w-full text-sm"
              value={search} onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category filter */}
          <select
            value={filtroCat} onChange={e => setFiltroCat(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-600"
          >
            <option value="">Todas las categorías</option>
            {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>

          {/* Sort — mobile dropdown */}
          <select
            className="md:hidden px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-600"
            value={`${sortField}_${sortDir}`}
            onChange={e => { const [f, d] = e.target.value.split('_'); setSortField(f); setSortDir(d); }}
          >
            <option value="fecha_vencimiento_asc">Vencimiento ↑</option>
            <option value="fecha_vencimiento_desc">Vencimiento ↓</option>
            <option value="fecha_inicio_asc">Inicio ↑</option>
            <option value="fecha_inicio_desc">Inicio ↓</option>
          </select>

          {/* Show hidden */}
          {bloqueadosCount > 0 && (
            <button
              onClick={() => setMostrarBloqueados(!mostrarBloqueados)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors
                ${mostrarBloqueados ? 'bg-gray-100 border-gray-300 text-gray-700' : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'}`}
            >
              <EyeOff className="w-4 h-4" />
              {mostrarBloqueados ? 'Ocultar deshabl.' : `Deshabl. (${bloqueadosCount})`}
            </button>
          )}

          <span className="text-xs text-gray-400 ml-auto">{filtered.length} contrato{filtered.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* ── Mobile cards ── */}
      <div className="md:hidden space-y-3">
        {filtered.map(c => {
          const estado = getEstado(c);
          return (
            <div key={c.id} className={`bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-3 ${c.bloqueado ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{c.titular}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{c.categoria?.nombre || 'Sin categoría'}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${estadoBadge(estado)}`}>{estado}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Inicio: <b className="text-gray-700">{format(new Date(c.fecha_inicio), 'dd/MM/yyyy')}</b></span>
                <span>Vence: <b className={estado === 'Vencido' ? 'text-red-600' : estado === 'Por vencer' ? 'text-amber-600' : 'text-gray-700'}>{format(new Date(c.fecha_vencimiento), 'dd/MM/yyyy')}</b></span>
              </div>
              <div className="flex justify-end gap-3 pt-1 border-t border-gray-100 flex-wrap">
                {c.archivo_path
                  ? <button onClick={() => handleDownload(c.id)} className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-800"><Download className="w-4 h-4" />Archivo</button>
                  : <span className="text-xs text-gray-300">Sin archivo</span>}
                <button onClick={() => abrirEdicion(c)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600"><Pencil className="w-4 h-4" />Editar</button>
                <button onClick={() => handleToggleBloqueo(c.id)} className={`flex items-center gap-1 text-sm ${c.bloqueado ? 'text-gray-400 hover:text-green-600' : 'text-gray-400 hover:text-red-600'}`}>
                  {c.bloqueado ? <><Unlock className="w-4 h-4" />Habilitar</> : <><Lock className="w-4 h-4" />Deshabilitar</>}
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <div className="bg-white rounded-xl border border-gray-100 px-6 py-8 text-center text-gray-500">No se encontraron contratos.</div>}
      </div>

      {/* ── Desktop table ── */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-medium">Titular / Contraparte</th>
              <th className="px-6 py-4 font-medium">Categoría</th>
              <th className="px-6 py-4 font-medium cursor-pointer select-none hover:text-gray-700" onClick={() => toggleSort('fecha_inicio')}>
                <span className="inline-flex items-center">F. Inicio <SortIcon field="fecha_inicio" /></span>
              </th>
              <th className="px-6 py-4 font-medium cursor-pointer select-none hover:text-gray-700" onClick={() => toggleSort('fecha_vencimiento')}>
                <span className="inline-flex items-center">F. Vencimiento <SortIcon field="fecha_vencimiento" /></span>
              </th>
              <th className="px-6 py-4 font-medium">Estado</th>
              <th className="px-6 py-4 font-medium text-center">Archivo</th>
              <th className="px-6 py-4 font-medium text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(c => {
              const estado = getEstado(c);
              return (
                <tr key={c.id} className={`hover:bg-gray-50/50 transition-colors ${c.bloqueado ? 'opacity-50' : ''}`}>
                  <td className="px-6 py-4 font-medium text-gray-900">{c.titular}</td>
                  <td className="px-6 py-4 text-gray-500 text-sm">{c.categoria?.nombre || '-'}</td>
                  <td className="px-6 py-4 text-gray-500 text-sm">{format(new Date(c.fecha_inicio), 'dd/MM/yyyy')}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={estado === 'Vencido' ? 'text-red-600 font-medium' : estado === 'Por vencer' ? 'text-amber-600 font-medium' : 'text-gray-500'}>
                      {format(new Date(c.fecha_vencimiento), 'dd/MM/yyyy')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${estadoBadge(estado)}`}>{estado}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {c.archivo_path
                      ? <button onClick={() => handleDownload(c.id)} className="text-primary-600 hover:text-primary-800 transition-colors inline-flex items-center" title="Descargar"><Download className="w-5 h-5" /></button>
                      : <span className="text-gray-300 text-sm">-</span>}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => abrirEdicion(c)} className="text-gray-400 hover:text-primary-600 transition-colors" title="Editar"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleToggleBloqueo(c.id)} className={`transition-colors ${c.bloqueado ? 'text-gray-400 hover:text-green-600' : 'text-gray-400 hover:text-red-600'}`} title={c.bloqueado ? 'Habilitar' : 'Deshabilitar'}>
                        {c.bloqueado ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan="7" className="px-6 py-8 text-center text-gray-500">No se encontraron contratos.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Edit modal ── */}
      {editando && contratoEditando && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">Editar Contrato</h3>
              <button onClick={() => setEditando(null)} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-5">
              {/* Titular */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Titular / Contraparte *</label>
                <input type="text" name="titular" required value={editForm.titular} onChange={handleEditChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              {/* Categoría */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Categoría</label>
                <select name="categoria_id" value={editForm.categoria_id} onChange={handleEditChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
                  <option value="">-- Sin categoría --</option>
                  {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              {/* Fechas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">Fecha de Inicio *</label>
                  <input type="date" name="fecha_inicio" required value={editForm.fecha_inicio} onChange={handleEditChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">Fecha de Vencimiento *</label>
                  <input type="date" name="fecha_vencimiento" required value={editForm.fecha_vencimiento} onChange={handleEditChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>
              {/* Días aviso */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Días de aviso antes del vencimiento</label>
                <input type="number" name="dias_aviso_alarma" min="1" required value={editForm.dias_aviso_alarma} onChange={handleEditChange}
                  className="w-28 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              {/* Observaciones */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Observaciones</label>
                <textarea name="observaciones" rows="3" value={editForm.observaciones} onChange={handleEditChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Detalles adicionales..." />
              </div>
              {/* Archivo */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Archivo del contrato</label>
                {contratoEditando.archivo_path && !editClearFile && !editNewFile && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <span className="text-sm text-gray-600 truncate">{contratoEditando.archivo_path}</span>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <button type="button" onClick={() => handleDownload(contratoEditando.id)}
                        className="text-primary-600 hover:text-primary-800 transition-colors" title="Descargar actual">
                        <Download className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => setEditClearFile(true)}
                        className="text-red-400 hover:text-red-600 transition-colors" title="Quitar archivo">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
                {editClearFile && (
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                    <span className="text-sm text-red-600">El archivo será eliminado al guardar.</span>
                    <button type="button" onClick={() => setEditClearFile(false)} className="text-xs text-gray-500 hover:text-gray-700 underline">Deshacer</button>
                  </div>
                )}
                {!editClearFile && (
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-200 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <UploadCloud className="w-6 h-6 text-gray-400" />
                      <p className="text-sm text-gray-500">
                        {editNewFile ? editNewFile.name : (contratoEditando.archivo_path ? 'Reemplazar archivo' : 'Subir archivo')}
                      </p>
                    </div>
                    <input type="file" className="hidden" onChange={e => { if (e.target.files[0]) setEditNewFile(e.target.files[0]); }} />
                  </label>
                )}
                {editNewFile && (
                  <div className="flex items-center justify-between p-2 bg-primary-50 rounded-lg border border-primary-200">
                    <span className="text-sm text-primary-700 truncate">{editNewFile.name}</span>
                    <button type="button" onClick={() => setEditNewFile(null)} className="text-gray-400 hover:text-gray-600 ml-2 shrink-0"><X className="w-4 h-4" /></button>
                  </div>
                )}
              </div>
              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setEditando(null)} className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium">Cancelar</button>
                <button type="submit" disabled={guardando} className="flex items-center gap-2 px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium disabled:opacity-50">
                  <Save className="w-4 h-4" />{guardando ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
