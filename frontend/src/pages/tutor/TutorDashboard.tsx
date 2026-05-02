import React, { useState, useEffect } from 'react';
import { tutorApi } from '../../services/api';

export default function TutorDashboard() {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  
  // Forms
  const [courseForm, setCourseForm] = useState({ title: '', price: 0, description: '' });
  const [playlistForm, setPlaylistForm] = useState({ title: '' });
  const [itemForm, setItemForm] = useState({ title: '', item_type: 'video', content_url: '' });
  const [promoForm, setPromoForm] = useState({ code: '', discount_amount: 0 });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data } = await tutorApi.getMyCourses();
      setCourses(data || []);
    } catch (e) { console.error(e); }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await tutorApi.createCourse(courseForm);
      setCourseForm({ title: '', price: 0, description: '' });
      fetchCourses();
      alert('สร้างหลักสูตรสำเร็จ');
    } catch (e) { alert('เกิดข้อผิดพลาด'); }
  };

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    try {
      await tutorApi.createPlaylist(selectedCourse.id, playlistForm);
      setPlaylistForm({ title: '' });
      fetchCourses(); // รีเฟรชเพื่อดึงข้อมูลใหม่
      alert('เพิ่ม Playlist สำเร็จ');
    } catch (e) { alert('เกิดข้อผิดพลาด'); }
  };

  const handleCreateItem = async (e: React.FormEvent, playlistId: string) => {
    e.preventDefault();
    try {
      await tutorApi.createPlaylistItem(playlistId, itemForm);
      setItemForm({ title: '', item_type: 'video', content_url: '' });
      fetchCourses();
      alert('เพิ่มบทเรียนสำเร็จ');
    } catch (e) { alert('เกิดข้อผิดพลาด'); }
  };

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    try {
      await tutorApi.createPromoCode(selectedCourse.id, promoForm);
      setPromoForm({ code: '', discount_amount: 0 });
      alert('สร้างโค้ดส่วนลดสำเร็จ');
    } catch (e) { alert('เกิดข้อผิดพลาด'); }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 mt-8">
      <h1 className="text-3xl font-black mb-8 dark:text-white">Tutor Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* สร้างหลักสูตร */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700">
          <h2 className="text-xl font-bold mb-4 dark:text-white">สร้างหลักสูตรใหม่</h2>
          <form onSubmit={handleCreateCourse} className="space-y-4">
            <input type="text" placeholder="ชื่อหลักสูตร" required className="w-full p-3 border rounded-xl dark:bg-gray-900 dark:text-white" value={courseForm.title} onChange={e=>setCourseForm({...courseForm, title: e.target.value})} />
            <input type="number" placeholder="ราคา (บาท)" required className="w-full p-3 border rounded-xl dark:bg-gray-900 dark:text-white" value={courseForm.price} onChange={e=>setCourseForm({...courseForm, price: Number(e.target.value)})} />
            <textarea placeholder="รายละเอียด" className="w-full p-3 border rounded-xl dark:bg-gray-900 dark:text-white" value={courseForm.description} onChange={e=>setCourseForm({...courseForm, description: e.target.value})} />
            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700">บันทึกหลักสูตร</button>
          </form>
        </div>

        {/* จัดการหลักสูตรที่เลือก */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700">
            <h2 className="text-xl font-bold mb-4 dark:text-white">หลักสูตรของฉัน</h2>
            <select className="w-full p-3 border rounded-xl mb-4 dark:bg-gray-900 dark:text-white" onChange={(e) => setSelectedCourse(courses.find(c => c.id === e.target.value))}>
              <option value="">-- เลือกหลักสูตรเพื่อจัดการ --</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>

            {selectedCourse && (
              <div className="space-y-6 border-t dark:border-gray-700 pt-6">
                {/* สร้าง Promo Code */}
                <form onSubmit={handleCreatePromo} className="flex gap-4">
                  <input type="text" placeholder="โค้ดส่วนลด" required className="flex-1 p-3 border rounded-xl dark:bg-gray-900 dark:text-white" value={promoForm.code} onChange={e=>setPromoForm({...promoForm, code: e.target.value})} />
                  <input type="number" placeholder="ลดราคา (บาท)" required className="w-32 p-3 border rounded-xl dark:bg-gray-900 dark:text-white" value={promoForm.discount_amount} onChange={e=>setPromoForm({...promoForm, discount_amount: Number(e.target.value)})} />
                  <button type="submit" className="bg-green-600 text-white px-6 font-bold rounded-xl">เพิ่มโค้ด</button>
                </form>

                {/* สร้าง Playlist */}
                <form onSubmit={handleCreatePlaylist} className="flex gap-4">
                  <input type="text" placeholder="ชื่อ Playlist (เช่น บทที่ 1)" required className="flex-1 p-3 border rounded-xl dark:bg-gray-900 dark:text-white" value={playlistForm.title} onChange={e=>setPlaylistForm({...playlistForm, title: e.target.value})} />
                  <button type="submit" className="bg-purple-600 text-white px-6 font-bold rounded-xl">เพิ่มเพลย์ลิสต์</button>
                </form>

                {/* รายการ Playlist เพื่อเพิ่มเนื้อหา */}
                {selectedCourse.playlists?.map((pl: any) => (
                  <div key={pl.id} className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border dark:border-gray-700">
                    <h3 className="font-bold mb-3 dark:text-white">📂 {pl.title}</h3>
                    <form onSubmit={(e) => handleCreateItem(e, pl.id)} className="flex flex-wrap gap-2">
                      <input type="text" placeholder="ชื่อเนื้อหา" required className="flex-1 min-w-[150px] p-2 border rounded-lg dark:bg-gray-800 dark:text-white" value={itemForm.title} onChange={e=>setItemForm({...itemForm, title: e.target.value})} />
                      <select className="p-2 border rounded-lg dark:bg-gray-800 dark:text-white" value={itemForm.item_type} onChange={e=>setItemForm({...itemForm, item_type: e.target.value})}>
                        <option value="video">คลิปวิดีโอ</option>
                        <option value="file">ไฟล์เอกสาร</option>
                        <option value="exam">ข้อสอบ</option>
                      </select>
                      <input type="text" placeholder="URL ของไฟล์/คลิป" required className="flex-1 min-w-[200px] p-2 border rounded-lg dark:bg-gray-800 dark:text-white" value={itemForm.content_url} onChange={e=>setItemForm({...itemForm, content_url: e.target.value})} />
                      <button type="submit" className="bg-blue-600 text-white px-4 font-bold rounded-lg">+</button>
                    </form>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}