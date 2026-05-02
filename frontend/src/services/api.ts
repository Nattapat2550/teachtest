import axios from 'axios';

const api = axios.create({
  // เปลี่ยน URL เป็นของ teachtestbe ให้ถูกต้อง
  baseURL: import.meta.env.VITE_API_URL || 'https://teachtest.onrender.com',
  withCredentials: true, // สำคัญมาก ป้องกัน CORS และให้ระบบ Auth ทำงานได้
});

// Request Interceptor สำหรับแนบ Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor สำหรับจัดการ Token หมดอายุ (ถ้ามี)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('owner');
      // window.location.href = '/login'; // เปิดใช้ถ้าต้องการให้เด้งออกเมื่อ Token หมดอายุ
    }
    return Promise.reject(error);
  }
);

export default api;