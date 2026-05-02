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

  if (loading) return <div className="text-center mt-20 dark:text-white">กำลังโหลด...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 mt-8 min-h-screen">
      <h1 className="text-3xl font-black mb-8 dark:text-white">คอร์สเรียนของฉัน</h1>
      {learnings.length === 0 ? (
        <p className="text-gray-500 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm">คุณยังไม่มีคอร์สเรียน</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {learnings.map((l) => (
            <div key={l.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border dark:border-gray-700 p-5 flex flex-col">
              <div className="aspect-video bg-gray-100 dark:bg-gray-900 rounded-xl mb-4 overflow-hidden">
                {l.course.cover_image && <img src={l.course.cover_image} alt={l.course.title} className="w-full h-full object-cover" />}
              </div>
              <h2 className="font-bold text-lg line-clamp-2 mb-4 dark:text-white">{l.course.title}</h2>
              <Link to={`/learn/${l.id}`} className="mt-auto bg-green-600 hover:bg-green-700 text-white text-center py-3 rounded-xl font-bold shadow-md transition">
                เข้าเรียน
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}