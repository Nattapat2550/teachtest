import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { studentApi } from '../../services/api';
import { useSelector } from 'react-redux';

export default function PackageDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pkg, setPkg] = useState<any>(null);
  const [wallet, setWallet] = useState(0);
  const [promoCode, setPromoCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isOwned, setIsOwned] = useState(false);
  const { isAuthenticated } = useSelector((state: any) => state.auth);

  useEffect(() => {
    if (id) {
      api.get(`/api/packages/${id}`)
        .then(res => setPkg(res.data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));

      if (isAuthenticated) {
        studentApi.getMyLearning().then(res => {
           // เช็คว่ามีคอร์สครบหมดแล้วหรือยัง
           if (res.data) {
             const ownedIds = res.data.map((l: any) => l.course.id);
             // รอให้ข้อมูล pkg ถูกโหลดมาก่อน ถึงจะเช็คได้
           }
        }).catch(() => {});

        api.get('/api/users/me/wallet').then(res => {
            setWallet(res.data.balance || 0);
        }).catch(() => {});
      }
    }
  }, [id, isAuthenticated]);

  useEffect(() => {
    if (pkg && isAuthenticated) {
        studentApi.getMyLearning().then(res => {
           if (res.data && pkg.course_ids) {
             const ownedIds = res.data.map((l: any) => l.course.id);
             const hasAll = pkg.course_ids.every((cid: string) => ownedIds.includes(cid));
             setIsOwned(hasAll);
           }
        }).catch(() => {});
    }
  }, [pkg, isAuthenticated]);

  const handleEnrollPackage = async () => {
    if (!isAuthenticated) {
        navigate('/login');
        return;
    }
    setErrorMsg('');
    try {
      await api.post('/api/student/enroll-package', { package_id: pkg.id, promo_code: promoCode });
      alert('สั่งซื้อแพ็กเกจสำเร็จ! หักยอดเงินเรียบร้อย คอร์สทั้งหมดเข้าไปในห้องเรียนของคุณแล้ว');
      navigate('/my-learning');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'เกิดข้อผิดพลาดในการชำระเงิน');
    }
  };

  if (loading) return <div className="text-center mt-20 dark:text-white">กำลังโหลด...</div>;
  if (!pkg) return <div className="text-center mt-20 dark:text-white">ไม่พบแพ็กเกจเรียน</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 mt-8 mb-20">
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-md border border-purple-200 dark:border-gray-700 flex flex-col md:flex-row gap-8">
        
        {/* คอลัมน์ซ้าย รูปปก */}
        <div className="w-full md:w-1/3">
          <div className="aspect-square bg-gray-100 dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm relative">
             {isOwned && (
                <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-3 py-1.5 rounded-full z-10 font-bold shadow-md">
                   เป็นเจ้าของแล้ว
                </div>
             )}
             {pkg.cover_image ? <img src={pkg.cover_image} className="w-full h-full object-cover" alt="Cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400">ไม่มีรูปปก</div>}
          </div>
        </div>

        <div className="flex-1">
          <div className="inline-block bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1 rounded-full mb-3">
             แพ็กเกจสุดคุ้มรวม {pkg.course_ids?.length || 0} คอร์ส
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-4">{pkg.title}</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{pkg.description}</p>
          
          <div className="bg-purple-50 dark:bg-gray-900 p-6 rounded-2xl border border-purple-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
                <div className="text-3xl font-black text-purple-600">฿ {Number(pkg.price).toLocaleString()}</div>
                {!isOwned && isAuthenticated && (
                    <div className="text-sm font-bold text-green-600 dark:text-green-400">ยอดเงินของคุณ: ฿{wallet}</div>
                )}
            </div>
            
            {!isOwned && (
              <div className="flex gap-4 mb-6">
                <input 
                  type="text" 
                  placeholder="รหัสโปรโมชั่น (ส่วนลดกลาง)"
                  className="flex-1 p-3 rounded-xl border outline-none dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500"
                  value={promoCode}
                  onChange={e => setPromoCode(e.target.value)}
                />
              </div>
            )}
            
            {errorMsg && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-xl text-sm font-bold text-center border border-red-200">
                {errorMsg}
              </div>
            )}

            {isOwned ? (
              <button 
                onClick={() => navigate('/my-learning')}
                className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg transition-all"
              >
                คุณมีคอร์สครบแล้ว - ไปที่ห้องเรียน
              </button>
            ) : (
              <button 
                onClick={handleEnrollPackage}
                className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg transition-all"
              >
                สั่งซื้อแพ็กเกจนี้
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ส่วนแสดงคอร์สย่อยในแพ็กเกจ */}
      {pkg.included_courses && pkg.included_courses.length > 0 && (
        <div className="mt-12 bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-200 dark:border-gray-700">
           <h3 className="text-xl font-bold mb-6 dark:text-white">คอร์สทั้งหมดที่จะได้รับในแพ็กเกจนี้:</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pkg.included_courses.map((c: any) => (
                  <div key={c.id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-purple-300 transition-colors">
                      {c.cover_image ? (
                        <img src={c.cover_image} alt={c.title} className="w-20 h-14 object-cover rounded-lg shadow-sm" />
                      ) : (
                        <div className="w-20 h-14 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                      )}
                      <span className="font-bold text-gray-800 dark:text-gray-100 line-clamp-2">{c.title}</span>
                  </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
}