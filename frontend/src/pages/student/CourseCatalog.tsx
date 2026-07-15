import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { courseApi, studentApi } from '../../services/api';
import { useSelector } from 'react-redux';

export default function CourseCatalog() {
  const [courses, setCourses] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [myCourses, setMyCourses] = useState<string[]>([]);
  const [wallet, setWallet] = useState(0);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useSelector((state: any) => state.auth);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const resC = await courseApi.getPublishedCourses();
        setCourses(resC.data || []);

        const resP = await api.get('/api/packages');
        setPackages(resP.data || []);

        if (isAuthenticated) {
          const myRes = await studentApi.getMyLearning();
          const ownedIds = (myRes.data || []).map((l: any) => l.course.id);
          setMyCourses(ownedIds);

          const wRes = await api.get('/api/users/me/wallet');
          setWallet(wRes.data.balance || 0);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, [isAuthenticated]);

  const handleTopup = async () => {
    const amountStr = prompt("ระบุจำนวนเงินที่ต้องการเติมเข้าระบบ (จำลอง):");
    if (amountStr && !isNaN(Number(amountStr)) && Number(amountStr) > 0) {
      try {
        await api.post('/api/users/me/wallet/topup', { amount: Number(amountStr) });
        alert(`เติมเงิน ${amountStr} บาท สำเร็จ!`);
        const wRes = await api.get('/api/users/me/wallet');
        setWallet(wRes.data.balance || 0);
      } catch (e) {
        alert("เกิดข้อผิดพลาดในการเติมเงิน");
      }
    }
  };

  if (loading) return <div className="text-center mt-20 ">กำลังโหลด...</div>;

  return (
    <div className="max-w-360 w-full mx-auto p-6 lg:p-8 mt-8">
      
      {/* Wallet Status */}
      {isAuthenticated && (
        <div className="flex items-center justify-between bg-white  p-6 rounded-md shadow-sm border border-blue-200  mb-8">
          <div>
            <h2 className="text-gray-500  font-bold mb-1">ยอดเงินคงเหลือของคุณ</h2>
            <div className="text-3xl font-black text-green-600 ">
              ฿ {wallet.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
          <button 
            onClick={handleTopup}
            className="bg-green-100 hover:bg-green-200 text-green-700 /30 dark:hover:bg-green-900/50  px-6 py-3 rounded-md font-bold transition-all shadow-sm"
          >
            + เติมเงิน
          </button>
        </div>
      )}

      {/* Packages Section */}
      {packages.length > 0 && (
        <div className="mb-12">
          {/* เอา text-purple-600 ออก เปลี่ยนเป็น text-gray-900  */}
          <h1 className="text-3xl font-black mb-6 text-gray-900 ">🔥 แพ็กเกจสุดคุ้ม</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => {
              const isPackageOwned = pkg.course_ids && pkg.course_ids.length > 0 && pkg.course_ids.every((cid: string) => myCourses.includes(cid));
              
              return (
                <div key={pkg.id} className={`bg-white  rounded-md shadow-sm border border-purple-200  p-5 flex flex-col relative transition-all duration-300 ${isPackageOwned ? 'opacity-60 grayscale hover:grayscale-0 hover:opacity-100' : 'hover:shadow-lg hover:-translate-y-1'}`}>
                  <div className={`absolute top-2 right-2 ${isPackageOwned ? 'bg-green-500' : 'bg-purple-500'} text-white text-xs px-3 py-1.5 rounded-full z-10 font-bold shadow-md`}>
                    {isPackageOwned ? 'ซื้อครบแล้ว' : `สุดคุ้ม ${pkg.course_ids?.length || 0} คอร์ส`}
                  </div>
                  <div className="aspect-video bg-gray-100  rounded-md mb-4 overflow-hidden">
                    {pkg.cover_image ? <img src={pkg.cover_image} alt={pkg.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>}
                  </div>
                  <h2 className="font-bold text-lg line-clamp-2  mb-2">{pkg.title}</h2>
                  <p className="text-sm text-gray-500  mb-4 line-clamp-2">{pkg.description}</p>
                  <div className="mt-auto flex justify-between items-center">
                    <p className="text-xl text-purple-600  font-black">
                      {isPackageOwned ? 'คุณมีครบแล้ว' : `฿ ${Number(pkg.price).toLocaleString()}`}
                    </p>
                    <Link 
                      to={isPackageOwned ? `/my-learning` : `/packages/${pkg.id}`}
                      className={`${isPackageOwned ? 'bg-green-600 hover:bg-green-700' : 'bg-primary hover:bg-purple-700'} text-white px-5 py-2.5 rounded-md font-bold shadow-md transition`}
                    >
                      ดูรายละเอียด
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Normal Courses Section */}
      <h1 className="text-3xl font-black mb-8 text-gray-900 ">หลักสูตรทั้งหมด</h1>
      {courses.length === 0 ? (
        <p className="text-gray-500">ยังไม่มีหลักสูตรที่เปิดสอน</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {courses.map((c) => {
            const isOwned = myCourses.includes(c.id);
            return (
              <Link 
                to={isOwned ? `/my-learning` : `/courses/${c.id}`} 
                key={c.id} 
                className={`bg-white  rounded-md shadow-sm border  p-4 flex flex-col relative transition-all duration-300 ${
                  isOwned 
                    ? 'opacity-60 grayscale hover:grayscale-0 hover:opacity-100' 
                    : 'hover:shadow-lg hover:-translate-y-1'
                }`}
              >
                {isOwned && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-3 py-1.5 rounded-full z-10 font-bold shadow-md border border-green-400">
                    ซื้อแล้ว
                  </div>
                )}
                <div className="aspect-video bg-gray-100  rounded-md mb-4 overflow-hidden">
                  {c.cover_image ? <img src={c.cover_image} alt={c.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>}
                </div>
                <h2 className="font-bold text-lg line-clamp-2  mb-2">{c.title}</h2>
                <p className="text-primary  font-black mt-auto">
                  {isOwned ? 'เป็นเจ้าของแล้ว' : `฿ ${Number(c.price).toLocaleString()}`}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}