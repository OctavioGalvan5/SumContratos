// @ts-nocheck
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Bell, Home, FileText, PlusCircle, Calendar as CalendarIcon, Tags } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';

import Dashboard from './components/Dashboard';
import ContratosList from './components/ContratosList';
import ContratoForm from './components/ContratoForm';
import Notificaciones from './components/Notificaciones';
import Calendario from './components/Calendario';
import Categorias from './components/Categorias';
import Login from './components/Login';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [notificaciones, setNotificaciones] = useState([]);
  const [showNotif, setShowNotif] = useState(false);

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
      const interval = setInterval(fetchNotificaciones, 60000); // Check every minute
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    delete axios.defaults.headers.common['Authorization'];
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <Login setAuth={setIsAuthenticated} />;
  }

  return (
    <Router>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col transition-all duration-300">
          <div className="h-16 flex items-center justify-center border-b border-gray-200">
            <h1 className="text-xl font-bold text-primary-700 tracking-tight text-center px-2">Caja de Abogados de Salta</h1>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-2">
            <Link to="/" className="flex items-center px-4 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-600 rounded-lg transition-colors">
              <Home className="w-5 h-5 mr-3" />
              <span className="font-medium">Inicio</span>
            </Link>
            <Link to="/contratos" className="flex items-center px-4 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-600 rounded-lg transition-colors">
              <FileText className="w-5 h-5 mr-3" />
              <span className="font-medium">Contratos</span>
            </Link>
            <Link to="/nuevo" className="flex items-center px-4 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-600 rounded-lg transition-colors">
              <PlusCircle className="w-5 h-5 mr-3" />
              <span className="font-medium">Nuevo Contrato</span>
            </Link>
            <Link to="/calendario" className="flex items-center px-4 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-600 rounded-lg transition-colors">
              <CalendarIcon className="w-5 h-5 mr-3" />
              <span className="font-medium">Calendario</span>
            </Link>
            <Link to="/categorias" className="flex items-center px-4 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-600 rounded-lg transition-colors">
              <Tags className="w-5 h-5 mr-3" />
              <span className="font-medium">Categorías</span>
            </Link>
          </nav>
          <div className="p-4 border-t border-gray-200">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-2 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
            >
              <span className="font-medium">Cerrar Sesión</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
            <h2 className="text-xl font-semibold text-gray-800">Sistema de Vencimientos</h2>
            <div className="relative">
              <button 
                onClick={() => setShowNotif(!showNotif)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors relative"
              >
                <Bell className="w-6 h-6 text-gray-600" />
                {notificaciones.length > 0 && (
                  <span className="absolute top-1 right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                )}
              </button>
              {showNotif && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
                  <Notificaciones 
                    notificaciones={notificaciones} 
                    onResolved={fetchNotificaciones} 
                  />
                </div>
              )}
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/contratos" element={<ContratosList />} />
              <Route path="/nuevo" element={<ContratoForm />} />
              <Route path="/calendario" element={<Calendario />} />
              <Route path="/categorias" element={<Categorias />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
