// @ts-nocheck
import { useState } from 'react';
import axios from 'axios';
import logoUrl from '../assets/logo.svg';

export default function Login({ setAuth }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/login', { password });
      const token = res.data.access_token;
      localStorage.setItem('auth_token', token);
      
      // Setup default header for future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setAuth(true);
    } catch (e) {
      setError('Contraseña incorrecta');
    }
  };

  return (
    <div className="min-h-screen bg-bg-gray flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-100 p-8">
        <div className="flex justify-center mb-8">
          <img src={logoUrl} alt="Caja de Abogados de Salta" className="h-16 w-auto" />
        </div>
        
        {error && (
          <div className="mb-4 bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña de acceso</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Ingresa tu contraseña..."
            />
          </div>
          <button 
            type="submit" 
            className="w-full py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
}
