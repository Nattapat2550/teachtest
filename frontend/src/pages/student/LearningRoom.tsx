import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { studentApi } from '../../services/api';

export default function LearningRoom() {
  const { enrollmentId } = useParams();
  const navigate = useNavigate();
  const [learningData, setLearningData] = useState<any>(null);
  const [activeItem, setActiveItem] = useState<any>(null);

  useEffect(() => {
    // สมมติว่ามี API ดึงข้อมูลห้องเรียนผ่าน enrollment_id
    studentApi.getMyLearning().then(res => {
      const current = res.data.find((e: any) => e.id === enrollmentId);
      if (current) {
        setLearningData(current);
        // เลือกเนื้อหาแรกอัตโนมัติ
        if (current.course.playlists?.[0]?.items?.[0]) {
          setActiveItem(current.course.playlists[0].items[0]);
        }
      } else {
        navigate('/my-learning');
      }
    });
  }, [enrollmentId]);

  const handleMarkProgress = async (itemId: string) => {
    try {
      await studentApi.updateProgress(enrollmentId!, itemId);
      // อัปเดต UI ชั่วคราวเพื่อให้ผู้ใช้เห็นว่าติ๊กผ่านแล้ว
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

  if (!learningData) return <div className="p-10 text-center">กำลังเตรียมห้องเรียน...</div>;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
      {/* Sidebar: สารบัญหลักสูตร */}
      <div className="w-full md:w-80 bg-white dark:bg-gray-800 border-r dark:border-gray-700 h-[calc(100vh-80px)] overflow-y-auto">
        <div className="p-6 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold dark:text-white leading-snug">{learningData.course.title}</h2>
        </div>
        
        {learningData.course.playlists?.map((pl: any) => (
          <div key={pl.id} className="border-b dark:border-gray-700">
            <div className="px-6 py-4 bg-gray-100 dark:bg-gray-900 font-bold dark:text-gray-200">
              {pl.title}
            </div>
            <div>
              {pl.items?.map((item: any) => (
                <button 
                  key={item.id}
                  onClick={() => setActiveItem(item)}
                  className={`w-full text-left px-6 py-4 flex items-center gap-3 transition-colors ${
                    activeItem?.id === item.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 accent-blue-600"
                    checked={isCompleted(item.id)}
                    onChange={() => handleMarkProgress(item.id)}
                  />
                  <span className="text-sm font-medium dark:text-gray-300">
                    {item.item_type === 'video' ? '🎥' : item.item_type === 'file' ? '📄' : '📝'} {item.title}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Main Content: แสดงวิดีโอ ไฟล์ หรือข้อสอบ */}
      <div className="flex-1 p-6 lg:p-12 overflow-y-auto h-[calc(100vh-80px)]">
        {activeItem ? (
          <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border dark:border-gray-700">
            <h1 className="text-3xl font-black mb-6 dark:text-white">{activeItem.title}</h1>
            
            {activeItem.item_type === 'video' && (
              <div className="aspect-video bg-black rounded-xl overflow-hidden mb-6">
                {/* รองรับ Event onEnded เพื่อบันทึก Progress อัตโนมัติเมื่อดูจบ */}
                <video 
                  controls 
                  className="w-full h-full" 
                  src={activeItem.content_url} 
                  onEnded={() => handleMarkProgress(activeItem.id)}
                />
              </div>
            )}

            {activeItem.item_type === 'file' && (
              <div className="p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl text-center">
                <span className="text-6xl mb-4 block">📁</span>
                <a 
                  href={activeItem.content_url} 
                  target="_blank" rel="noreferrer"
                  onClick={() => handleMarkProgress(activeItem.id)}
                  className="inline-block bg-blue-600 text-white px-8 py-3 rounded-full font-bold shadow-md hover:bg-blue-700"
                >
                  ดาวน์โหลดเอกสารประกอบการเรียน
                </a>
              </div>
            )}

            {activeItem.item_type === 'exam' && (
              <div className="p-8 bg-orange-50 dark:bg-orange-900/20 rounded-2xl text-center border border-orange-200 dark:border-orange-800">
                <h3 className="text-xl font-bold text-orange-800 dark:text-orange-400 mb-4">📝 แบบทดสอบความรู้</h3>
                <button 
                  onClick={() => handleMarkProgress(activeItem.id)}
                  className="bg-orange-500 text-white px-8 py-3 rounded-full font-bold shadow-md hover:bg-orange-600"
                >
                  เริ่มทำข้อสอบ
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-gray-500 mt-20">กรุณาเลือกบทเรียนจากเมนูด้านซ้าย</div>
        )}
      </div>
    </div>
  );
}