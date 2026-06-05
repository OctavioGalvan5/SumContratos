import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import logoUrl from './assets/logo.svg';
import { 
  Bell, Home, FileText, PlusCircle, Calendar as CalendarIcon, Tags, Menu, X,
  BookOpen, Users, UserCheck, ClipboardList, DollarSign, BarChart3, CalendarRange
} from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';

// Componentes Contratos
import Dashboard from './components/Dashboard';
import ContratosList from './components/ContratosList';
import ContratoForm from './components/ContratoForm';
import Notificaciones from './components/Notificaciones';
import Calendario from './components/Calendario';
import Categorias from './components/Categorias';
import Login from './components/Login';

// Componentes SUM
import DashboardSum from './components/sum/DashboardSum';
import Cursos from './components/sum/Cursos';
import HorarioSemanal from './components/sum/HorarioSemanal';
import Personas from './components/sum/Personas';
import Inscripciones from './components/sum/Inscripciones';
import AsistenciaDia from './components/sum/AsistenciaDia';
import PagosCuotas from './components/sum/PagosCuotas';
import Reportes from './components/sum/Reportes';
import Feriados from './components/sum/Feriados';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [notificaciones, setNotificaciones] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchNotificaciones = async () => {
    try {
      const res = await axios.get('/api/notificaciones/');
      setNotificaciones(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotificaciones();
      const interval = setInterval(fetchNotificaciones, 60000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    delete axios.defaults.headers.common['Authorization'];
    setIsAuthenticated(false);
  };

  const closeSidebar = () => setSidebarOpen(false);

  if (!isAuthenticated) {
    return <Login setAuth={setIsAuthenticated} />;
  }

  return (
    <Router>
      <div className="flex h-screen bg-bg-gray overflow-hidden">

        {/* Overlay mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={closeSidebar}
          />
        )}

        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-brand-teal text-white border-r border-brand-teal-mid flex flex-col
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:relative md:translate-x-0 md:flex shrink-0
        `}>
          <div className="h-16 flex items-center justify-between border-b border-brand-teal-mid px-3">
            <img src={logoUrl} alt="Caja de Abogados" className="h-10 w-auto" />
            <button onClick={closeSidebar} className="md:hidden p-1 rounded hover:bg-white/10 text-white/80 shrink-0">
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
          
          <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto sidebar-nav">
            {/* Sección Contratos */}
            <div>
              <div className="px-3 mb-2.5 text-[10px] font-bold text-teal-200/50 uppercase tracking-widest">
                📋 Contratos
              </div>
              <div className="space-y-1">
                <NavLink to="/" onClick={closeSidebar} className="nav-link-custom">
                  <Home />
                  <span>Inicio Contratos</span>
                </NavLink>
                <NavLink to="/contratos" onClick={closeSidebar} className="nav-link-custom">
                  <FileText />
                  <span>Listado</span>
                </NavLink>
                <NavLink to="/nuevo" onClick={closeSidebar} className="nav-link-custom">
                  <PlusCircle />
                  <span>Nuevo Contrato</span>
                </NavLink>
                <NavLink to="/calendario" onClick={closeSidebar} className="nav-link-custom">
                  <CalendarIcon />
                  <span>Calendario</span>
                </NavLink>
                <NavLink to="/categorias" onClick={closeSidebar} className="nav-link-custom">
                  <Tags />
                  <span>Categorías</span>
                </NavLink>
              </div>
            </div>

            {/* Sección SUM */}
            <div>
              <div className="px-3 mb-2.5 text-[10px] font-bold text-teal-200/50 uppercase tracking-widest">
                🏛️ Gestión SUM
              </div>
              <div className="space-y-1">
                <NavLink to="/sum" onClick={closeSidebar} className="nav-link-custom" end>
                  <Home />
                  <span>Dashboard SUM</span>
                </NavLink>
                <NavLink to="/sum/cursos" onClick={closeSidebar} className="nav-link-custom">
                  <BookOpen />
                  <span>Cursos</span>
                </NavLink>
                <NavLink to="/sum/horarios" onClick={closeSidebar} className="nav-link-custom">
                  <CalendarIcon />
                  <span>Horario Semanal</span>
                </NavLink>
                <NavLink to="/sum/personas" onClick={closeSidebar} className="nav-link-custom">
                  <Users />
                  <span>Personas</span>
                </NavLink>
                <NavLink to="/sum/inscripciones" onClick={closeSidebar} className="nav-link-custom">
                  <UserCheck />
                  <span>Inscripciones</span>
                </NavLink>
                <NavLink to="/sum/asistencia" onClick={closeSidebar} className="nav-link-custom">
                  <ClipboardList />
                  <span>Asistencia del Día</span>
                </NavLink>
                <NavLink to="/sum/pagos" onClick={closeSidebar} className="nav-link-custom">
                  <DollarSign />
                  <span>Pagos y Cuotas</span>
                </NavLink>
                <NavLink to="/sum/reportes" onClick={closeSidebar} className="nav-link-custom">
                  <BarChart3 />
                  <span>Reportes y Liq.</span>
                </NavLink>
                <NavLink to="/sum/feriados" onClick={closeSidebar} className="nav-link-custom">
                  <CalendarRange />
                  <span>Feriados</span>
                </NavLink>
              </div>
            </div>
          </nav>
          
          <div className="p-4 border-t border-brand-teal-mid print:hidden">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-2 text-teal-100 hover:bg-brand-red hover:text-white rounded-lg transition-colors text-sm font-semibold cursor-pointer"
            >
              Cerrar Sesión
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shrink-0 print:hidden">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <Menu className="w-5 h-5 text-slate-600" />
              </button>
              <img src={logoUrl} alt="Caja de Abogados de Salta" className="h-10 w-auto" />
            </div>
            <div className="relative">
              <button
                onClick={() => setShowNotif(!showNotif)}
                className="p-2 rounded-full hover:bg-slate-100 transition-colors relative"
              >
                <Bell className="w-5 h-5 text-slate-600" />
                {notificaciones.length > 0 && (
                  <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span>
                )}
              </button>
              {showNotif && (
                <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-xl border border-slate-200 z-50 overflow-hidden">
                  <Notificaciones
                    notificaciones={notificaciones}
                    onResolved={fetchNotificaciones}
                  />
                </div>
              )}
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8">
            <Routes>
              {/* Contratos */}
              <Route path="/" element={<Dashboard />} />
              <Route path="/contratos" element={<ContratosList />} />
              <Route path="/nuevo" element={<ContratoForm />} />
              <Route path="/calendario" element={<Calendario />} />
              <Route path="/categorias" element={<Categorias />} />

              {/* SUM */}
              <Route path="/sum" element={<DashboardSum />} />
              <Route path="/sum/cursos" element={<Cursos />} />
              <Route path="/sum/horarios" element={<HorarioSemanal />} />
              <Route path="/sum/personas" element={<Personas />} />
              <Route path="/sum/inscripciones" element={<Inscripciones />} />
              <Route path="/sum/asistencia" element={<AsistenciaDia />} />
              <Route path="/sum/pagos" element={<PagosCuotas />} />
              <Route path="/sum/reportes" element={<Reportes />} />
              <Route path="/sum/feriados" element={<Feriados />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
