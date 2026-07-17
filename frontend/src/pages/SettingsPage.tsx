import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { compressImage } from '../utils/imageCompression';

export default function SettingsPage() {
 const navigate = useNavigate();
 const [profile, setProfile] = useState({ username: '', first_name: '', last_name: '', tel: '', profile_picture_url: '' });
 const [loading, setLoading] = useState(false);
 const [successMsg, setSuccessMsg] = useState('');

 useEffect(() => {
 api.get('/api/users/me').then(({ data }) => {
 // ดึงให้ครอบคลุมเผื่อ API ส่งกลับมาเป็น owner
 const u = data.owner || data;
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
 
 // แก้ไข: อ่านและเซฟเป็น 'owner'
 const ownerStr = localStorage.getItem('owner');
 if (ownerStr) {
 const u = JSON.parse(ownerStr);
 u.username = profile.username;
 u.first_name = profile.first_name;
 localStorage.setItem('owner', JSON.stringify(u));
 window.dispatchEvent(new Event('storage'));
 }
 setSuccessMsg('บันทึกข้อมูลสำเร็จ');
 setTimeout(() => setSuccessMsg(''), 3000);
 } catch (err: any) {
 alert(err.response?.data?.error || 'เกิดข้อผิดพลาด Username อาจซ้ำ'); 
 }
 setLoading(false);
 };

 const handleAvatarChange = async (e: any) => {
 const file = e.target.files[0];
 if (!file) return;
 const compressedFile = await compressImage(file);
 const formData = new FormData();
 formData.append('avatar', compressedFile);

 try {
 const { data } = await api.post('/api/users/me/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
 setProfile({ ...profile, profile_picture_url: data.profile_picture_url });
 
 // แก้ไข: อ่านและเซฟเป็น 'owner'
 const ownerStr = localStorage.getItem('owner');
 if (ownerStr) {
 const ownerObj = JSON.parse(ownerStr);
 ownerObj.profile_picture_url = data.profile_picture_url;
 localStorage.setItem('owner', JSON.stringify(ownerObj));
 window.dispatchEvent(new Event('storage'));
 }
 alert('อัปเดตรูปโปรไฟล์สำเร็จ');
 } catch (err: any) { alert('อัปโหลดล้มเหลว'); }
 };

 const handleDeleteAccount = async () => {
 if (window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบบัญชี? (ไม่สามารถกู้คืนได้)")) {
 try {
 await api.put('/api/users/me', { status: 'deleted' });
 localStorage.removeItem('token');
 // แก้ไข: ลบ 'owner'
 localStorage.removeItem('owner');
 window.location.href = '/login';
 } catch (err: any) { alert('ลบข้อมูลไม่สำเร็จ'); }
 }
 };

 return (
 <div className="max-w-6xl w-full mx-auto p-6 lg:p-10 mt-10 space-y-8 animate-fade-in pb-20">
 <div className="bg-canvas rounded-md shadow-sm border border-outline p-6 lg:p-8">
 <h2 className="text-2xl font-bold border-b border-outline pb-4 mb-6 text-ink ">การตั้งค่าบัญชี</h2>
 
 {successMsg && <div className="mb-6 p-4 bg-green-50 /30 border border-green-200 text-green-700 rounded-md font-medium">{successMsg}</div>}

 <div className="flex flex-col md:flex-row gap-8">
 <div className="flex flex-col items-center space-y-4 shrink-0">
 <div className="w-32 h-32 rounded-full border-4 border-blue-100 overflow-hidden bg-canvas flex items-center justify-center">
 {profile.profile_picture_url ? (
 <img src={profile.profile_picture_url} alt="Profile" className="w-full h-full object-cover" />
 ) : (
 <span className="text-muted text-sm">ไม่มีรูปภาพ</span>
 )}
 </div>
 <label className="cursor-pointer bg-canvas border border-outline text-ink py-2 px-5 rounded-md shadow-sm hover:bg-canvas dark:hover:bg-gray-600 transition text-sm font-medium">
 เปลี่ยนรูปโปรไฟล์
 <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
 </label>
 </div>

 <form onSubmit={handleUpdateProfile} className="flex-1 space-y-5">
 <div>
 <label className="block text-sm font-medium text-ink mb-1">Username</label>
 <input type="text" value={profile.username} onChange={(e) => setProfile({...profile, username: e.target.value})} className="block w-full border border-outline rounded-md p-3 bg-canvas text-ink outline-none focus:ring-2 focus:ring-blue-500" required />
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
 <div>
 <label className="block text-sm font-medium text-ink mb-1">ชื่อจริง</label>
 <input type="text" value={profile.first_name} onChange={(e) => setProfile({...profile, first_name: e.target.value})} className="block w-full border border-outline rounded-md p-3 bg-canvas text-ink outline-none focus:ring-2 focus:ring-blue-500" />
 </div>
 <div>
 <label className="block text-sm font-medium text-ink mb-1">นามสกุล</label>
 <input type="text" value={profile.last_name} onChange={(e) => setProfile({...profile, last_name: e.target.value})} className="block w-full border border-outline rounded-md p-3 bg-canvas text-ink outline-none focus:ring-2 focus:ring-blue-500" />
 </div>
 </div>
 <div>
 <label className="block text-sm font-medium text-ink mb-1">เบอร์โทรศัพท์</label>
 <input type="tel" value={profile.tel} onChange={(e) => setProfile({...profile, tel: e.target.value})} className="block w-full border border-outline rounded-md p-3 bg-canvas text-ink outline-none focus:ring-2 focus:ring-blue-500" />
 </div>

 <button type="submit" disabled={loading} className="w-full bg-primary text-white font-bold py-3 px-4 rounded-md hover:bg-primary-active transition shadow-md shadow-blue-500/20 mt-2">
 {loading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
 </button>
 </form>
 </div>
 </div>

 <div className="bg-canvas rounded-md shadow-sm border border-red-200 /50 p-6 lg:p-8 flex flex-col md:flex-row justify-between items-center gap-4">
 <div>
 <h3 className="text-xl font-bold text-red-600 ">Danger Zone</h3>
 <p className="text-sm text-muted mt-1">ลบบัญชีของคุณอย่างถาวร (บัญชีจะถูกลบหลังจาก 30 วัน)</p>
 </div>
 <button onClick={handleDeleteAccount} className="bg-red-600 text-white py-2.5 px-6 rounded-md hover:bg-red-700 font-bold whitespace-nowrap">ลบบัญชี</button>
 </div>
 </div>
 );
}