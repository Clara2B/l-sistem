import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  // Só adiciona o token de usuário se não tiver Authorization próprio na requisição
  if (token) {
    const jaTemAuth = config.headers && (
      config.headers['Authorization'] ||
      config.headers['authorization'] ||
      (config.headers.get && config.headers.get('Authorization'))
    );
    if (!jaTemAuth) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    // Só redireciona para login se:
    // 1. For 401
    // 2. NÃO for uma rota de autenticação (evita loop em erro de senha)
    const url = err.config?.url || '';
    const ehRotaAuth = url.includes('/auth/');
    if (err.response?.status === 401 && !ehRotaAuth) {
      localStorage.clear();
      window.location.href = '/';
    }
    return Promise.reject(err);
  }
);

export default api;
