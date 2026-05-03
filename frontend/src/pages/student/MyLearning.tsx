import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { studentApi } from '../../services/api';

export default function MyLearning() {
  const [learnings, setLearnings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentApi.getMyLearning()
      .then(res => setLearnings(res.data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // 🌟 ฟังก์ชันคำนวณเปอร์เซ็นต์ความคืบหน้าของคอร์ส
  const calculateProgress = (courseData: any) => {
    let totalItems = 0;
    courseData.playlists?.forEach((pl: any) => {
      totalItems += pl.items?.length || 0;
    });
    const completedItems = courseData.progress?.filter((p: any) => p.is_completed).length || 0;
    if (totalItems === 0) return 0;
    return Math.round((completedItems / totalItems) * 100);
  };

  if (loading) return <div className="text-center mt-20 dark:text-white">กำลังโหลด...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 mt-8 min-h-screen">
      <h1 className="text-3xl font-black mb-8 dark:text-white">คอร์สเรียนของฉัน</h1>
      {learnings.length === 0 ? (
        <p className="text-gray-500 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm">คุณยังไม่มีคอร์สเรียน</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {learnings.map((l) => {
            const percent = calculateProgress(l.course);

            return (
              <div key={l.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border dark:border-gray-700 p-5 flex flex-col">
                <div className="aspect-video bg-gray-100 dark:bg-gray-900 rounded-xl mb-4 overflow-hidden">
                  {l.course.cover_image && <img src={l.course.cover_image} alt={l.course.title} className="w-full h-full object-cover" />}
                </div>
                <h2 className="font-bold text-lg line-clamp-2 mb-2 dark:text-white">{l.course.title}</h2>
                
                {/* 🌟 แสดงหลอด Progress Bar ในการ์ดคอร์สเรียน */}
                <div className="mb-6 mt-auto">
                  <div className="flex justify-between text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">
                    <span>ความคืบหน้า</span>
                    <span className="text-blue-600 dark:text-blue-400">{percent}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700 overflow-hidden">
                    <div className="bg-green-500 h-full rounded-full transition-all duration-500" style={{ width: `${percent}%` }}></div>
                  </div>
                </div>

                <Link to={`/learn/${l.id}`} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white text-center py-3 rounded-xl font-bold shadow-md transition">
                  เข้าเรียนต่อ
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}