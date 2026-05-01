import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://gtymalltestbe.onrender.com',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

// ==========================================
// Admin API (User Role Management)
// ==========================================
export const adminUpdateUserRole = (userId: string, role: string) => 
   api.put(`/api/admin/users/${userId}/role`, { role });