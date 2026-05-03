import React, { useState, useEffect } from 'react';
import api, { tutorApi } from '../../services/api';

export default function TutorDashboard() {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [courseForm, setCourseForm] = useState({ title: '', price: 0, description: '', cover_image: '' });
  
  const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(null);
  const [playlistForm, setPlaylistForm] = useState({ title: '', sort_order: 1 });
  
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState({ title: '', item_type: 'video', sort_order: 1, content_url: '' });
  
  // Promo Code State
  const [promoForm, setPromoForm] = useState({ code: '', discount_amount: 0, max_uses: 0 });
  const [promoCodes, setPromoCodes] = useState<any[]>([]);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); 
  
  const [examQuestions, setExamQuestions] = useState([
    { question_text: '', image_url: '', question_type: 'multiple_choice', correct_answer: '', choices: [{ choice_text: '', is_correct: true }] }
  ]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (uploading) {
        e.preventDefault();
        e.returnValue = 'กำลังอัปโหลดไฟล์ คุณแน่ใจหรือไม่ว่าต้องการออก?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [uploading]);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      tutorApi.getPromoCodes(selectedCourse.id).then(res => setPromoCodes(res.data)).catch(console.error);
    }
  }, [selectedCourse]);

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

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await tutorApi.createCourse(courseForm);
      setCourseForm({ title: '', price: 0, description: '', cover_image: '' });
      fetchCourses();
      alert('สร้างคอร์สสำเร็จ!');
    } catch (e) { alert('เกิดข้อผิดพลาด'); }
  };

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    try {
      await tutorApi.createPromoCode(selectedCourse.id, promoForm);
      alert('สร้าง Promo Code สำเร็จ!');
      setPromoForm({ code: '', discount_amount: 0, max_uses: 0 });
      const res = await tutorApi.getPromoCodes(selectedCourse.id);
      setPromoCodes(res.data);
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการสร้าง หรือโค้ดอาจซ้ำ');
    }
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
    } catch (e) { alert('เกิดข้อผิดพลาดในการบันทึกบทเรียน'); }
  };

  const handleEditPlaylist = (pl: any) => {
    setEditingPlaylistId(pl.id);
    setPlaylistForm({ title: pl.title, sort_order: pl.sort_order || 1 });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeletePlaylist = async (plId: string) => {
    if (!window.confirm('ยืนยันการลบบทเรียนและเนื้อหาภายในทั้งหมด?')) return;
    try {
      await tutorApi.deletePlaylist(plId);
      if (editingPlaylistId === plId) {
        setEditingPlaylistId(null);
        setPlaylistForm({ title: '', sort_order: 1 });
      }
      fetchCourses();
    } catch (e) { alert('เกิดข้อผิดพลาด'); }
  };

  const addQuestion = () => {
    setExamQuestions([...examQuestions, { question_text: '', image_url: '', question_type: 'multiple_choice', correct_answer: '', choices: [{ choice_text: '', is_correct: true }] }]);
  };
  const updateQuestion = (index: number, key: string, value: string) => {
    const newQs = [...examQuestions];
    (newQs[index] as any)[key] = value;
    setExamQuestions(newQs);
  };
  const addChoice = (qIndex: number) => {
    const newQs = [...examQuestions];
    newQs[qIndex].choices.push({ choice_text: '', is_correct: false });
    setExamQuestions(newQs);
  };
  const updateChoice = (qIndex: number, cIndex: number, text: string) => {
    const newQs = [...examQuestions];
    newQs[qIndex].choices[cIndex].choice_text = text;
    setExamQuestions(newQs);
  };
  const setCorrectChoice = (qIndex: number, cIndex: number) => {
    const newQs = [...examQuestions];
    newQs[qIndex].choices.forEach((c, idx) => c.is_correct = (idx === cIndex));
    setExamQuestions(newQs);
  };

  const handleEditItem = (item: any) => {
    setEditingItemId(item.id);
    setItemForm({
      title: item.title,
      item_type: item.item_type,
      sort_order: item.sort_order || 1,
      content_url: item.content_url || ''
    });
    if (item.item_type === 'exam') {
      try {
        setExamQuestions(JSON.parse(item.content_data));
      } catch {
        setExamQuestions([{ question_text: '', image_url: '', question_type: 'multiple_choice', correct_answer: '', choices: [{ choice_text: '', is_correct: true }] }]);
      }
    }
    setSelectedFile(null);
  };

  const cancelEditItem = () => {
    setEditingItemId(null);
    setItemForm({ title: '', item_type: 'video', sort_order: 1, content_url: '' });
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
            onUploadProgress: (progressEvent) => {
              if (progressEvent.total) {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                setUploadProgress(percentCompleted);
              }
            }
          });
          
          finalUrl = uploadRes.data.url;
        } else if (!editingItemId) {
          alert('กรุณาเลือกไฟล์');
          setUploading(false);
          return;
        }
      } else {
        finalData = JSON.stringify(examQuestions);
        finalUrl = ""; 
      }

      const payload = {
        title: itemForm.title,
        item_type: itemForm.item_type,
        sort_order: Number(itemForm.sort_order),
        content_url: finalUrl,
        content_data: finalData
      };

      if (editingItemId) {
        await tutorApi.updatePlaylistItem(editingItemId, payload);
        alert('อัปเดตเนื้อหาสำเร็จ!');
      } else {
        await tutorApi.createPlaylistItem(playlistId, payload);
        alert('สร้างเนื้อหาสำเร็จ!');
      }
      
      cancelEditItem();
      fetchCourses();
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการบันทึกเนื้อหา');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm('ยืนยันการลบ?')) return;
    try {
      await tutorApi.deletePlaylistItem(itemId);
      if (editingItemId === itemId) cancelEditItem();
      fetchCourses();
    } catch (e) { alert('เกิดข้อผิดพลาด'); }
  };

  const renderExamEditor = (qIdx: number, q: any, playlistId?: string) => (
    <div key={qIdx} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex gap-2 mb-2">
        <select 
          value={q.question_type || 'multiple_choice'} 
          onChange={(e) => updateQuestion(qIdx, 'question_type', e.target.value)}
          className="p-2 border rounded-md dark:bg-gray-900 dark:text-white outline-none font-bold"
        >
          <option value="multiple_choice">ปรนัย (ตัวเลือก)</option>
          <option value="short_answer">อัตนัย / คำถามปลายเปิด</option>
        </select>
      </div>
      <input type="text" placeholder={`โจทย์ข้อที่ ${qIdx + 1}`} value={q.question_text} onChange={(e) => updateQuestion(qIdx, 'question_text', e.target.value)} className="w-full p-2 mb-2 font-bold border-b outline-none dark:bg-gray-800 dark:text-white focus:border-blue-500" />
      <input type="text" placeholder="URL รูปภาพประกอบโจทย์ (ถ้ามี)" value={q.image_url || ''} onChange={(e) => updateQuestion(qIdx, 'image_url', e.target.value)} className="w-full p-2 mb-3 text-sm border-b outline-none dark:bg-gray-800 dark:text-gray-300 focus:border-blue-500" />
      
      {q.question_type === 'multiple_choice' ? (
        <>
          <div className="space-y-2 pl-4">
            {q.choices.map((c: any, cIdx: number) => (
              <div key={cIdx} className="flex items-center gap-3">
                <input type="radio" name={`correct_${playlistId || 'edit'}_${qIdx}`} checked={c.is_correct} onChange={() => setCorrectChoice(qIdx, cIdx)} className="w-4 h-4 text-blue-600" />
                <input type="text" placeholder={`ตัวเลือกที่ ${cIdx + 1}`} value={c.choice_text} onChange={(e) => updateChoice(qIdx, cIdx, e.target.value)} className={`flex-1 p-2 text-sm border rounded-md dark:bg-gray-900 dark:text-white outline-none ${c.is_correct ? 'border-green-400 bg-green-50' : 'border-gray-200'}`} />
              </div>
            ))}
          </div>
          <button type="button" onClick={() => addChoice(qIdx)} className="mt-3 text-xs font-bold text-blue-600 hover:underline">+ เพิ่มตัวเลือก</button>
        </>
      ) : (
        <div className="mt-2 pl-2">
          <label className="text-xs font-bold text-gray-500 mb-1 block">คำตอบที่ถูกต้อง (หากพิมพ์ไว้ ระบบจะมีช่องให้ผู้เรียนกรอกและตรวจอัตโนมัติ / หากเว้นว่างไว้ จะไม่โชว์ช่องให้กรอก)</label>
          <input 
            type="text" 
            placeholder="เช่น: 120, กรุงเทพมหานคร" 
            value={q.correct_answer || ''} 
            onChange={(e) => updateQuestion(qIdx, 'correct_answer', e.target.value)} 
            className="w-full p-2 text-sm border rounded-md dark:bg-gray-900 dark:text-white outline-none focus:border-blue-500" 
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6 mt-8">
      <h1 className="text-3xl font-black mb-8 dark:text-white">Tutor Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700 h-fit">
          <h2 className="text-xl font-bold mb-4 dark:text-white">สร้างคอร์สใหม่</h2>
          <form onSubmit={handleCreateCourse} className="space-y-4">
            <input type="text" placeholder="ชื่อคอร์ส" required className="w-full p-3 border rounded-xl dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" value={courseForm.title} onChange={e=>setCourseForm({...courseForm, title: e.target.value})} />
            <input type="text" placeholder="URL รูปปกคอร์ส" className="w-full p-3 border rounded-xl dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" value={courseForm.cover_image} onChange={e=>setCourseForm({...courseForm, cover_image: e.target.value})} />
            <input type="number" placeholder="ราคา (บาท)" required className="w-full p-3 border rounded-xl dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" value={courseForm.price} onChange={e=>setCourseForm({...courseForm, price: Number(e.target.value)})} />
            <textarea placeholder="รายละเอียดคอร์ส" rows={4} className="w-full p-3 border rounded-xl dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" value={courseForm.description} onChange={e=>setCourseForm({...courseForm, description: e.target.value})} />
            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition">สร้างคอร์ส</button>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700">
            <h2 className="text-xl font-bold mb-4 dark:text-white">จัดการเนื้อหาคอร์ส</h2>
            <select className="w-full p-3 border rounded-xl mb-6 dark:bg-gray-900 dark:text-white outline-none" onChange={(e) => {
              setSelectedCourse(courses.find(c => c.id === e.target.value));
              setEditingPlaylistId(null);
              cancelEditItem();
            }}>
              <option value="">-- เลือกคอร์ส --</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>

            {selectedCourse && (
              <div className="space-y-6">
                
                {/* Promo Code Form */}
                <div className="p-5 border border-blue-200 bg-blue-50 dark:bg-blue-900/20 rounded-xl mb-6">
                  <h4 className="text-base font-bold text-blue-800 dark:text-blue-300 mb-4">โปรโมโค้ดส่วนลด (Promo Codes)</h4>
                  <form onSubmit={handleCreatePromo} className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                      <label className="block text-xs font-bold text-blue-700 dark:text-blue-400 mb-1">รหัสโค้ดส่วนลด</label>
                      <input type="text" placeholder="เช่น SUMMER50" required className="w-full p-2.5 border rounded-lg dark:bg-gray-900 dark:text-white outline-none focus:border-blue-500" value={promoForm.code} onChange={e=>setPromoForm({...promoForm, code: e.target.value.toUpperCase()})} />
                    </div>
                    <div className="w-full sm:w-32 shrink-0">
                      <label className="block text-xs font-bold text-blue-700 dark:text-blue-400 mb-1">ส่วนลด (บาท)</label>
                      <input type="number" placeholder="0" required min="0" className="w-full p-2.5 border rounded-lg dark:bg-gray-900 dark:text-white outline-none focus:border-blue-500" value={promoForm.discount_amount} onChange={e=>setPromoForm({...promoForm, discount_amount: Number(e.target.value)})} />
                    </div>
                    <div className="w-full sm:w-32 shrink-0">
                      <label className="block text-xs font-bold text-blue-700 dark:text-blue-400 mb-1">โควต้าสิทธิ์ (คน)</label>
                      <input type="number" placeholder="0 = ไม่จำกัด" required min="0" className="w-full p-2.5 border rounded-lg dark:bg-gray-900 dark:text-white outline-none focus:border-blue-500" value={promoForm.max_uses} onChange={e=>setPromoForm({...promoForm, max_uses: Number(e.target.value)})} />
                    </div>
                    <button type="submit" className="bg-blue-600 text-white font-bold px-6 py-2.5 rounded-lg hover:bg-blue-700 transition w-full sm:w-auto h-11.5 whitespace-nowrap">สร้างโค้ด</button>
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
                                            <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded">ลด ฿{pc.discount_amount}</span>
                                        </div>
                                        <div className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                            ถูกใช้ไปแล้ว <span className={pc.max_uses > 0 && pc.uses?.length >= pc.max_uses ? "text-red-500" : "text-blue-600"}>{pc.uses?.length || 0}</span> / {pc.max_uses > 0 ? `${pc.max_uses} สิทธิ์` : 'ไม่จำกัดสิทธิ์'}
                                        </div>
                                    </div>
                                    {pc.uses && pc.uses.length > 0 && (
                                        <div className="text-xs sm:text-right bg-gray-50 dark:bg-gray-900 p-2 rounded-lg border dark:border-gray-700">
                                            <span className="text-gray-400 font-bold block mb-1">รายชื่อผู้ใช้ล่าสุด:</span>
                                            {pc.uses.slice(0, 3).map((u:any, idx:number) => (
                                                <div key={idx} className="text-gray-600 dark:text-gray-300 truncate w-32">{u.student_id}</div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                  </div>
                </div>

                <div className="p-4 border-2 border-dashed border-purple-200 dark:border-purple-900/50 rounded-xl">
                  <h4 className="text-sm font-bold text-purple-600 dark:text-purple-400 mb-3">
                    {editingPlaylistId ? 'แก้ไขบทเรียน' : 'สร้างบทเรียนใหม่'}
                  </h4>
                  <form onSubmit={handleSavePlaylist} className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 flex gap-3">
                      <input type="number" placeholder="ลำดับ" required className="w-20 p-3 border rounded-xl dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500" value={playlistForm.sort_order} onChange={e=>setPlaylistForm({...playlistForm, sort_order: Number(e.target.value)})} />
                      <input type="text" placeholder="ชื่อบทเรียน (เช่น บทที่ 1)" required className="flex-1 p-3 border rounded-xl dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500" value={playlistForm.title} onChange={e=>setPlaylistForm({...playlistForm, title: e.target.value})} />
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white px-6 font-bold rounded-xl transition">
                        {editingPlaylistId ? 'อัปเดต' : '+ เพิ่ม'}
                      </button>
                      {editingPlaylistId && (
                         <button type="button" onClick={() => { setEditingPlaylistId(null); setPlaylistForm({title: '', sort_order: 1}); }} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 font-bold rounded-xl transition">ยกเลิก</button>
                      )}
                    </div>
                  </form>
                </div>

                {selectedCourse.playlists?.map((pl: any) => (
                  <div key={pl.id} className={`bg-gray-50 dark:bg-gray-900 p-5 rounded-xl border transition-colors ${editingPlaylistId === pl.id ? 'border-purple-400' : 'dark:border-gray-700'}`}>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-lg dark:text-white">
                        <span className="text-purple-600 dark:text-purple-400 mr-2 text-sm border border-purple-200 px-2 py-0.5 rounded-full">{pl.sort_order}</span>
                        {pl.title}
                      </h3>
                      <div className="flex gap-2">
                        <button onClick={() => handleEditPlaylist(pl)} className="text-blue-500 hover:text-blue-700 font-bold px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/30 text-sm">แก้ไข</button>
                        <button onClick={() => handleDeletePlaylist(pl.id)} className="text-red-500 hover:text-red-700 font-bold px-2 py-1 rounded bg-red-50 dark:bg-red-900/30 text-sm">ลบ</button>
                      </div>
                    </div>
                    
                    {pl.items && pl.items.length > 0 && (
                      <div className="mb-6 space-y-2">
                        {pl.items.map((it: any) => (
                          <div key={it.id}>
                            {editingItemId === it.id ? (
                              <div className="p-4 bg-white dark:bg-gray-800 border-2 border-blue-400 rounded-xl shadow-md my-4">
                                <h4 className="text-sm font-bold text-blue-600 mb-3">แก้ไขเนื้อหา</h4>
                                <div className="flex gap-3 mb-4">
                                  <input type="number" placeholder="ลำดับ" required className="w-20 p-2 border rounded-lg dark:bg-gray-900 dark:text-white outline-none" value={itemForm.sort_order} onChange={e=>setItemForm({...itemForm, sort_order: Number(e.target.value)})} />
                                  <input type="text" placeholder="ชื่อคลิป/ไฟล์" required className="flex-1 p-2 border rounded-lg dark:bg-gray-900 dark:text-white outline-none" value={itemForm.title} onChange={e=>setItemForm({...itemForm, title: e.target.value})} />
                                  <select className="p-2 border rounded-lg dark:bg-gray-900 dark:text-white outline-none" value={itemForm.item_type} onChange={e=>setItemForm({...itemForm, item_type: e.target.value})}>
                                    <option value="video">วิดีโอ</option>
                                    <option value="file">เอกสาร</option>
                                    <option value="exam">แบบทดสอบ</option>
                                  </select>
                                </div>
                                {itemForm.item_type !== 'exam' && (
                                  <div className="mb-4 text-sm">
                                    <p className="text-gray-500 mb-2">ไฟล์ปัจจุบัน: {itemForm.content_url || 'ไม่มี'}</p>
                                    <input type="file" accept={itemForm.item_type === 'video' ? "video/*" : ".pdf,.doc,.docx,.zip,.rar"} onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)} className="block w-full text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:bg-blue-50 file:text-blue-700" />
                                  </div>
                                )}
                                {itemForm.item_type === 'exam' && (
                                  <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl space-y-4">
                                    {examQuestions.map((q, qIdx) => renderExamEditor(qIdx, q))}
                                    <button type="button" onClick={addQuestion} className="w-full py-1.5 border-2 border-dashed border-gray-300 text-gray-500 rounded hover:bg-gray-100">+ เพิ่มข้อสอบ</button>
                                  </div>
                                )}
                                <div className="flex gap-2">
                                  <button onClick={(e) => handleSaveItem(e, pl.id)} disabled={uploading} className="flex-1 bg-blue-600 text-white font-bold py-2 rounded-lg">{uploading ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}</button>
                                  <button onClick={cancelEditItem} disabled={uploading} className="bg-gray-200 text-gray-800 font-bold px-4 py-2 rounded-lg">ยกเลิก</button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex justify-between items-center text-sm bg-white dark:bg-gray-800 p-3 rounded-lg border dark:border-gray-700 shadow-sm hover:border-blue-300">
                                <span className="font-medium dark:text-gray-200">
                                  <span className="text-gray-400 mr-2 border border-gray-200 px-1.5 rounded">{it.sort_order}</span>
                                  <span className="text-blue-500 uppercase mr-2 tracking-wider">[{it.item_type}]</span>
                                  {it.title}
                                </span>
                                <div className="flex gap-2 shrink-0">
                                  <button onClick={() => handleEditItem(it)} className="text-blue-500 hover:text-blue-700 font-bold px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/30">แก้ไข</button>
                                  <button onClick={() => handleDeleteItem(it.id)} className="text-red-500 hover:text-red-700 font-bold px-2 py-1 rounded bg-red-50 dark:bg-red-900/30">ลบ</button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {!editingItemId && (
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                        <h4 className="text-sm font-bold text-gray-500 mb-3">+ เพิ่มเนื้อหาใหม่ใน "{pl.title}"</h4>
                        <div className="flex gap-3 mb-4">
                          <input type="number" placeholder="ลำดับ" required className="w-20 p-2 border rounded-lg dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" value={itemForm.sort_order} onChange={e=>setItemForm({...itemForm, sort_order: Number(e.target.value)})} />
                          <input type="text" placeholder="ชื่อเนื้อหา (เช่น EP.1 แนะนำ)" required className="flex-1 p-2 border rounded-lg dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" value={itemForm.title} onChange={e=>setItemForm({...itemForm, title: e.target.value})} />
                          <select className="p-2 border rounded-lg dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" value={itemForm.item_type} onChange={e=>setItemForm({...itemForm, item_type: e.target.value})}>
                            <option value="video">วิดีโอ</option>
                            <option value="file">เอกสาร (PDF/ZIP)</option>
                            <option value="exam">แบบทดสอบ</option>
                          </select>
                        </div>

                        {itemForm.item_type !== 'exam' && (
                          <div className="mb-4">
                            <input 
                              type="file" 
                              accept={itemForm.item_type === 'video' ? "video/*" : ".pdf,.doc,.docx,.zip,.rar"}
                              onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                          </div>
                        )}

                        {itemForm.item_type === 'exam' && (
                          <div className="mb-4 p-4 border border-blue-200 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl space-y-4">
                            {examQuestions.map((q, qIdx) => renderExamEditor(qIdx, q, pl.id))}
                            <button type="button" onClick={addQuestion} className="w-full py-2 border-2 border-dashed border-gray-300 text-gray-500 font-bold rounded-lg hover:bg-gray-100 transition">+ เพิ่มข้อสอบ</button>
                          </div>
                        )}

                        {uploading && itemForm.item_type !== 'exam' && (
                          <div className="mb-4">
                            <div className="flex justify-between text-sm font-bold text-gray-700 mb-1">
                              <span>กำลังอัปโหลด...</span><span>{uploadProgress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                              <div className="bg-blue-600 h-full rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                            </div>
                          </div>
                        )}

                        <button 
                          onClick={(e) => handleSaveItem(e, pl.id)} 
                          disabled={uploading || !itemForm.title}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 font-bold rounded-lg transition disabled:opacity-50"
                        >
                          {uploading ? 'กำลังบันทึก...' : 'เพิ่มเนื้อหาใหม่ลงบทเรียนนี้'}
                        </button>
                      </div>
                    )}

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