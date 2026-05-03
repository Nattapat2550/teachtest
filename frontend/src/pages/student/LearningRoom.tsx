import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { studentApi } from '../../services/api';

export default function LearningRoom() {
  const { enrollmentId } = useParams();
  const navigate = useNavigate();
  const [learningData, setLearningData] = useState<any>(null);
  const [activeItem, setActiveItem] = useState<any>(null);

  useEffect(() => {
    studentApi.getMyLearning().then(res => {
      const current = res.data.find((e: any) => e.id === enrollmentId);
      if (current) {
        setLearningData(current);
        if (current.course.playlists?.[0]?.items?.[0]) {
          setActiveItem(current.course.playlists[0].items[0]);
        }
      } else {
        navigate('/my-learning');
      }
    });
  }, [enrollmentId, navigate]);

  const handleMarkProgress = async (itemId: string) => {
    try {
      await studentApi.updateProgress(enrollmentId!, itemId);
      const updatedData = { ...learningData };
      updatedData.progress = updatedData.progress || [];
      updatedData.progress.push({ item_id: itemId, is_completed: true });
      setLearningData(updatedData);
    } catch (e) {
      console.error('Failed to update progress', e);
    }
  };

  const isCompleted = (itemId: string) => {
    return learningData?.progress?.some((p: any) => p.item_id === itemId && p.is_completed);
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const video = e.target as HTMLVideoElement;
    const percentWatched = video.currentTime / video.duration;
    if (percentWatched >= 0.95 && !isCompleted(activeItem.id)) {
      handleMarkProgress(activeItem.id);
    }
  };

  // 🌟 ฟังก์ชันจัดการ URL รองรับทั้ง URL ที่มี HTTP และ URL เก่าที่บันทึกมาแค่ /uploads/...
  const getFullUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const baseUrl = api.defaults.baseURL || 'https://teachtest.onrender.com';
    return `${baseUrl}${url}`;
  };

  if (!learningData) return <div className="flex justify-center items-center h-screen">กำลังโหลด...</div>;

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-80px)] bg-gray-50 dark:bg-gray-900">
      
      {/* Sidebar: Course Playlist */}
      <div className="w-full md:w-96 bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex flex-col shadow-lg z-10">
        <div className="p-6 bg-linear-to-r from-blue-600 to-indigo-600 text-white">
          <h2 className="text-xl font-black leading-snug">{learningData.course.title}</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {learningData.course.playlists?.map((pl: any) => (
            <div key={pl.id} className="border-b dark:border-gray-700">
              <div className="px-6 py-4 bg-gray-100 dark:bg-gray-900/50 font-bold dark:text-gray-200 text-sm tracking-wide">
                {pl.title}
              </div>
              <div className="flex flex-col">
                {pl.items?.map((item: any) => {
                  const completed = isCompleted(item.id);
                  const active = activeItem?.id === item.id;
                  return (
                    <button 
                      key={item.id}
                      onClick={() => setActiveItem(item)}
                      className={`w-full text-left px-6 py-4 flex items-start gap-4 transition-all border-l-4 ${
                        active ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-600' : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className={`mt-0.5 shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        completed ? 'bg-green-500 border-green-500' : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {completed && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <div className="flex flex-col">
                        <span className={`text-sm font-semibold ${active ? 'text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                          {item.title}
                        </span>
                        <span className="text-xs text-gray-400 mt-1 uppercase tracking-wider">{item.item_type}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 lg:p-10 overflow-y-auto bg-gray-50 dark:bg-gray-900">
        {activeItem ? (
          <div className="max-w-5xl mx-auto">
            <h1 className="text-3xl font-black mb-8 text-gray-900 dark:text-white">{activeItem.title}</h1>
            
            {activeItem.item_type === 'video' && (
              <div className="bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-gray-900/10 mb-8">
                <video 
                  controls 
                  className="w-full aspect-video outline-none" 
                  src={getFullUrl(activeItem.content_url)} 
                  onTimeUpdate={handleTimeUpdate}
                />
              </div>
            )}

            {activeItem.item_type === 'file' && (
              <div className="bg-white dark:bg-gray-800 p-12 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm text-center">
                <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">เอกสารประกอบการเรียน</h3>
                <a 
                  href={getFullUrl(activeItem.content_url)} 
                  target="_blank" rel="noreferrer"
                  onClick={() => handleMarkProgress(activeItem.id)}
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:bg-blue-700 hover:-translate-y-1 transition-all"
                >
                  ดาวน์โหลดเอกสาร
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <svg className="w-20 h-20 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <p className="text-xl font-medium">เลือกบทเรียนจากเมนูด้านซ้ายเพื่อเริ่มต้น</p>
          </div>
        )}
      </div>
    </div>
  );
}