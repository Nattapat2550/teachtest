import React, { useState, useEffect } from 'react';
import { tutorApi } from '../../services/api';

export default function TutorDashboard() {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);

  const [courseForm, setCourseForm] = useState({ title: '', price: 0, description: '', cover_image: '' });
  const [playlistForm, setPlaylistForm] = useState({ title: '', sort_order: 1 });
  const [itemForm, setItemForm] = useState({ title: '', item_type: 'video', content_url: '', sort_order: 1 });
  const [promoForm, setPromoForm] = useState({ code: '', discount_amount: 0 });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data } = await tutorApi.getMyCourses();
      setCourses(data || []);
      // อัปเดต selectedCourse ปัจจุบันให้ข้อมูลตรงกับที่ fetch มาใหม่
      if (selectedCourse) {
        const updatedCourse = data.find((c: any) => c.id === selectedCourse.id);
        setSelectedCourse(updatedCourse || null);
      }
    } catch (e) { console.error(e); }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await tutorApi.createCourse(courseForm);
      setCourseForm({ title: '', price: 0, description: '', cover_image: '' });
      fetchCourses();
      alert('สร้างคอร์สสำเร็จ');
    } catch (e) { alert('เกิดข้อผิดพลาดในการสร้างคอร์ส'); }
  };

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    try {
      await tutorApi.createPlaylist(selectedCourse.id, playlistForm);
      setPlaylistForm({ title: '', sort_order: 1 });
      fetchCourses();
      alert('สร้างเพลย์ลิสต์สำเร็จ');
    } catch (e) { alert('เกิดข้อผิดพลาดในการสร้างเพลย์ลิสต์'); }
  };

  const handleEditPlaylist = async (playlistId: string, currentTitle: string) => {
    const newTitle = window.prompt('แก้ไขชื่อบทเรียน:', currentTitle);
    if (newTitle && newTitle.trim() !== '') {
      try {
        await tutorApi.updatePlaylist(playlistId, { title: newTitle });
        fetchCourses();
      } catch (e) { alert('แก้ไขเพลย์ลิสต์ไม่สำเร็จ'); }
    }
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    if (!window.confirm('ยืนยันการลบเพลย์ลิสต์นี้? (เนื้อหาด้านในจะถูกลบทั้งหมด)')) return;
    try {
      await tutorApi.deletePlaylist(playlistId);
      fetchCourses();
    } catch (e) { alert('ลบเพลย์ลิสต์ไม่สำเร็จ'); }
  };

  const handleCreateItem = async (e: React.FormEvent, playlistId: string) => {
    e.preventDefault();
    try {
      await tutorApi.createPlaylistItem(playlistId, itemForm);
      setItemForm({ title: '', item_type: 'video', content_url: '', sort_order: 1 });
      fetchCourses();
      alert('เพิ่มเนื้อหาสำเร็จ');
    } catch (e) { alert('เกิดข้อผิดพลาดในการเพิ่มเนื้อหา'); }
  };

  const handleEditItem = async (itemId: string, currentTitle: string) => {
    const newTitle = window.prompt('แก้ไขชื่อเนื้อหา:', currentTitle);
    if (newTitle && newTitle.trim() !== '') {
      try {
        await tutorApi.updatePlaylistItem(itemId, { title: newTitle });
        fetchCourses();
      } catch (e) { alert('แก้ไขเนื้อหาไม่สำเร็จ'); }
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm('ยืนยันการลบเนื้อหานี้?')) return;
    try {
      await tutorApi.deletePlaylistItem(itemId);
      fetchCourses();
    } catch (e) { alert('ลบเนื้อหาไม่สำเร็จ'); }
  };

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    try {
      await tutorApi.createPromoCode(selectedCourse.id, promoForm);
      setPromoForm({ code: '', discount_amount: 0 });
      alert('สร้างโปรโมโค้ดสำเร็จ');
    } catch (e) { alert('เกิดข้อผิดพลาดในการสร้างโปรโมโค้ด'); }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 mt-8">
      <h1 className="text-3xl font-black mb-8 dark:text-white">Tutor Dashboard (สำหรับผู้สอน)</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700 h-fit">
          <h2 className="text-xl font-bold mb-4 dark:text-white">สร้างคอร์สใหม่</h2>
          <form onSubmit={handleCreateCourse} className="space-y-4">
            <input type="text" placeholder="ชื่อคอร์สเรียน" required className="w-full p-3 border rounded-xl dark:bg-gray-900 dark:text-white" value={courseForm.title} onChange={e=>setCourseForm({...courseForm, title: e.target.value})} />
            <input type="text" placeholder="URL รูปหน้าปก" className="w-full p-3 border rounded-xl dark:bg-gray-900 dark:text-white" value={courseForm.cover_image} onChange={e=>setCourseForm({...courseForm, cover_image: e.target.value})} />
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">ตั้งราคาคอร์ส (บาท) *ใส่ 0 หากเป็นคอร์สฟรี</label>
              <input type="number" placeholder="เช่น 990" required className="w-full p-3 border rounded-xl dark:bg-gray-900 dark:text-white" value={courseForm.price} onChange={e=>setCourseForm({...courseForm, price: Number(e.target.value)})} />
            </div>
            <textarea placeholder="รายละเอียดคอร์ส" rows={4} className="w-full p-3 border rounded-xl dark:bg-gray-900 dark:text-white" value={courseForm.description} onChange={e=>setCourseForm({...courseForm, description: e.target.value})} />
            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition">สร้างคอร์สเรียน</button>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700">
            <h2 className="text-xl font-bold mb-4 dark:text-white">จัดการเนื้อหาคอร์ส</h2>
            <select className="w-full p-3 border rounded-xl mb-4 dark:bg-gray-900 dark:text-white" onChange={(e) => setSelectedCourse(courses.find(c => c.id === e.target.value))}>
              <option value="">-- เลือกคอร์สที่ต้องการจัดการ --</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>

            {selectedCourse && (
              <div className="space-y-6 border-t dark:border-gray-700 pt-6">
                
                <form onSubmit={handleCreatePromo} className="flex gap-4">
                  <input type="text" placeholder="รหัสโปรโมชั่น (เช่น DISCOUNT50)" required className="flex-1 p-3 border rounded-xl dark:bg-gray-900 dark:text-white" value={promoForm.code} onChange={e=>setPromoForm({...promoForm, code: e.target.value})} />
                  <input type="number" placeholder="ส่วนลด (บาท)" required className="w-32 p-3 border rounded-xl dark:bg-gray-900 dark:text-white" value={promoForm.discount_amount} onChange={e=>setPromoForm({...promoForm, discount_amount: Number(e.target.value)})} />
                  <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-6 font-bold rounded-xl transition">สร้างโค้ด</button>
                </form>

                <form onSubmit={handleCreatePlaylist} className="flex gap-4">
                  <input type="text" placeholder="ชื่อบทเรียน (เช่น บทที่ 1)" required className="flex-1 p-3 border rounded-xl dark:bg-gray-900 dark:text-white" value={playlistForm.title} onChange={e=>setPlaylistForm({...playlistForm, title: e.target.value})} />
                  <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white px-6 font-bold rounded-xl transition">เพิ่มบทเรียน</button>
                </form>

                {selectedCourse.playlists?.map((pl: any) => (
                  <div key={pl.id} className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border dark:border-gray-700">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-bold dark:text-white">{pl.title}</h3>
                      <div className="flex gap-3">
                        <button onClick={() => handleEditPlaylist(pl.id, pl.title)} className="text-blue-600 hover:text-blue-800 text-sm font-bold">แก้ไข</button>
                        <button onClick={() => handleDeletePlaylist(pl.id)} className="text-red-500 hover:text-red-700 text-sm font-bold">ลบ</button>
                      </div>
                    </div>
                    
                    {pl.items && pl.items.length > 0 && (
                      <ul className="mb-4 space-y-2">
                        {pl.items.map((it: any) => (
                          <li key={it.id} className="flex justify-between items-center text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 p-3 rounded border dark:border-gray-700">
                            <span>[{it.item_type}] {it.title}</span>
                            <div className="flex gap-3">
                              <button onClick={() => handleEditItem(it.id, it.title)} className="text-blue-600 hover:text-blue-800 font-bold">แก้ไข</button>
                              <button onClick={() => handleDeleteItem(it.id)} className="text-red-500 hover:text-red-700 font-bold">ลบ</button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}

                    <form onSubmit={(e) => handleCreateItem(e, pl.id)} className="flex flex-wrap gap-2">
                      <input type="text" placeholder="ชื่อเนื้อหาย่อย" required className="flex-1 min-w-[150px] p-2 border rounded-lg dark:bg-gray-800 dark:text-white" value={itemForm.title} onChange={e=>setItemForm({...itemForm, title: e.target.value})} />
                      <select className="p-2 border rounded-lg dark:bg-gray-800 dark:text-white" value={itemForm.item_type} onChange={e=>setItemForm({...itemForm, item_type: e.target.value})}>
                        <option value="video">วิดีโอ (Video)</option>
                        <option value="file">เอกสาร (File)</option>
                        <option value="exam">ข้อสอบ (Exam)</option>
                      </select>
                      <input type="text" placeholder="URL ของเนื้อหา" required className="flex-1 min-w-[200px] p-2 border rounded-lg dark:bg-gray-800 dark:text-white" value={itemForm.content_url} onChange={e=>setItemForm({...itemForm, content_url: e.target.value})} />
                      <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 font-bold rounded-lg transition">เพิ่มเนื้อหา</button>
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