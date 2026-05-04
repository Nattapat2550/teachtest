import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useSelector } from 'react-redux';

export default function PackageDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pkg, setPkg] = useState<any>(null);
  const [wallet, setWallet] = useState(0);
  const [promoCode, setPromoCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const { isAuthenticated } = useSelector((state: any) => state.auth);

  useEffect(() => {
    if (id) {
      api.get(`/api/packages/${id}`)
        .then(res => setPkg(res.data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));

      if (isAuthenticated) {
        api.get('/api/users/me/wallet').then(res => {
            setWallet(res.data.balance || 0);
        }).catch(() => {});
      }
    }
  }, [id, isAuthenticated]);

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
    <div className="max-w-4xl mx-auto p-6 mt-8">
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-md border border-purple-200 dark:border-gray-700 flex flex-col md:flex-row gap-8">
        
        {/* คอลัมน์ซ้าย รูปปก */}
        <div className="w-full md:w-1/3">
          <div className="aspect-square bg-gray-100 dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm">
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
                {isAuthenticated && (
                    <div className="text-sm font-bold text-green-600 dark:text-green-400">ยอดเงินของคุณ: ฿{wallet}</div>
                )}
            </div>
            
            <div className="flex gap-4 mb-6">
              <input 
                type="text" 
                placeholder="รหัสโปรโมชั่น (ส่วนลดกลาง)"
                className="flex-1 p-3 rounded-xl border outline-none dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500"
                value={promoCode}
                onChange={e => setPromoCode(e.target.value)}
              />
            </div>
            
            {errorMsg && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-xl text-sm font-bold text-center border border-red-200">
                {errorMsg}
              </div>
            )}

            <button 
              onClick={handleEnrollPackage}
              className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg transition-all"
            >
              สั่งซื้อแพ็กเกจนี้
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}