import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api, { tutorApi } from '../../services/api';
import { compressImage } from '../../utils/imageCompression';
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

  const getFullUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const baseUrl = (api.defaults.baseURL || '').replace(/\/$/, '');
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
          const compressedFile = await compressImage(selectedFile);
          const fd = new FormData();
          fd.append('file', compressedFile);
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

  const fileInputClass = "mb-4 block w-full text-sm text-gray-900 border border-gray-300 rounded-md cursor-pointer bg-canvas  focus:outline-none   dark:placeholder-gray-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-l-lg file:border-0 file:text-sm file:font-bold file:bg-gray-200 file:text-gray-900 hover:file:bg-gray-300 dark:file:bg-gray-600 dark:file:text-white transition-all";

  return (
    <div className="max-w-7xl mx-auto p-6 mt-8">
      <h1 className="text-3xl font-black mb-6 ">Workspace: จัดการระบบการเรียนการสอน</h1>
      
      {/* Tabs Menu */}
      <div className="flex gap-2 border-b border-gray-200  mb-8 overflow-x-auto">
        <button onClick={()=>setActiveTab('manage_courses')} className={`py-3 px-6 font-bold whitespace-nowrap ${activeTab==='manage_courses' ? 'text-primary border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700 '}`}>จัดการคอร์สเรียน</button>
        <button onClick={()=>setActiveTab('content')} className={`py-3 px-6 font-bold whitespace-nowrap ${activeTab==='content' ? 'text-primary border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700 '}`}>จัดการเนื้อหา & โปรโมโค้ด</button>
        <button onClick={()=>setActiveTab('packages')} className={`py-3 px-6 font-bold whitespace-nowrap ${activeTab==='packages' ? 'text-primary border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700 '}`}>จัดแพ็กเกจรวมคอร์ส</button>
        <button onClick={()=>setActiveTab('analytics')} className={`py-3 px-6 font-bold whitespace-nowrap ${activeTab==='analytics' ? 'text-primary border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700 '}`}>📊 สถิติและข้อมูลหลังบ้าน</button>

        {role === 'admin' && (
          <button onClick={()=>setActiveTab('global_promos')} className={`py-3 px-6 font-bold whitespace-nowrap ${activeTab==='global_promos' ? 'text-primary border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700 '}`}>โค้ดส่วนลดกลาง (Admin)</button>
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
          editingItemId={editingItemId} setEditingItemId={setEditingItemId} itemForm={itemForm} setItemForm={setItemForm} setSelectedFile={setSelectedFile} uploading={uploading} uploadProgress={uploadProgress} handleSaveItem={handleSaveItem} handleEditItem={handleEditItem} handleDeleteItem={handleDeleteItem} 
          fileInputClass={fileInputClass}
          examQuestions={examQuestions} setExamQuestions={setExamQuestions}
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