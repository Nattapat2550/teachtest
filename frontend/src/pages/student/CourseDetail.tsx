import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseApi, studentApi } from '../../services/api';

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [promoCode, setPromoCode] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      courseApi.getCourseDetail(id)
        .then(res => setCourse(res.data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleEnroll = async () => {
    try {
      await studentApi.enrollCourse({ course_id: course.id, promo_code: promoCode });
      alert('ลงทะเบียนสำเร็จ! เริ่มเรียนได้เลย');
      navigate('/my-learning');
    } catch (err: any) {
      alert(err.response?.data?.error || 'เกิดข้อผิดพลาดในการซื้อหลักสูตร (โค้ดอาจไม่ถูกต้อง)');
    }
  };

  if (loading) return <div className="text-center mt-20">กำลังโหลด...</div>;
  if (!course) return <div className="text-center mt-20">ไม่พบหลักสูตร</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 mt-8">
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-md border dark:border-gray-700 flex flex-col md:flex-row gap-8">
        <div className="flex-1">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-4">{course.title}</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{course.description}</p>
          
          <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-2xl border dark:border-gray-700">
            <div className="text-3xl font-black text-blue-600 mb-4">฿ {Number(course.price).toLocaleString()}</div>
            
            <div className="flex gap-4 mb-6">
              <input 
                type="text" 
                placeholder="กรอกโค้ดส่วนลด (ถ้ามี)" 
                className="flex-1 p-3 rounded-xl border outline-none dark:bg-gray-800 dark:text-white"
                value={promoCode}
                onChange={e => setPromoCode(e.target.value)}
              />
            </div>
            
            <button 
              onClick={handleEnroll}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all"
            >
              ซื้อหลักสูตรนี้
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}