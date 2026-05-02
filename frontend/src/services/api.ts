import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://teachtest.onrender.com',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use((response) => response, (error) => {
  if (error.response && error.response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('owner');
  }
  return Promise.reject(error);
});

export default api;

// ==========================================
// LMS API (Learning Management System)
// ==========================================

export const courseApi = {
  // ดึงคอร์สทั้งหมดที่เผยแพร่แล้ว (สำหรับหน้าแรก/หน้าเลือกซื้อ)
  getPublishedCourses: () => api.get('/api/courses'),
  // ดึงรายละเอียดคอร์ส (รวม Playlist และ Items)
  getCourseDetail: (id: string) => api.get(`/api/courses/${id}`),
};

export const tutorApi = {
  // จัดการหลักสูตรของ Tutor
  getMyCourses: () => api.get('/api/tutor/courses'),
  createCourse: (data: any) => api.post('/api/tutor/courses', data),
  // จัดการ Playlist และ Items
  createPlaylist: (courseId: string, data: any) => api.post(`/api/tutor/courses/${courseId}/playlists`, data),
  createPlaylistItem: (playlistId: string, data: any) => api.post(`/api/tutor/playlists/${playlistId}/items`, data),
  // จัดการ Promo Code
  createPromoCode: (courseId: string, data: any) => api.post(`/api/tutor/courses/${courseId}/promos`, data),
};

export const studentApi = {
  // ซื้อหลักสูตร
  enrollCourse: (data: { course_id: string; promo_code?: string }) => api.post('/api/student/enroll', data),
  // คอร์สที่ฉันซื้อแล้ว
  getMyLearning: () => api.get('/api/student/learning'),
  // อัปเดตความคืบหน้า (Progress)
  updateProgress: (enrollmentId: string, itemId: string) => 
    api.post('/api/student/progress', { enrollment_id: enrollmentId, item_id: itemId }),
};