import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseApi, studentApi } from '../../services/api';

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [promoCode, setPromoCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (id) {
      courseApi.getCourseDetail(id)
        .then(res => setCourse(res.data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleEnroll = async () => {
    setErrorMsg('');
    try {
      await studentApi.enrollCourse({ course_id: course.id, promo_code: promoCode });
      alert('ลงทะเบียนสำเร็จ! กำลังพาไปห้องเรียน...');
      navigate('/my-learning');
    } catch (err: any) {
      const msg = err.response?.data?.error || 'เกิดข้อผิดพลาด';
      // ดัก Error จาก Backend ถ้าซื้อซ้ำ
      if (msg.includes('already enrolled')) {
        setErrorMsg('คุณมีคอร์สนี้อยู่แล้ว กรุณาไปที่ "ห้องเรียนของฉัน"');
      } else {
        setErrorMsg(msg);
      }
    }
  };

  if (loading) return <div className="text-center mt-20">กำลังโหลด...</div>;
  if (!course) return <div className="text-center mt-20">ไม่พบคอร์สเรียน</div>;

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
                placeholder="รหัสโปรโมชั่น (ถ้ามี)"
                className="flex-1 p-3 rounded-xl border outline-none dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                value={promoCode}
                onChange={e => setPromoCode(e.target.value)}
              />
            </div>
            
            {errorMsg && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-xl text-sm font-bold text-center">
                {errorMsg}
              </div>
            )}

            <button 
              onClick={handleEnroll}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all"
            >
              ซื้อคอร์สเรียนนี้
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}