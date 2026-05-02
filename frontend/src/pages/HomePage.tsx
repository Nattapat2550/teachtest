import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { courseApi } from '../services/api';
import heroImg from '../assets/hero.png';
import ideaImg from '../assets/idea.png';

export default function HomePage() {
  const [carousels, setCarousels] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // โหลดแบนเนอร์, เอกสาร และ คอร์สเรียนล่าสุด (ตัดระบบ Promo ของ Mall ออก)
        const [carouselRes, docRes, courseRes] = await Promise.all([
          api.get('/api/carousel').catch(() => ({ data: [] })), 
          api.get('/api/documents/list').catch(() => ({ data: [] })),
          courseApi.getPublishedCourses().catch(() => ({ data: [] }))
        ]);
        setCarousels(carouselRes.data || []);
        setDocuments(docRes.data || []);
        setCourses((courseRes.data || []).slice(0, 4)); // แสดงแค่ 4 คอร์สล่าสุดหน้าแรก
      } catch (err: any) { 
        console.error("Failed to load initial data"); 
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (carousels.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % carousels.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [carousels.length]);

  return (
    <div className="w-full overflow-x-hidden bg-gray-50 dark:bg-gray-900 pb-20 transition-colors duration-300">
      {/* 1. Hero Section */}
      <div className="relative bg-linear-to-br from-indigo-900 via-purple-900 to-black text-white overflow-hidden">
        <div className="w-full px-6 lg:px-12 2xl:px-20 py-16 lg:py-24 relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="text-center md:text-left flex-1">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight tracking-tight drop-shadow-lg">
              Unlock Your <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-pink-400">Learning</span> Journey
            </h1>
            <p className="text-lg md:text-xl text-gray-300 font-medium max-w-2xl mx-auto md:mx-0 mb-8">
              อัปสกิลของคุณกับคอร์สเรียนคุณภาพ ติดตามความคืบหน้าได้ทุกที่ทุกเวลา
            </p>
            <Link to="/courses" className="inline-block bg-linear-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3.5 px-10 rounded-full shadow-lg hover:scale-105 transition-all">
              ดูคอร์สเรียนทั้งหมด
            </Link>
          </div>
          <div className="flex-1 flex justify-center md:justify-end">
            <div className="relative w-64 md:w-80 lg:w-96">
              <img src={heroImg} alt="Hero" className="w-full h-auto relative z-10 drop-shadow-2xl" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Carousel Section */}
      {carousels.length > 0 && (
        <div className="w-full px-6 lg:px-12 2xl:px-20 mt-10">
          <div className="relative w-full h-62.5 md:h-100 lg:h-112.5 rounded-3xl overflow-hidden shadow-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            {carousels.map((c, idx) => (
              <div key={c.id} className={`absolute inset-0 transition-opacity duration-1000 ${idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
                {c.link_url ? (
                  <a href={c.link_url} target="_blank" rel="noopener noreferrer" className="w-full h-full block">
                    <img src={c.image_url} alt={`Banner ${idx}`} className="w-full h-full object-cover" />
                  </a>
                ) : (
                  <img src={c.image_url} alt={`Banner ${idx}`} className="w-full h-full object-cover" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Latest Courses Section */}
      {courses.length > 0 && (
        <div className="w-full px-6 lg:px-12 2xl:px-20 mt-16 md:mt-24">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
              📚 คอร์สเรียนแนะนำ
            </h2>
            <Link to="/courses" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">ดูทั้งหมด &gt;</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {courses.map(c => (
              <Link to={`/courses/${c.id}`} key={c.id} className="group bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col">
                <div className="h-48 bg-gray-100 dark:bg-gray-900 overflow-hidden">
                  {c.cover_image ? <img src={c.cover_image} alt="Cover" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"/> : <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>}
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-xl font-black mb-2 text-gray-900 dark:text-white line-clamp-2">{c.title}</h3>
                  <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <span className="text-xl font-black text-green-600 dark:text-green-400">฿ {Number(c.price).toLocaleString()}</span>
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-sm font-bold">ดูรายละเอียด</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 4. Documents Section */}
      {documents.length > 0 && (
        <div className="w-full px-6 lg:px-12 2xl:px-20 mt-16 md:mt-24">
          <div className="flex items-center gap-4 mb-10">
            <div className="p-3 bg-blue-500/10 dark:bg-blue-500/20 rounded-2xl">
              <img src={ideaImg} className="w-6 h-6 object-contain dark:invert" alt="Documents" />
            </div>
            <h2 className="text-2xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight">เอกสารและบทความ</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {documents.map(d => (
              <div key={d.id} className="group bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
                <div className="h-48 bg-gray-100 dark:bg-gray-900">
                  {d.cover_image ? <img src={d.cover_image} className="w-full h-full object-cover group-hover:scale-110 transition-transform"/> : <div className="w-full h-full flex items-center justify-center">No Image</div>}
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-black mb-4 dark:text-white line-clamp-2">{d.title}</h3>
                  <Link to={`/documents/${d.id}`} className="block text-center w-full bg-gray-50 dark:bg-gray-900 group-hover:bg-blue-600 dark:text-white group-hover:text-white font-bold py-3 rounded-xl transition-all">อ่านต่อ</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}