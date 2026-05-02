import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { checkAuthStatus } from '../store/slices/authSlice';
import api from '../services/api';

export const useOAuthCallback = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<any>();

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes('token=')) return;

    const params = new URLSearchParams(hash.substring(1));
    const token = params.get('token');
    const role = params.get('role');

    if (token) {
      localStorage.setItem('token', token);
      if (role) localStorage.setItem('role', role);

      api.get('/api/auth/status')
        .then((res) => {
          if (res.data && res.data.owner) {
            // แก้ไข: บันทึกข้อมูลลง LocalStorage ด้วย key 'owner' ให้ตรงกับระบบหลัก
            localStorage.setItem('owner', JSON.stringify(res.data.owner));
            // Trigger events ให้ Layout รู้ว่าอัปเดตข้อมูลแล้ว
            window.dispatchEvent(new Event('storage'));
            window.dispatchEvent(new Event('owner-updated'));
          }
          
          // อัปเดต State Auth ใน Redux
          dispatch(checkAuthStatus());

          const targetUrl = role === 'admin' ? '/admin' : '/home';
          window.history.replaceState(null, '', targetUrl);
          navigate(targetUrl, { replace: true });
        })
        .catch(() => {
          window.history.replaceState(null, '', '/home');
          navigate('/home', { replace: true });
        });
    }
  }, [navigate, dispatch]);
};