import React, { useState, useEffect } from 'react';
import api, { tutorApi } from '../../services/api';

export default function TutorDashboard() {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [courseForm, setCourseForm] = useState({ title: '', price: 0, description: '', cover_image: '' });
  const [playlistForm, setPlaylistForm] = useState({ title: '', sort_order: 1 });
  const [itemForm, setItemForm] = useState({ title: '', item_type: 'video', sort_order: 1 });
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); 
  
  const [examQuestions, setExamQuestions] = useState([
    { question_text: '', choices: [{ choice_text: '', is_correct: true }] }
  ]);
  const [promoForm, setPromoForm] = useState({ code: '', discount_amount: 0 });

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

  // 🌟 จุดที่เพิ่มเพื่อแก้บัค: ดึงข้อมูลคอร์สทันทีที่เปิดหน้านี้ขึ้นมา
  useEffect(() => {
    fetchCourses();
  }, []);

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

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    try {
      await tutorApi.createPlaylist(selectedCourse.id, playlistForm);
      setPlaylistForm({ title: '', sort_order: 1 });
      fetchCourses();
    } catch (e) { alert('เกิดข้อผิดพลาด'); }
  };

  const addQuestion = () => {
    setExamQuestions([...examQuestions, { question_text: '', choices: [{ choice_text: '', is_correct: true }] }]);
  };
  const updateQuestion = (index: number, text: string) => {
    const newQs = [...examQuestions];
    newQs[index].question_text = text;
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

  const handleCreateItem = async (e: React.FormEvent, playlistId: string) => {
    e.preventDefault();
    setUploading(true);
    setUploadProgress(0);

    try {
      let finalUrl = "";
      let finalData = "";

      if (itemForm.item_type !== 'exam') {
        if (!selectedFile) {
          alert('กรุณาเลือกไฟล์');
          setUploading(false);
          return;
        }
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
      } else {
        finalData = JSON.stringify(examQuestions);
      }

      const payload = {
        title: itemForm.title,
        item_type: itemForm.item_type,
        sort_order: itemForm.sort_order,
        content_url: finalUrl,
        content_data: finalData
      };
      await tutorApi.createPlaylistItem(playlistId, payload);
      
      setItemForm({ title: '', item_type: 'video', sort_order: 1 });
      setSelectedFile(null);
      setExamQuestions([{ question_text: '', choices: [{ choice_text: '', is_correct: true }] }]);
      
      fetchCourses();
      alert('สร้างเนื้อหาสำเร็จ!');
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการสร้างเนื้อหา');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm('ยืนยันการลบ?')) return;
    try {
      await tutorApi.deletePlaylistItem(itemId);
      fetchCourses();
    } catch (e) { alert('เกิดข้อผิดพลาด'); }
  };

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
            <select className="w-full p-3 border rounded-xl mb-6 dark:bg-gray-900 dark:text-white outline-none" onChange={(e) => setSelectedCourse(courses.find(c => c.id === e.target.value))}>
              <option value="">-- เลือกคอร์ส --</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>

            {selectedCourse && (
              <div className="space-y-6">
                
                <form onSubmit={handleCreatePlaylist} className="flex gap-4">
                  <input type="text" placeholder="ชื่อบทเรียน (เช่น บทที่ 1)" required className="flex-1 p-3 border rounded-xl dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500" value={playlistForm.title} onChange={e=>setPlaylistForm({...playlistForm, title: e.target.value})} />
                  <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white px-6 font-bold rounded-xl transition">+ เพิ่มบทเรียน</button>
                </form>

                {selectedCourse.playlists?.map((pl: any) => (
                  <div key={pl.id} className="bg-gray-50 dark:bg-gray-900 p-5 rounded-xl border dark:border-gray-700">
                    <h3 className="font-bold text-lg mb-4 dark:text-white">{pl.title}</h3>
                    
                    {pl.items && pl.items.length > 0 && (
                      <div className="mb-6 space-y-2">
                        {pl.items.map((it: any) => (
                          <div key={it.id} className="flex justify-between items-center text-sm bg-white dark:bg-gray-800 p-3 rounded-lg border dark:border-gray-700 shadow-sm">
                            <span className="font-medium dark:text-gray-200">
                              <span className="text-gray-400 uppercase mr-2">[{it.item_type}]</span>
                              {it.title}
                            </span>
                            <button onClick={() => handleDeleteItem(it.id)} className="text-red-500 hover:text-red-700 font-bold px-2 py-1 rounded bg-red-50 dark:bg-red-900/30">ลบ</button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                      <h4 className="text-sm font-bold text-gray-500 mb-3">เพิ่มเนื้อหาใน "{pl.title}"</h4>
                      <div className="flex gap-3 mb-4">
                        <input type="text" placeholder="ชื่อคลิป/ไฟล์ (เช่น EP.1 แนะนำ)" required className="flex-1 p-2 border rounded-lg dark:bg-gray-800 dark:text-white outline-none" value={itemForm.title} onChange={e=>setItemForm({...itemForm, title: e.target.value})} />
                        <select className="p-2 border rounded-lg dark:bg-gray-800 dark:text-white outline-none" value={itemForm.item_type} onChange={e=>setItemForm({...itemForm, item_type: e.target.value})}>
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
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400"
                          />
                        </div>
                      )}

                      {itemForm.item_type === 'exam' && (
                        <div className="mb-4 p-4 border border-blue-200 bg-blue-50/50 dark:bg-blue-900/10 dark:border-blue-800 rounded-xl space-y-6">
                          {examQuestions.map((q, qIdx) => (
                            <div key={qIdx} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                              <input 
                                type="text" 
                                placeholder={`โจทย์ข้อที่ ${qIdx + 1}`} 
                                value={q.question_text}
                                onChange={(e) => updateQuestion(qIdx, e.target.value)}
                                className="w-full p-2 mb-3 font-bold border-b border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white outline-none focus:border-blue-500"
                              />
                              
                              <div className="space-y-2 pl-4">
                                {q.choices.map((c, cIdx) => (
                                  <div key={cIdx} className="flex items-center gap-3">
                                    <input 
                                      type="radio" 
                                      name={`correct_${qIdx}`}
                                      checked={c.is_correct}
                                      onChange={() => setCorrectChoice(qIdx, cIdx)}
                                      className="w-4 h-4 text-blue-600 cursor-pointer"
                                    />
                                    <input 
                                      type="text" 
                                      placeholder={`ตัวเลือกที่ ${cIdx + 1}`} 
                                      value={c.choice_text}
                                      onChange={(e) => updateChoice(qIdx, cIdx, e.target.value)}
                                      className={`flex-1 p-2 text-sm border rounded-md dark:bg-gray-900 dark:text-white outline-none ${c.is_correct ? 'border-green-400 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-700'}`}
                                    />
                                  </div>
                                ))}
                              </div>
                              <button type="button" onClick={() => addChoice(qIdx)} className="mt-3 text-xs font-bold text-blue-600 dark:text-blue-400 pl-4 hover:underline">+ เพิ่มตัวเลือก</button>
                            </div>
                          ))}
                          <button type="button" onClick={addQuestion} className="w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 font-bold rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                            + เพิ่มข้อสอบ
                          </button>
                        </div>
                      )}

                      {uploading && itemForm.item_type !== 'exam' && (
                        <div className="mb-4">
                          <div className="flex justify-between text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                            <span>กำลังอัปโหลด...</span>
                            <span>{uploadProgress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 overflow-hidden">
                            <div 
                              className="bg-blue-600 h-full rounded-full transition-all duration-300" 
                              style={{ width: `${uploadProgress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      <button 
                        onClick={(e) => handleCreateItem(e, pl.id)} 
                        disabled={uploading || !itemForm.title}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 font-bold rounded-lg transition disabled:opacity-50"
                      >
                        {uploading ? 'กำลังบันทึก...' : 'บันทึกเนื้อหาลงบทเรียนนี้'}
                      </button>

                    </div>
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