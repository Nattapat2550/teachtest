import React, { useState } from 'react';
import api from '../services/api'; // ปรับ path ให้ตรงกับโครงสร้างจริง

interface ExamEditorProps {
  examQuestions: any[];
  setExamQuestions: (questions: any[]) => void;
}

export default function ExamEditor({ examQuestions, setExamQuestions }: ExamEditorProps) {
  const [uploading, setUploading] = useState(false);

  const getFullUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const baseUrl = import.meta.env.VITE_API_URL || 'https://teachtest.onrender.com';
    const token = localStorage.getItem('token') || '';
    const path = url.startsWith('/') ? url : `/${url}`;
    const separator = path.includes('?') ? '&' : '?';
    return `${baseUrl}${path}${separator}token=${token}`;
  };

  const updateQuestion = (index: number, key: string, value: any) => {
    const newQs = [...examQuestions];
    newQs[index][key] = value;
    setExamQuestions(newQs);
  };

  const handleUploadQuestionMedia = async (e: React.ChangeEvent<HTMLInputElement>, qIdx: number) => {
    const file = e.target.files?.[0];
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

  return (
    <div className="mb-6 p-6 border border-blue-100 bg-blue-50/30 dark:bg-blue-900/10 rounded-2xl space-y-6">
      <h3 className="font-bold text-blue-800 dark:text-blue-300">📝 ตัวจัดการแบบทดสอบ</h3>
      {examQuestions.map((q, qIdx) => (
        <div key={qIdx} className="p-5 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-all">
          <div className="flex justify-between items-center mb-4">
            <span className="font-bold text-gray-500">ข้อที่ {qIdx + 1}</span>
            <select 
              value={q.question_type || 'multiple_choice'} 
              onChange={(e) => updateQuestion(qIdx, 'question_type', e.target.value)} 
              className="p-2 border border-gray-200 rounded-lg dark:bg-gray-900 dark:border-gray-700 dark:text-white outline-none font-bold text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500"
            >
              <option value="multiple_choice">🔘 ปรนัย (ตัวเลือก)</option>
              <option value="short_answer">✍️ อัตนัย (เติมคำ)</option>
            </select>
          </div>
          
          <input 
            type="text" 
            placeholder="ตั้งคำถามที่นี่..." 
            value={q.question_text} 
            onChange={(e) => updateQuestion(qIdx, 'question_text', e.target.value)} 
            className="w-full p-3 mb-4 border border-gray-200 rounded-xl outline-none dark:bg-gray-900 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500" 
          />
          
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
            <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">📸 แนบสื่อประกอบ (รูปภาพ/วิดีโอ)</label>
            <input 
              type="file" 
              accept="image/*,video/*" 
              onChange={(e) => handleUploadQuestionMedia(e, qIdx)} 
              disabled={uploading}
              className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 cursor-pointer w-full transition-colors" 
            />
            {uploading && <span className="text-xs text-blue-500 ml-2 animate-pulse">กำลังอัปโหลด...</span>}
            
            {q.image_url && (
              <div className="mt-4 relative inline-block">
                {q.image_url.match(/\.(mp4|webm|mov)$/i) ? (
                  <video src={getFullUrl(q.image_url)} controls className="max-w-xs rounded-xl shadow-sm border border-gray-200 dark:border-gray-700" />
                ) : (
                  <img src={getFullUrl(q.image_url)} alt="Media" className="max-w-xs rounded-xl shadow-sm border border-gray-200 dark:border-gray-700" />
                )}
                <button type="button" onClick={() => updateQuestion(qIdx, 'image_url', '')} className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-600 shadow-md">✕</button>
              </div>
            )}
          </div>

          {q.question_type === 'multiple_choice' ? (
            <div className="space-y-3">
              <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">ตัวเลือกคำตอบ (เลือกข้อที่ถูก)</label>
              {q.choices.map((c: any, cIdx: number) => (
                <div key={cIdx} className="flex items-center gap-3">
                  <input 
                    type="radio" 
                    name={`correct_${qIdx}`}
                    checked={c.is_correct} 
                    className="w-5 h-5 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    onChange={() => { 
                      const newQs = [...examQuestions]; 
                      newQs[qIdx].choices.forEach((ch: any, idx: number) => ch.is_correct = (idx === cIdx)); 
                      setExamQuestions(newQs); 
                    }} 
                  />
                  <input 
                    type="text" 
                    placeholder={`ตัวเลือกที่ ${cIdx + 1}`}
                    value={c.choice_text} 
                    onChange={(e) => { 
                      const newQs = [...examQuestions]; 
                      newQs[qIdx].choices[cIdx].choice_text = e.target.value; 
                      setExamQuestions(newQs); 
                    }} 
                    className={`flex-1 border rounded-lg p-3 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 transition-all ${c.is_correct ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'}`} 
                  />
                  {q.choices.length > 2 && (
                    <button type="button" onClick={() => {
                      const newQs = [...examQuestions];
                      newQs[qIdx].choices.splice(cIdx, 1);
                      setExamQuestions(newQs);
                    }} className="text-red-400 hover:text-red-600 font-bold p-2">ลบ</button>
                  )}
                </div>
              ))}
              <button 
                type="button" 
                onClick={() => { 
                  const newQs = [...examQuestions]; 
                  newQs[qIdx].choices.push({ choice_text: '', is_correct: false }); 
                  setExamQuestions(newQs); 
                }} 
                className="mt-2 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg font-bold transition-colors"
              >
                + เพิ่มตัวเลือก
              </button>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">เฉลยคำตอบ (เว้นว่างไว้หากต้องการตรวจด้วยตัวเอง)</label>
              <input 
                type="text" 
                placeholder="คำตอบที่ถูกต้อง..." 
                value={q.correct_answer || ''} 
                onChange={(e) => updateQuestion(qIdx, 'correct_answer', e.target.value)} 
                className="w-full p-3 border border-gray-200 rounded-xl dark:bg-gray-900 dark:border-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>
          )}
          
          {examQuestions.length > 1 && (
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 text-right">
              <button type="button" onClick={() => {
                const newQs = [...examQuestions];
                newQs.splice(qIdx, 1);
                setExamQuestions(newQs);
              }} className="text-sm text-red-500 hover:text-red-700 font-bold">🗑️ ลบข้อสอบข้อนี้</button>
            </div>
          )}
        </div>
      ))}
      <button 
        type="button" 
        onClick={() => setExamQuestions([...examQuestions, { question_text: '', image_url: '', question_type: 'multiple_choice', correct_answer: '', choices: [{ choice_text: '', is_correct: true }, { choice_text: '', is_correct: false }] }])} 
        className="w-full py-4 border-2 border-dashed border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 font-bold rounded-2xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all text-lg"
      >
        + เพิ่มข้อสอบใหม่
      </button>
    </div>
  );
}