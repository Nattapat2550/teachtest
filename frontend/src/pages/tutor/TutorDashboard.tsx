import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api, { tutorApi } from '../../services/api';
import ManageCoursesTab from './tabs/ManageCoursesTab';
import ManagePackagesTab from './tabs/ManagePackagesTab';
import GlobalPromosTab from './tabs/GlobalPromosTab';
import ManageContentTab from './tabs/ManageContentTab';
import AnalyticsTab from './tabs/AnalyticsTab';

export default function TutorDashboard() {
  const { role } = useSelector((state: any) => state.auth);
  const [activeTab, setActiveTab] = useState('manage_courses'); 

  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [courseForm, setCourseForm] = useState({ title: '', price: 0, description: '', cover_image: '', is_published: true, access_duration_days: null as number | null });
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  
  const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(null);
  const [playlistForm, setPlaylistForm] = useState({ title: '', sort_order: 1 });
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState({ title: '', item_type: 'video', sort_order: 1, content_url: '' });
  
  const [promoForm, setPromoForm] = useState({ code: '', discount_amount: 0, max_uses: 0 });
  const [promoCodes, setPromoCodes] = useState<any[]>([]);
  const [editingPromoId, setEditingPromoId] = useState<string | null>(null);

  const [packages, setPackages] = useState<any[]>([]);
  const [pkgForm, setPkgForm] = useState({ title: '', description: '', price: 0, cover_image: '', course_ids: [] as string[], is_published: true, access_duration_days: null as number | null });
  const [editingPkgId, setEditingPkgId] = useState<string | null>(null);

  const [globalPromos, setGlobalPromos] = useState<any[]>([]);
  const [globalPromoForm, setGlobalPromoForm] = useState({ code: '', discount_amount: 0, max_uses: 0, course_id: '' });
  const [editingGlobalPromoId, setEditingGlobalPromoId] = useState<string | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); 
  const [examQuestions, setExamQuestions] = useState([
    { question_text: '', image_url: '', question_type: 'multiple_choice', correct_answer: '', choices: [{ choice_text: '', is_correct: true }] }
  ]);

  // 🌟 เพิ่มฟังก์ชันแปลง URL ไฟล์ให้ถูกต้องพร้อมแนบ Token แก้ปัญหา 404
  const getFullUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const baseUrl = import.meta.env.VITE_API_URL || 'https://teachtest.onrender.com';
    const token = localStorage.getItem('token') || '';
    const path = url.startsWith('/') ? url : `/${url}`;
    const separator = path.includes('?') ? '&' : '?';
    return `${baseUrl}${path}${separator}token=${token}`;
  };

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
      setCourseForm({ title: '', price: 0, description: '', cover_image: '', is_published: true, access_duration_days: null });
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
      setPkgForm({ title: '', description: '', price: 0, cover_image: '', course_ids: [], is_published: true, access_duration_days: null });
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
        ? prev.course_ids.filter((id: string) => id !== courseId)
        : [...prev.course_ids, courseId];
      return { ...prev, course_ids: ids };
    });
  };

  const handleSaveGlobalPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingGlobalPromoId) {
        await tutorApi.updateGlobalPromo(editingGlobalPromoId, globalPromoForm);
        alert("อัปเดตโค้ดกลางสำเร็จ!");
      } else {
        await tutorApi.createGlobalPromo(globalPromoForm);
        alert("สร้างโค้ดกลางสำเร็จ!");
      }
      setGlobalPromoForm({ code: '', discount_amount: 0, max_uses: 0, course_id: '' });
      setEditingGlobalPromoId(null);
      fetchGlobalPromos();
    } catch (e) { alert("ล้มเหลว หรือโค้ดซ้ำ"); }
  };

  const handleDeleteGlobalPromo = (id: string) => {
      if(window.confirm('ลบ?')) tutorApi.deletePromoCode(id).then(fetchGlobalPromos)
  };

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
  
  const handleDeletePlaylist = (id: string) => {
      if(window.confirm('ลบ?')) tutorApi.deletePlaylist(id).then(fetchCourses)
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
  
  const handleDeleteItem = (id: string) => {
      if(window.confirm('ลบ?')) tutorApi.deletePlaylistItem(id).then(fetchCourses)
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
            onUploadProgress: (pev: any) => {
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

  const handleUploadQuestionMedia = async (e: any, qIdx: number) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
        const { data } = await api.post('/api/tutor/upload', fd);
        updateQuestion(qIdx, 'image_url', data.url);
    } catch (err) {
        alert('อัปโหลดไฟล์ล้มเหลว');
    } finally {
        setUploading(false);
    }
  };

  const fileInputClass = "mb-4 block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-l-lg file:border-0 file:text-sm file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition-all";

  const renderExamEditor = () => (
    <div className="mb-4 p-4 border border-blue-200 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl space-y-4">
      {examQuestions.map((q, qIdx) => (
        <div key={qIdx} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
          <select value={q.question_type || 'multiple_choice'} onChange={(e) => updateQuestion(qIdx, 'question_type', e.target.value)} className="p-2 mb-2 border rounded-md dark:bg-gray-900 dark:text-white outline-none font-bold">
            <option value="multiple_choice">ปรนัย (ตัวเลือก)</option>
            <option value="short_answer">อัตนัย / คำถามปลายเปิด</option>
          </select>
          
          <input type="text" placeholder="โจทย์ข้อสอบ..." value={q.question_text} onChange={(e) => updateQuestion(qIdx, 'question_text', e.target.value)} className="w-full p-2 mb-2 border-b outline-none dark:bg-gray-800 dark:text-white" />
          
          <div className="mt-2 mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">แนบรูปภาพหรือวิดีโอประกอบโจทย์ (ถ้ามี)</label>
            <input type="file" accept="image/*,video/*" onChange={(e) => handleUploadQuestionMedia(e, qIdx)} className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer w-full" />
            
            {/* 🌟 แสดงรูปภาพหรือวิดีโอ โดยใช้ getFullUrl เพื่อแนบ Token ป้องกัน 404 Not Found */}
            {q.image_url && (
              <div className="mt-3">
                {q.image_url.match(/\.(mp4|webm|mov)$/i) ? (
                  <video src={getFullUrl(q.image_url)} controls className="max-w-xs rounded-lg shadow-sm" />
                ) : (
                  <img src={getFullUrl(q.image_url)} alt="Question Media" className="max-w-xs rounded-lg shadow-sm" />
                )}
                <button type="button" onClick={() => updateQuestion(qIdx, 'image_url', '')} className="text-xs text-red-500 font-bold mt-2 hover:underline">ลบไฟล์แนบ</button>
              </div>
            )}
          </div>

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
      
      {/* Tabs Menu */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 mb-8 overflow-x-auto">
        <button onClick={()=>setActiveTab('manage_courses')} className={`py-3 px-6 font-bold whitespace-nowrap ${activeTab==='manage_courses' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}>จัดการคอร์สเรียน</button>
        <button onClick={()=>setActiveTab('content')} className={`py-3 px-6 font-bold whitespace-nowrap ${activeTab==='content' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}>จัดการเนื้อหา & โปรโมโค้ด</button>
        <button onClick={()=>setActiveTab('packages')} className={`py-3 px-6 font-bold whitespace-nowrap ${activeTab==='packages' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}>จัดแพ็กเกจรวมคอร์ส</button>
        <button onClick={()=>setActiveTab('analytics')} className={`py-3 px-6 font-bold whitespace-nowrap ${activeTab==='analytics' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}>📊 สถิติและข้อมูลหลังบ้าน</button>

        {role === 'admin' && (
          <button onClick={()=>setActiveTab('global_promos')} className={`py-3 px-6 font-bold whitespace-nowrap ${activeTab==='global_promos' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}>โค้ดส่วนลดกลาง (Admin)</button>
        )}
      </div>

      {activeTab === 'manage_courses' && (
        <ManageCoursesTab 
          courses={courses} courseForm={courseForm} setCourseForm={setCourseForm}
          editingCourseId={editingCourseId} setEditingCourseId={setEditingCourseId}
          handleSaveCourse={handleSaveCourse} handleDeleteCourse={handleDeleteCourse}
        />
      )}

      {activeTab === 'content' && (
        <ManageContentTab 
          courses={courses} selectedCourse={selectedCourse} setSelectedCourse={setSelectedCourse}
          editingPromoId={editingPromoId} setEditingPromoId={setEditingPromoId} promoForm={promoForm} setPromoForm={setPromoForm} promoCodes={promoCodes} handleSavePromo={handleSavePromo} handleDeletePromo={handleDeletePromo}
          editingPlaylistId={editingPlaylistId} setEditingPlaylistId={setEditingPlaylistId} playlistForm={playlistForm} setPlaylistForm={setPlaylistForm} handleSavePlaylist={handleSavePlaylist} handleDeletePlaylist={handleDeletePlaylist}
          editingItemId={editingItemId} setEditingItemId={setEditingItemId} itemForm={itemForm} setItemForm={setItemForm} setSelectedFile={setSelectedFile} uploading={uploading} uploadProgress={uploadProgress} handleSaveItem={handleSaveItem} handleEditItem={handleEditItem} handleDeleteItem={handleDeleteItem} renderExamEditor={renderExamEditor} fileInputClass={fileInputClass}
        />
      )}

      {activeTab === 'packages' && (
        <ManagePackagesTab 
          packages={packages} pkgForm={pkgForm} setPkgForm={setPkgForm}
          editingPkgId={editingPkgId} setEditingPkgId={setEditingPkgId}
          handleSavePackage={handleSavePackage} handleDeletePackage={handleDeletePackage}
          toggleCourseInPackage={toggleCourseInPackage} courses={courses}
        />
      )}

      {activeTab === 'global_promos' && role === 'admin' && (
        <GlobalPromosTab 
          globalPromos={globalPromos} globalPromoForm={globalPromoForm}
          setGlobalPromoForm={setGlobalPromoForm} handleSaveGlobalPromo={handleSaveGlobalPromo}
          courses={courses} handleDeleteGlobalPromo={handleDeleteGlobalPromo}
          editingGlobalPromoId={editingGlobalPromoId} setEditingGlobalPromoId={setEditingGlobalPromoId}
        />
      )}
      {activeTab === 'analytics' && <AnalyticsTab />}
    </div>
  );
}