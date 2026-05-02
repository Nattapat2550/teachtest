import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { courseApi } from '../../services/api';

export default function CourseCatalog() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    courseApi.getPublishedCourses()
      .then(res => setCourses(res.data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center mt-20 dark:text-white">กำลังโหลด...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 mt-8">
      <h1 className="text-3xl font-black mb-8 dark:text-white">หลักสูตรทั้งหมด</h1>
      {courses.length === 0 ? (
        <p className="text-gray-500">ยังไม่มีหลักสูตรที่เปิดสอน</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {courses.map((c) => (
            <Link to={`/courses/${c.id}`} key={c.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border dark:border-gray-700 p-4 hover:shadow-md transition flex flex-col">
              <div className="aspect-video bg-gray-100 dark:bg-gray-900 rounded-xl mb-4 overflow-hidden">
                {c.cover_image ? <img src={c.cover_image} alt={c.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>}
              </div>
              <h2 className="font-bold text-lg line-clamp-2 dark:text-white mb-2">{c.title}</h2>
              <p className="text-blue-600 dark:text-blue-400 font-black mt-auto">฿ {Number(c.price).toLocaleString()}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}