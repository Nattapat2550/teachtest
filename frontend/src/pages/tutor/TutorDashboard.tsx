import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api, { tutorApi } from '../../services/api';

export default function TutorDashboard() {
  const { role } = useSelector((state: any) => state.auth);
  const [activeTab, setActiveTab] = useState('manage_courses'); 

  // Course State
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [courseForm, setCourseForm] = useState({ title: '', price: 0, description: '', cover_image: '' });
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  
  // Playlist & Item State
  const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(null);
  const [playlistForm, setPlaylistForm] = useState({ title: '', sort_order: 1 });
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState({ title: '', item_type: 'video', sort_order: 1, content_url: '' });
  
  // Promo State
  const [promoForm, setPromoForm] = useState({ code: '', discount_amount: 0, max_uses: 0 });
  const [promoCodes, setPromoCodes] = useState<any[]>([]);
  const [editingPromoId, setEditingPromoId] = useState<string | null>(null);

  // Package State
  const [packages, setPackages] = useState<any[]>([]);
  const [pkgForm, setPkgForm] = useState({ title: '', description: '', price: 0, cover_image: '', course_ids: [] as string[] });
  const [editingPkgId, setEditingPkgId] = useState<string | null>(null);

  // Admin Global Promo
  const [globalPromos, setGlobalPromos] = useState<any[]>([]);
  const [globalPromoForm, setGlobalPromoForm] = useState({ code: '', discount_amount: 0, max_uses: 0, course_id: '' });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); 
  const [examQuestions, setExamQuestions] = useState([
    { question_text: '', image_url: '', question_type: 'multiple_choice', correct_answer: '', choices: [{ choice_text: '', is_correct: true }] }
  ]);

  useEffect(() => {
    fetchCourses();
    if (role === 'admin') fetchGlobalPromos();
  }, [role]);

  useEffect(() => {
    if (selectedCourse && activeTab === 'content') {
      tutorApi.getPromoCodes(selectedCourse.id).then(res => setPromoCodes(res.data)).catch(console.error);
    }
  }, [selectedCourse, activeTab]);

  useEffect(() => {
    if (activeTab === 'packages') {
      tutorApi.getPackages().then(res => setPackages(res.data)).catch(console.error);
    }
  }, [activeTab]);

  const fetchCourses = async () => {
    try {
      const { data } = await tutorApi.getMyCourses();
      setCourses(data || []);
      if (selectedCourse) {
        const updatedCourse = data.find((c: any) => c.id === selectedCourse.id);
        setSelectedCourse(updatedCourse || null);
      }
    } catch (e) { console.error(e); }
  };

  const fetchGlobalPromos = async () => {
    try {
      const { data } = await tutorApi.getGlobalPromos();
      setGlobalPromos(data || []);
    } catch (e) { console.error(e); }
  };

  // --- Handlers: Course ---
  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCourseId) {
        await tutorApi.updateCourse(editingCourseId, courseForm);
        alert('อัปเดตคอร์สสำเร็จ!');
      } else {
        await tutorApi.createCourse(courseForm);
        alert('สร้างคอร์สสำเร็จ!');
      }
      setCourseForm({ title: '', price: 0, description: '', cover_image: '' });
      setEditingCourseId(null);
      fetchCourses();
    } catch (e) { alert('เกิดข้อผิดพลาด'); }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!window.confirm("ยืนยันการลบคอร์สนี้พร้อมเนื้อหาทั้งหมด?")) return;
    try {
      await tutorApi.deleteCourse(id);
      fetchCourses();
    } catch (e) { alert("ลบไม่สำเร็จ"); }
  };

  // --- Handlers: Promos ---
  const handleSavePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    try {
      if (editingPromoId) {
        await tutorApi.updatePromoCode(editingPromoId, promoForm);
        alert('อัปเดตโค้ดสำเร็จ');
      } else {
        await tutorApi.createPromoCode(selectedCourse.id, promoForm);
        alert('สร้างโค้ดสำเร็จ!');
      }
      setPromoForm({ code: '', discount_amount: 0, max_uses: 0 });
      setEditingPromoId(null);
      const res = await tutorApi.getPromoCodes(selectedCourse.id);
      setPromoCodes(res.data);
    } catch (err) { alert('เกิดข้อผิดพลาดในการสร้าง หรือโค้ดอาจซ้ำ'); }
  };

  const handleDeletePromo = async (id: string) => {
    if (!window.confirm("ลบโค้ดนี้หรือไม่?")) return;
    try {
      await tutorApi.deletePromoCode(id);
      if(selectedCourse) {
        const res = await tutorApi.getPromoCodes(selectedCourse.id);
        setPromoCodes(res.data);
      }
    } catch (e) {}
  };

  // --- Handlers: Packages ---
  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPkgId) {
        await tutorApi.updatePackage(editingPkgId, pkgForm);
        alert("อัปเดตแพ็กเกจสำเร็จ!");
      } else {
        await tutorApi.createPackage(pkgForm);
        alert("สร้างแพ็กเกจสำเร็จ!");
      }
      setPkgForm({ title: '', description: '', price: 0, cover_image: '', course_ids: [] });
      setEditingPkgId(null);
      tutorApi.getPackages().then(res => setPackages(res.data));
    } catch (e) { alert("เกิดข้อผิดพลาด"); }
  };

  const handleDeletePackage = async (id: string) => {
    if (!window.confirm("ลบแพ็กเกจนี้?")) return;
    try {
      await tutorApi.deletePackage(id);
      tutorApi.getPackages().then(res => setPackages(res.data));
    } catch(e) {}
  };

  const toggleCourseInPackage = (courseId: string) => {
    setPkgForm(prev => {
      const ids = prev.course_ids.includes(courseId) 
        ? prev.course_ids.filter(id => id !== courseId)
        : [...prev.course_ids, courseId];
      return { ...prev, course_ids: ids };
    });
  };

  // --- Handlers: Admin Global Promo ---
  const handleSaveGlobalPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await tutorApi.createGlobalPromo(globalPromoForm);
      alert("สร้างโค้ดกลางสำเร็จ!");
      setGlobalPromoForm({ code: '', discount_amount: 0, max_uses: 0, course_id: '' });
      fetchGlobalPromos();
    } catch (e) { alert("ล้มเหลว หรือโค้ดซ้ำ"); }
  };

  // --- Handlers: Content ---
  const handleSavePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    try {
      if (editingPlaylistId) {
        await tutorApi.updatePlaylist(editingPlaylistId, playlistForm);
        setEditingPlaylistId(null);
      } else {
        await tutorApi.createPlaylist(selectedCourse.id, playlistForm);
      }
      setPlaylistForm({ title: '', sort_order: 1 });
      fetchCourses();
    } catch (e) {}
  };

  const handleEditItem = (item: any) => {
    setEditingItemId(item.id);
    setItemForm({ title: item.title, item_type: item.item_type, sort_order: item.sort_order || 1, content_url: item.content_url || '' });
    if (item.item_type === 'exam') {
      try {
        setExamQuestions(JSON.parse(item.content_data));
      } catch {
        setExamQuestions([{ question_text: '', image_url: '', question_type: 'multiple_choice', correct_answer: '', choices: [{ choice_text: '', is_correct: true }] }]);
      }
    }
    setSelectedFile(null);
  };

  const handleSaveItem = async (e: React.FormEvent, playlistId: string) => {
    e.preventDefault();
    setUploading(true);
    setUploadProgress(0);

    try {
      let finalUrl = itemForm.content_url;
      let finalData = "";

      if (itemForm.item_type !== 'exam') {
        if (selectedFile) {
          const fd = new FormData();
          fd.append('file', selectedFile);
          const uploadRes = await api.post('/api/tutor/upload', fd, {
            onUploadProgress: (pev) => {
              if (pev.total) setUploadProgress(Math.round((pev.loaded * 100) / pev.total));
            }
          });
          finalUrl = uploadRes.data.url;
        } else if (!editingItemId) {
          alert('กรุณาเลือกไฟล์'); setUploading(false); return;
        }
      } else {
        finalData = JSON.stringify(examQuestions);
        finalUrl = ""; 
      }

      const payload = { title: itemForm.title, item_type: itemForm.item_type, sort_order: Number(itemForm.sort_order), content_url: finalUrl, content_data: finalData };
      if (editingItemId) {
        await tutorApi.updatePlaylistItem(editingItemId, payload);
        alert('อัปเดตเนื้อหาสำเร็จ!');
      } else {
        await tutorApi.createPlaylistItem(playlistId, payload);
        alert('สร้างเนื้อหาสำเร็จ!');
      }
      setEditingItemId(null);
      setItemForm({ title: '', item_type: 'video', sort_order: 1, content_url: '' });
      fetchCourses();
    } catch (err) { alert('เกิดข้อผิดพลาดในการบันทึกเนื้อหา'); } 
    finally { setUploading(false); setUploadProgress(0); }
  };

  const updateQuestion = (index: number, key: string, value: string) => {
    const newQs = [...examQuestions];
    (newQs[index] as any)[key] = value;
    setExamQuestions(newQs);
  };

  // Reusable CSS Class สำหรับ File Input ให้สวยงามและชัดเจน
  const fileInputClass = "mb-4 block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-l-lg file:border-0 file:text-sm file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition-all";

  // Reusable JSX สำหรับการสร้างและแก้ไขข้อสอบ
  const renderExamEditor = () => (
    <div className="mb-4 p-4 border border-blue-200 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl space-y-4">
      {examQuestions.map((q, qIdx) => (
        <div key={qIdx} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
          <select value={q.question_type || 'multiple_choice'} onChange={(e) => updateQuestion(qIdx, 'question_type', e.target.value)} className="p-2 mb-2 border rounded-md dark:bg-gray-900 dark:text-white outline-none font-bold">
            <option value="multiple_choice">ปรนัย (ตัวเลือก)</option>
            <option value="short_answer">อัตนัย / คำถามปลายเปิด</option>
          </select>
          <input type="text" placeholder="โจทย์" value={q.question_text} onChange={(e) => updateQuestion(qIdx, 'question_text', e.target.value)} className="w-full p-2 mb-2 border-b outline-none dark:bg-gray-800 dark:text-white" />
          {q.question_type === 'multiple_choice' ? (
            <>
              {q.choices.map((c: any, cIdx: number) => (
                <div key={cIdx} className="flex gap-2 mb-2">
                  <input type="radio" checked={c.is_correct} onChange={() => { const newQs = [...examQuestions]; newQs[qIdx].choices.forEach((ch, idx) => ch.is_correct = (idx === cIdx)); setExamQuestions(newQs); }} />
                  <input type="text" value={c.choice_text} onChange={(e) => { const newQs = [...examQuestions]; newQs[qIdx].choices[cIdx].choice_text = e.target.value; setExamQuestions(newQs); }} className="border rounded px-2 py-1.5 w-full dark:bg-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
              ))}
              <button type="button" onClick={() => { const newQs = [...examQuestions]; newQs[qIdx].choices.push({ choice_text: '', is_correct: false }); setExamQuestions(newQs); }} className="text-xs text-blue-600 mt-2 font-bold">+ เพิ่มตัวเลือก</button>
            </>
          ) : (
            <input type="text" placeholder="คำตอบที่ถูกต้อง (เว้นว่างไว้เพื่อซ่อนช่องตอบ)" value={q.correct_answer || ''} onChange={(e) => updateQuestion(qIdx, 'correct_answer', e.target.value)} className="w-full p-2 text-sm border rounded-md dark:bg-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500" />
          )}
        </div>
      ))}
      <button type="button" onClick={() => setExamQuestions([...examQuestions, { question_text: '', image_url: '', question_type: 'multiple_choice', correct_answer: '', choices: [{ choice_text: '', is_correct: true }] }])} className="w-full py-2 border-dashed border-2 border-blue-300 text-blue-600 font-bold rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition">+ เพิ่มข้อสอบ</button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 mt-8">
      <h1 className="text-3xl font-black mb-6 dark:text-white">Workspace: จัดการระบบการเรียนการสอน</h1>
      
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 mb-8 overflow-x-auto">
        <button onClick={()=>setActiveTab('manage_courses')} className={`py-3 px-6 font-bold whitespace-nowrap ${activeTab==='manage_courses' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}>จัดการคอร์สเรียน</button>
        <button onClick={()=>setActiveTab('content')} className={`py-3 px-6 font-bold whitespace-nowrap ${activeTab==='content' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}>จัดการเนื้อหา & โปรโมโค้ด</button>
        <button onClick={()=>setActiveTab('packages')} className={`py-3 px-6 font-bold whitespace-nowrap ${activeTab==='packages' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}>จัดแพ็กเกจรวมคอร์ส</button>
        {role === 'admin' && (
          <button onClick={()=>setActiveTab('global_promos')} className={`py-3 px-6 font-bold whitespace-nowrap ${activeTab==='global_promos' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}>โค้ดส่วนลดกลาง (Admin)</button>
        )}
      </div>

      {/* --- TAB 1: Manage Courses --- */}
      {activeTab === 'manage_courses' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700 h-fit">
            <h2 className="text-xl font-bold mb-4 dark:text-white">{editingCourseId ? 'แก้ไขคอร์ส' : 'สร้างคอร์สใหม่'}</h2>
            <form onSubmit={handleSaveCourse} className="space-y-4">
              <input type="text" placeholder="ชื่อคอร์ส" required className="w-full p-3 border rounded-xl dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" value={courseForm.title} onChange={e=>setCourseForm({...courseForm, title: e.target.value})} />
              <input type="text" placeholder="URL รูปปกคอร์ส" className="w-full p-3 border rounded-xl dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" value={courseForm.cover_image} onChange={e=>setCourseForm({...courseForm, cover_image: e.target.value})} />
              <input type="number" placeholder="ราคา (บาท)" required className="w-full p-3 border rounded-xl dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" value={courseForm.price} onChange={e=>setCourseForm({...courseForm, price: Number(e.target.value)})} />
              <textarea placeholder="รายละเอียดคอร์ส" rows={4} className="w-full p-3 border rounded-xl dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" value={courseForm.description} onChange={e=>setCourseForm({...courseForm, description: e.target.value})} />
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition">{editingCourseId ? 'บันทึกแก้ไข' : 'สร้างคอร์ส'}</button>
                {editingCourseId && (
                  <button type="button" onClick={()=>{setEditingCourseId(null); setCourseForm({title:'',price:0,description:'',cover_image:''});}} className="px-4 bg-gray-200 text-gray-800 font-bold rounded-xl hover:bg-gray-300">ยกเลิก</button>
                )}
              </div>
            </form>
          </div>
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold mb-4 dark:text-white">รายการคอร์สทั้งหมดที่จัดการได้</h2>
            <div className="space-y-4">
              {courses.map(c => (
                <div key={c.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border dark:border-gray-700 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div className="flex items-center gap-4 w-full">
                    {c.cover_image ? <img src={c.cover_image} className="w-20 h-14 object-cover rounded-lg border dark:border-gray-600" /> : <div className="w-20 h-14 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>}
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white">{c.title}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">ราคา: ฿{c.price}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={()=>{setEditingCourseId(c.id); setCourseForm({title: c.title, price: c.price, description: c.description, cover_image: c.cover_image}); window.scrollTo({top:0});}} className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 px-4 py-2 rounded-lg font-bold text-sm transition-colors">แก้ไข</button>
                    <button onClick={()=>handleDeleteCourse(c.id)} className="bg-red-100 text-red-700 hover:bg-red-200 px-4 py-2 rounded-lg font-bold text-sm transition-colors">ลบ</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: Manage Content --- */}
      {activeTab === 'content' && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700">
          <h2 className="text-xl font-bold mb-4 dark:text-white">เลือกคอร์สที่ต้องการจัดการเนื้อหา / โปรโมโค้ด</h2>
          <select className="w-full p-3 border rounded-xl mb-6 dark:bg-gray-900 dark:text-white outline-none" onChange={(e) => {
            setSelectedCourse(courses.find(c => c.id === e.target.value));
            setEditingPlaylistId(null); setEditingItemId(null);
          }}>
            <option value="">-- เลือกคอร์ส --</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>

          {selectedCourse && (
            <div className="space-y-8">
              {/* Promo Code Form */}
              <div className="p-5 border border-blue-200 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <h4 className="text-base font-bold text-blue-800 dark:text-blue-300 mb-4">{editingPromoId ? 'แก้ไขโปรโมโค้ด' : 'สร้างโปรโมโค้ดใหม่สำหรับคอร์สนี้'}</h4>
                <form onSubmit={handleSavePromo} className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-bold text-blue-700 dark:text-blue-400 mb-1">รหัสโค้ดส่วนลด</label>
                    <input type="text" placeholder="เช่น SUMMER50" required className="w-full p-2.5 border rounded-lg dark:bg-gray-900 dark:text-white outline-none focus:border-blue-500" value={promoForm.code} onChange={e=>setPromoForm({...promoForm, code: e.target.value.toUpperCase()})} />
                  </div>
                  <div className="w-full sm:w-32 shrink-0">
                    <label className="block text-xs font-bold text-red-600 dark:text-red-400 mb-1">ส่วนลดที่ให้ (บาท)</label>
                    <input type="number" placeholder="0" required min="0" className="w-full p-2.5 border rounded-lg border-red-300 dark:border-red-900 dark:bg-gray-900 dark:text-white outline-none focus:border-red-500" value={promoForm.discount_amount} onChange={e=>setPromoForm({...promoForm, discount_amount: Number(e.target.value)})} />
                  </div>
                  <div className="w-full sm:w-32 shrink-0">
                    <label className="block text-xs font-bold text-green-700 dark:text-green-400 mb-1">จำนวนสิทธิ์ที่ใช้ได้</label>
                    <input type="number" placeholder="0 = ไม่จำกัด" required min="0" className="w-full p-2.5 border rounded-lg border-green-300 dark:border-green-900 dark:bg-gray-900 dark:text-white outline-none focus:border-green-500" value={promoForm.max_uses} onChange={e=>setPromoForm({...promoForm, max_uses: Number(e.target.value)})} />
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button type="submit" className="bg-blue-600 text-white font-bold px-6 py-2.5 rounded-lg hover:bg-blue-700 transition w-full h-11.5">{editingPromoId ? 'บันทึก' : 'สร้างโค้ด'}</button>
                    {editingPromoId && <button type="button" onClick={()=>{setEditingPromoId(null); setPromoForm({code:'',discount_amount:0,max_uses:0});}} className="bg-gray-300 text-gray-800 font-bold px-4 py-2.5 rounded-lg hover:bg-gray-400 h-11.5">ยกเลิก</button>}
                  </div>
                </form>
                
                <div className="mt-5 border-t pt-4 border-blue-200 dark:border-blue-800">
                  <h5 className="font-bold text-sm mb-3 text-blue-800 dark:text-blue-300">โค้ดส่วนลดที่สร้างแล้ว</h5>
                  {promoCodes.length === 0 ? <p className="text-sm text-gray-500">ยังไม่มีโค้ดส่วนลดสำหรับคอร์สนี้</p> : (
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                          {promoCodes.map(pc => (
                              <div key={pc.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                                  <div>
                                      <div className="flex items-center gap-3 mb-1">
                                          <span className="font-black text-blue-600 text-lg">{pc.code}</span>
                                          <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded">ลด ฿{pc.discount_amount}</span>
                                      </div>
                                      <div className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                          ใช้ไปแล้ว <span className={pc.max_uses > 0 && pc.uses?.length >= pc.max_uses ? "text-red-500 font-bold" : "text-green-600 font-bold"}>{pc.uses?.length || 0}</span> / {pc.max_uses > 0 ? `${pc.max_uses} สิทธิ์` : 'ไม่จำกัดสิทธิ์'}
                                      </div>
                                  </div>
                                  <div className="flex gap-2 items-center">
                                    <button onClick={()=>{setEditingPromoId(pc.id); setPromoForm({code: pc.code, discount_amount: pc.discount_amount, max_uses: pc.max_uses});}} className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold">แก้ไข</button>
                                    <button onClick={()=>handleDeletePromo(pc.id)} className="bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-xs font-bold">ลบ</button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
                </div>
              </div>

              {/* Playlists & Items Render */}
              <div className="p-4 border-2 border-dashed border-purple-200 dark:border-purple-900/50 rounded-xl">
                <h4 className="text-sm font-bold text-purple-600 dark:text-purple-400 mb-3">{editingPlaylistId ? 'แก้ไขบทเรียน' : 'สร้างบทเรียนใหม่'}</h4>
                <form onSubmit={handleSavePlaylist} className="flex flex-col sm:flex-row gap-4">
                  <input type="number" placeholder="ลำดับ" required className="w-20 p-3 border rounded-xl dark:bg-gray-900 dark:text-white outline-none" value={playlistForm.sort_order} onChange={e=>setPlaylistForm({...playlistForm, sort_order: Number(e.target.value)})} />
                  <input type="text" placeholder="ชื่อบทเรียน" required className="flex-1 p-3 border rounded-xl dark:bg-gray-900 dark:text-white outline-none" value={playlistForm.title} onChange={e=>setPlaylistForm({...playlistForm, title: e.target.value})} />
                  <div className="flex gap-2">
                    <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white px-6 font-bold rounded-xl">{editingPlaylistId ? 'อัปเดต' : '+ เพิ่ม'}</button>
                    {editingPlaylistId && <button type="button" onClick={()=>{setEditingPlaylistId(null); setPlaylistForm({title: '', sort_order: 1});}} className="bg-gray-200 px-4 font-bold rounded-xl">ยกเลิก</button>}
                  </div>
                </form>
              </div>

              {selectedCourse.playlists?.map((pl: any) => (
                <div key={pl.id} className="bg-gray-50 dark:bg-gray-900 p-5 rounded-xl border dark:border-gray-700">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg dark:text-white"><span className="text-purple-600 mr-2 border px-2 py-0.5 rounded-full">{pl.sort_order}</span>{pl.title}</h3>
                    <div className="flex gap-2">
                      <button onClick={() => {setEditingPlaylistId(pl.id); setPlaylistForm({title:pl.title, sort_order:pl.sort_order});}} className="text-blue-500 font-bold px-2 py-1 text-sm bg-blue-50 rounded">แก้ไข</button>
                      <button onClick={() => {if(window.confirm('ลบ?')) tutorApi.deletePlaylist(pl.id).then(fetchCourses)}} className="text-red-500 font-bold px-2 py-1 text-sm bg-red-50 rounded">ลบ</button>
                    </div>
                  </div>
                  {pl.items?.map((it: any) => (
                    <div key={it.id} className="mb-2">
                      {editingItemId === it.id ? (
                        <div className="p-4 bg-white dark:bg-gray-800 border-2 border-blue-400 rounded-xl my-2">
                            <div className="flex gap-3 mb-4">
                                <input type="number" placeholder="ลำดับ" required className="w-20 p-2 border rounded-lg dark:bg-gray-900 dark:text-white outline-none" value={itemForm.sort_order} onChange={e=>setItemForm({...itemForm, sort_order: Number(e.target.value)})} />
                                <input type="text" placeholder="ชื่อคลิป/ไฟล์" required className="flex-1 p-2 border rounded-lg dark:bg-gray-900 dark:text-white outline-none" value={itemForm.title} onChange={e=>setItemForm({...itemForm, title: e.target.value})} />
                                <select className="p-2 border rounded-lg dark:bg-gray-900 dark:text-white outline-none" value={itemForm.item_type} onChange={e=>setItemForm({...itemForm, item_type: e.target.value})}>
                                  <option value="video">วิดีโอ</option><option value="file">เอกสาร</option><option value="exam">แบบทดสอบ</option>
                                </select>
                            </div>
                            
                            {/* Rendering File Input OR Exam Editor */}
                            {itemForm.item_type !== 'exam' ? (
                                <input type="file" onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)} className={fileInputClass} />
                            ) : (
                                renderExamEditor()
                            )}

                            {/* Progress Bar สำหรับตอนแก้ไขไฟล์ */}
                            {uploading && (
                               <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4 dark:bg-gray-700 overflow-hidden">
                                  <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                               </div>
                            )}

                            <div className="flex gap-2">
                                <button onClick={(e) => handleSaveItem(e, pl.id)} disabled={uploading} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold">{uploading ? 'กำลังบันทึก...' : 'บันทึก'}</button>
                                <button onClick={() => setEditingItemId(null)} disabled={uploading} className="bg-gray-200 hover:bg-gray-300 px-6 py-2 rounded-lg font-bold">ยกเลิก</button>
                            </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center text-sm bg-white dark:bg-gray-800 p-3 rounded-lg border dark:border-gray-700">
                          <span className="dark:text-gray-200"><span className="text-gray-400 mr-2 border px-1.5 rounded">{it.sort_order}</span><span className="text-blue-500 uppercase mr-2 tracking-wider">[{it.item_type}]</span>{it.title}</span>
                          <div className="flex gap-2">
                            <button onClick={() => handleEditItem(it)} className="text-blue-500 font-bold px-2 py-1 rounded bg-blue-50">แก้ไข</button>
                            <button onClick={() => {if(window.confirm('ลบ?')) tutorApi.deletePlaylistItem(it.id).then(fetchCourses)}} className="text-red-500 font-bold px-2 py-1 rounded bg-red-50">ลบ</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* ฟอร์มเพิ่มเนื้อหาใหม่ (New Item) */}
                  {!editingItemId && (
                    <div className="mt-4 pt-4 border-t dark:border-gray-700">
                        <div className="flex gap-3 mb-4">
                            <input type="number" placeholder="ลำดับ" required className="w-20 p-2 border rounded-lg dark:bg-gray-800 dark:text-white outline-none" value={itemForm.sort_order} onChange={e=>setItemForm({...itemForm, sort_order: Number(e.target.value)})} />
                            <input type="text" placeholder="ชื่อเนื้อหาใหม่" required className="flex-1 p-2 border rounded-lg dark:bg-gray-800 dark:text-white outline-none" value={itemForm.title} onChange={e=>setItemForm({...itemForm, title: e.target.value})} />
                            <select className="p-2 border rounded-lg dark:bg-gray-800 dark:text-white outline-none" value={itemForm.item_type} onChange={e=>setItemForm({...itemForm, item_type: e.target.value})}>
                              <option value="video">วิดีโอ</option><option value="file">เอกสาร</option><option value="exam">แบบทดสอบ</option>
                            </select>
                        </div>
                        
                        {/* Rendering File Input OR Exam Editor */}
                        {itemForm.item_type !== 'exam' ? (
                            <input type="file" onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)} className={fileInputClass} />
                        ) : (
                            renderExamEditor()
                        )}

                        {/* Progress Bar สำหรับตอนสร้างไฟล์ใหม่ */}
                        {uploading && (
                           <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4 dark:bg-gray-700 overflow-hidden">
                              <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                           </div>
                        )}

                        <button onClick={(e) => handleSaveItem(e, pl.id)} disabled={uploading || !itemForm.title} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 font-bold rounded-lg transition-colors">{uploading ? 'กำลังบันทึก...' : 'เพิ่มเนื้อหา'}</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- TAB 3: Packages --- */}
      {activeTab === 'packages' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700 h-fit">
            <h2 className="text-xl font-bold mb-4 dark:text-white">{editingPkgId ? 'แก้ไขแพ็กเกจ' : 'จัดแพ็กเกจใหม่'}</h2>
            <form onSubmit={handleSavePackage} className="space-y-4">
              <input type="text" placeholder="ชื่อแพ็กเกจ (เช่น แพ็กสุดคุ้ม 3 คอร์ส)" required className="w-full p-3 border rounded-xl dark:bg-gray-900 dark:text-white outline-none" value={pkgForm.title} onChange={e=>setPkgForm({...pkgForm, title: e.target.value})} />
              <input type="number" placeholder="ราคาเหมาจ่าย (บาท)" required className="w-full p-3 border rounded-xl dark:bg-gray-900 dark:text-white outline-none" value={pkgForm.price} onChange={e=>setPkgForm({...pkgForm, price: Number(e.target.value)})} />
              <textarea placeholder="รายละเอียดส่วนลดต่างๆ" rows={3} className="w-full p-3 border rounded-xl dark:bg-gray-900 dark:text-white outline-none" value={pkgForm.description} onChange={e=>setPkgForm({...pkgForm, description: e.target.value})} />
              <input type="text" placeholder="URL รูปปก" className="w-full p-3 border rounded-xl dark:bg-gray-900 dark:text-white outline-none" value={pkgForm.cover_image} onChange={e=>setPkgForm({...pkgForm, cover_image: e.target.value})} />
              
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-900 h-40 overflow-y-auto">
                <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">เลือกคอร์สที่จะรวมในแพ็ก:</p>
                {courses.map(c => (
                  <label key={c.id} className="flex items-center gap-3 mb-2 cursor-pointer">
                    <input type="checkbox" checked={pkgForm.course_ids.includes(c.id)} onChange={() => toggleCourseInPackage(c.id)} className="w-4 h-4 text-blue-600" />
                    <span className="text-sm dark:text-white truncate">{c.title}</span>
                  </label>
                ))}
              </div>

              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700">{editingPkgId ? 'บันทึกแก้ไข' : 'สร้างแพ็กเกจ'}</button>
                {editingPkgId && <button type="button" onClick={()=>{setEditingPkgId(null); setPkgForm({title:'',description:'',price:0,cover_image:'',course_ids:[]})}} className="px-4 bg-gray-200 text-gray-800 font-bold rounded-xl">ยกเลิก</button>}
              </div>
            </form>
          </div>

          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold mb-4 dark:text-white">แพ็กเกจคอร์สทั้งหมด</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {packages.map(p => (
                <div key={p.id} className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 shadow-sm p-4">
                  {p.cover_image && <img src={p.cover_image} className="w-full h-32 object-cover rounded-lg mb-3" />}
                  <h3 className="font-bold text-lg dark:text-white">{p.title}</h3>
                  <p className="text-blue-600 font-black mb-2">฿{p.price}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{p.course_ids?.length || 0} คอร์สที่รวมอยู่</p>
                  <div className="flex gap-2">
                    <button onClick={()=>{setEditingPkgId(p.id); setPkgForm({title:p.title, description:p.description, price:p.price, cover_image:p.cover_image, course_ids:p.course_ids||[]}); window.scrollTo({top:0});}} className="flex-1 bg-yellow-100 text-yellow-700 py-2 rounded-lg font-bold">แก้ไข</button>
                    <button onClick={()=>handleDeletePackage(p.id)} className="flex-1 bg-red-100 text-red-700 py-2 rounded-lg font-bold">ลบ</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 4: Admin Global Promos --- */}
      {activeTab === 'global_promos' && role === 'admin' && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700">
          <h2 className="text-xl font-bold mb-4 dark:text-white text-purple-600">สร้างโค้ดส่วนลดกลาง (ใช้ได้ทุกคอร์ส หรือเลือกคอร์สได้)</h2>
          <form onSubmit={handleSaveGlobalPromo} className="flex flex-col sm:flex-row gap-4 items-end mb-8 border p-5 rounded-xl border-purple-200 bg-purple-50 dark:bg-purple-900/20">
            <div className="flex-1">
              <label className="block text-xs font-bold text-blue-700 dark:text-blue-400 mb-1">รหัสโค้ด</label>
              <input type="text" placeholder="เช่น SUPERADMIN" required className="w-full p-2.5 border rounded-lg dark:bg-gray-900 dark:text-white outline-none" value={globalPromoForm.code} onChange={e=>setGlobalPromoForm({...globalPromoForm, code: e.target.value.toUpperCase()})} />
            </div>
            <div className="w-full sm:w-28">
              <label className="block text-xs font-bold text-red-600 mb-1">ลด (บาท)</label>
              <input type="number" required min="0" className="w-full p-2.5 border rounded-lg dark:bg-gray-900 dark:text-white outline-none" value={globalPromoForm.discount_amount} onChange={e=>setGlobalPromoForm({...globalPromoForm, discount_amount: Number(e.target.value)})} />
            </div>
            <div className="w-full sm:w-28">
              <label className="block text-xs font-bold text-green-700 mb-1">สิทธิ์ที่ใช้ได้</label>
              <input type="number" placeholder="0 = ไม่อั้น" required min="0" className="w-full p-2.5 border rounded-lg dark:bg-gray-900 dark:text-white outline-none" value={globalPromoForm.max_uses} onChange={e=>setGlobalPromoForm({...globalPromoForm, max_uses: Number(e.target.value)})} />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">กำหนดคอร์ส (เว้นว่าง = ใช้ได้ทุกคอร์ส)</label>
              <select className="w-full p-2.5 border rounded-lg dark:bg-gray-900 dark:text-white outline-none" value={globalPromoForm.course_id} onChange={e=>setGlobalPromoForm({...globalPromoForm, course_id: e.target.value})}>
                <option value="">[ใช้ได้กับทุกคอร์ส]</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <button type="submit" className="bg-purple-600 text-white font-bold px-6 py-2.5 rounded-lg hover:bg-purple-700 transition h-11.5">สร้างโค้ดกลาง</button>
          </form>

          <h3 className="font-bold text-lg mb-4 dark:text-white">รายการโค้ดส่วนลดกลาง</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {globalPromos.map(gp => (
              <div key={gp.id} className="p-4 bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded-xl flex justify-between items-center">
                <div>
                  <h4 className="font-black text-purple-600 text-lg">{gp.code} <span className="text-sm bg-red-100 text-red-600 px-2 py-0.5 rounded font-bold ml-2">- ฿{gp.discount_amount}</span></h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">เงื่อนไข: {gp.course_id ? `เฉพาะคอร์ส ID: ${gp.course_id}` : 'ใช้ได้ทุกคอร์ส (Global)'}</p>
                  <p className="text-xs font-bold text-gray-400 mt-1">ถูกใช้: {gp.uses?.length || 0} / {gp.max_uses > 0 ? gp.max_uses : 'ไม่จำกัด'}</p>
                </div>
                <button onClick={() => {if(window.confirm('ลบ?')) tutorApi.deletePromoCode(gp.id).then(fetchGlobalPromos)}} className="bg-red-100 text-red-700 px-4 py-2 rounded-lg font-bold hover:bg-red-200 transition">ลบ</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}