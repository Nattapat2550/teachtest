import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { courseApi, studentApi } from '../../services/api';
import { useSelector } from 'react-redux';

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [wallet, setWallet] = useState(0);
  const [promoCode, setPromoCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isOwned, setIsOwned] = useState(false);
  const { isAuthenticated } = useSelector((state: any) => state.auth);

  useEffect(() => {
    if (id) {
      courseApi.getCourseDetail(id)
        .then(res => setCourse(res.data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));

      if (isAuthenticated) {
        studentApi.getMyLearning().then(res => {
          if (res.data && res.data.find((l: any) => l.course.id === id)) {
            setIsOwned(true);
          }
        }).catch(() => {});

        api.get('/api/users/me/wallet').then(res => {
            setWallet(res.data.balance || 0);
        }).catch(() => {});
      }
    }
  }, [id, isAuthenticated]);

  const handleEnroll = async () => {
    if (!isAuthenticated) {
        navigate('/login');
        return;
    }
    setErrorMsg('');
    try {
      await studentApi.enrollCourse({ course_id: course.id, promo_code: promoCode });
      alert('ลงทะเบียนสำเร็จ! หักยอดเงินเรียบร้อย กำลังพาไปห้องเรียน...');
      navigate('/my-learning');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'เกิดข้อผิดพลาดในการชำระเงิน');
    }
  };

  if (loading) return <div className="text-center mt-20 ">กำลังโหลด...</div>;
  if (!course) return <div className="text-center mt-20 ">ไม่พบคอร์สเรียน</div>;

  return (
    <div className="max-w-7xl w-full mx-auto p-6 lg:p-10 mt-8">
      <div className="bg-white  rounded-md p-8 shadow-md border  flex flex-col md:flex-row gap-8">
        <div className="flex-1">
          <h1 className="text-3xl font-black text-gray-900  mb-4">{course.title}</h1>
          <p className="text-gray-600  mb-6">{course.description}</p>
          
          <div className="bg-canvas  p-6 rounded-md border ">
            <div className="flex justify-between items-center mb-4">
                <div className="text-3xl font-black text-primary">฿ {Number(course.price).toLocaleString()}</div>
                {!isOwned && isAuthenticated && (
                    <div className="text-sm font-bold text-green-600 ">ยอดเงินของคุณ: ฿{wallet}</div>
                )}
            </div>
            
            {!isOwned && (
              <div className="flex gap-4 mb-6">
                <input 
                  type="text" 
                  placeholder="รหัสโปรโมชั่น (ถ้ามี)"
                  className="flex-1 p-3 rounded-md border outline-none   focus:ring-2 focus:ring-blue-500"
                  value={promoCode}
                  onChange={e => setPromoCode(e.target.value)}
                />
              </div>
            )}
            
            {errorMsg && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm font-bold text-center border border-red-200">
                {errorMsg}
              </div>
            )}

            {isOwned ? (
              <button 
                onClick={() => navigate('/my-learning')}
                className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-md shadow-lg transition-all"
              >
                คอร์สนี้เป็นของคุณแล้ว - ไปที่ห้องเรียน
              </button>
            ) : (
              <button 
                onClick={handleEnroll}
                className="w-full py-4 bg-primary hover:bg-primary-active text-white font-bold rounded-md shadow-lg transition-all"
              >
                ซื้อคอร์สเรียนนี้
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}