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
    localStorage.removeItem('role');
  }
  return Promise.reject(error);
});

export default api;

export const courseApi = {
  getPublishedCourses: () => api.get('/api/courses'),
  getCourseDetail: (id: string) => api.get(`/api/courses/${id}`),
};

export const tutorApi = {
  getMyCourses: () => api.get('/api/tutor/courses'),
  createCourse: (data: any) => api.post('/api/tutor/courses', data),
  updateCourse: (id: string, data: any) => api.put(`/api/tutor/courses/${id}`, data),
  deleteCourse: (id: string) => api.delete(`/api/tutor/courses/${id}`),
  
  createPlaylist: (courseId: string, data: any) => api.post(`/api/tutor/courses/${courseId}/playlists`, data),
  updatePlaylist: (playlistId: string, data: any) => api.put(`/api/tutor/playlists/${playlistId}`, data),
  deletePlaylist: (playlistId: string) => api.delete(`/api/tutor/playlists/${playlistId}`),
  
  createPlaylistItem: (playlistId: string, data: any) => api.post(`/api/tutor/playlists/${playlistId}/items`, data),
  updatePlaylistItem: (itemId: string, data: any) => api.put(`/api/tutor/items/${itemId}`, data),
  deletePlaylistItem: (itemId: string) => api.delete(`/api/tutor/items/${itemId}`),
  
  getPromoCodes: (courseId: string) => api.get(`/api/tutor/courses/${courseId}/promos`),
  createPromoCode: (courseId: string, data: any) => api.post(`/api/tutor/courses/${courseId}/promos`, data),
  updatePromoCode: (promoId: string, data: any) => api.put(`/api/tutor/promos/${promoId}`, data),
  deletePromoCode: (promoId: string) => api.delete(`/api/tutor/promos/${promoId}`),

  getPackages: () => api.get('/api/tutor/packages'),
  createPackage: (data: any) => api.post('/api/tutor/packages', data),
  updatePackage: (id: string, data: any) => api.put(`/api/tutor/packages/${id}`, data),
  deletePackage: (id: string) => api.delete(`/api/tutor/packages/${id}`),

  // Global Admin Promos
  getGlobalPromos: () => api.get('/api/admin/promos'),
  createGlobalPromo: (data: any) => api.post('/api/admin/promos', data)
};

export const studentApi = {
  enrollCourse: (data: { course_id: string; promo_code?: string }) => api.post('/api/student/enroll', data),
  getMyLearning: () => api.get('/api/student/learning'),
  updateProgress: (enrollmentId: string, itemId: string) => 
    api.post('/api/student/progress', { enrollment_id: enrollmentId, item_id: itemId }),
};