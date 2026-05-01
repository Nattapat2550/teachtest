import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function SettingsPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ username: '', first_name: '', last_name: '', tel: '', profile_picture_url: '' });
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    api.get('/api/users/me').then(({ data }) => {
      const u = data.user || data; 
      if (u) {
        setProfile({
          username: u.username || '',
          first_name: u.first_name || '', 
          last_name: u.last_name || '', 
          tel: u.tel || '', 
          profile_picture_url: u.profile_picture_url || ''
        });
      }
    }).catch(() => navigate('/login'));
  }, [navigate]);

  const handleUpdateProfile = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/api/users/me', profile); 
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr);
        u.username = profile.username;
        u.first_name = profile.first_name;
        localStorage.setItem('user', JSON.stringify(u));
        window.dispatchEvent(new Event('storage'));
      }
      setSuccessMsg('อัปเดตข้อมูลสำเร็จ');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) { 
       alert(err.response?.data?.error || 'เกิดข้อผิดพลาด'); 
    }
    setLoading(false);
  };

  const handleAvatarChange = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      const { data } = await api.post('/api/users/me/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setProfile({ ...profile, profile_picture_url: data.profile_picture_url });
      
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        user.profile_picture_url = data.profile_picture_url;
        localStorage.setItem('user', JSON.stringify(user));
        window.dispatchEvent(new Event('storage'));
      }
      alert('อัปเดตรูปโปรไฟล์สำเร็จ');
    } catch (err: any) { alert('เกิดข้อผิดพลาดในการอัปโหลดรูป'); }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบบัญชีนี้? (การดำเนินการนี้ไม่สามารถย้อนกลับได้)")) {
      try {
        await api.put('/api/users/me', { status: 'deleted' });
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      } catch (err: any) { alert('เกิดข้อผิดพลาดในการลบบัญชี'); }
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 mt-10 space-y-8 animate-fade-in pb-20">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 lg:p-8">
        <h2 className="text-2xl font-bold border-b border-gray-200 dark:border-gray-700 pb-4 mb-6 text-gray-900 dark:text-white">ตั้งค่าโปรไฟล์</h2>
        {successMsg && <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-xl font-medium">{successMsg}</div>}
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex flex-col items-center space-y-4 shrink-0">
            <div className="w-32 h-32 rounded-full border-4 border-blue-100 dark:border-gray-600 overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              {profile.profile_picture_url ? (
                <img src={profile.profile_picture_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-400 dark:text-gray-500 text-sm">ไม่มีรูป</span>
              )}
            </div>
            <label className="cursor-pointer bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-2 px-5 rounded-xl shadow-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition text-sm font-medium">
              เปลี่ยนรูปภาพ
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </label>
          </div>
          <form onSubmit={handleUpdateProfile} className="flex-1 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
              <input type="text" value={profile.username} onChange={(e) => setProfile({...profile, username: e.target.value})} className="block w-full border border-gray-300 dark:border-gray-600 rounded-xl p-3 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ชื่อ</label>
                <input type="text" value={profile.first_name} onChange={(e) => setProfile({...profile, first_name: e.target.value})} className="block w-full border border-gray-300 dark:border-gray-600 rounded-xl p-3 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">นามสกุล</label>
                <input type="text" value={profile.last_name} onChange={(e) => setProfile({...profile, last_name: e.target.value})} className="block w-full border border-gray-300 dark:border-gray-600 rounded-xl p-3 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">เบอร์โทรศัพท์</label>
              <input type="tel" value={profile.tel} onChange={(e) => setProfile({...profile, tel: e.target.value})} className="block w-full border border-gray-300 dark:border-gray-600 rounded-xl p-3 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-blue-700 transition shadow-md shadow-blue-500/20 mt-2">
              {loading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
            </button>
          </form>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-red-200 dark:border-red-900/50 p-6 lg:p-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-red-600 dark:text-red-500">Danger Zone</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">ลบบัญชีผู้ใช้ (ข้อมูลจะถูกซ่อนและลบถาวรใน 30 วัน)</p>
        </div>
        <button onClick={handleDeleteAccount} className="bg-red-600 text-white py-2.5 px-6 rounded-xl hover:bg-red-700 font-bold whitespace-nowrap">ลบบัญชีของฉัน</button>
      </div>
    </div>
  );
}