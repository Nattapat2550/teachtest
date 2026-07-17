import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useSWR from 'swr';
import { BookOpen, FileText, ChevronRight } from 'lucide-react';
import api, { courseApi } from '../services/api';
import heroImg from '../assets/hero.png';
import ideaImg from '../assets/idea.png';

const fetcher = (url: string) => api.get(url).then(res => res.data);

export default function HomePage() {
  const { data: carouselsData, isLoading: isCarouselsLoading } = useSWR('/api/carousel', fetcher);
  const { data: documentsData, isLoading: isDocumentsLoading } = useSWR('/api/documents/list', fetcher);
  const { data: coursesData, isLoading: isCoursesLoading } = useSWR('courses-published', () => courseApi.getPublishedCourses().then(res => res.data));

  const carousels = carouselsData || [];
  const documents = documentsData || [];
  const courses = (coursesData || []).slice(0, 4);

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (carousels.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % carousels.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [carousels.length]);

  return (
    <div className="w-full overflow-x-hidden bg-canvas  pb-20 transition-colors duration-300">
      {/* 1. Hero Section - Apple Studio Style */}
      <div className="relative bg-white  text-gray-900  overflow-hidden border-b border-gray-200 ">
        <div className="absolute inset-0 bg-linear-to-br from-gray-50 to-gray-200 dark:from-gray-900 dark:to-black opacity-50"></div>
        <div className="w-full px-6 lg:px-12 2xl:px-20 py-24 lg:py-32 relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="text-center md:text-left flex-1">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-semibold mb-6 leading-tight tracking-tighter">
              Unlock Your <br className="hidden md:block" />
              <span className="text-gray-400 ">Learning</span> Journey
            </h1>
            <p className="text-lg md:text-2xl text-gray-500  font-medium max-w-2xl mx-auto md:mx-0 mb-10 tracking-tight">
              อัปสกิลของคุณกับคอร์สเรียนคุณภาพ ติดตามความคืบหน้าได้ทุกที่ทุกเวลา
            </p>
            <Link to="/courses" className="inline-flex items-center gap-2 bg-zinc-950  text-white  font-semibold py-4 px-10 rounded-full hover:scale-105 transition-transform duration-300">
              ดูคอร์สเรียนทั้งหมด <ChevronRight size={20} />
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
      {isCarouselsLoading ? (
        <div className="w-full px-6 lg:px-12 2xl:px-20 mt-10">
           <div className="w-full h-62.5 md:h-100 lg:h-112.5 rounded-[2rem] bg-gray-200  animate-pulse"></div>
        </div>
      ) : carousels.length > 0 && (
        <div className="w-full px-6 lg:px-12 2xl:px-20 mt-10">
          <div className="relative w-full h-62.5 md:h-100 lg:h-112.5 rounded-[2rem] overflow-hidden shadow-2xl bg-white  border border-gray-100 ">
            {carousels.map((c: any, idx: number) => (
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
      {isCoursesLoading ? (
        <div className="w-full px-6 lg:px-12 2xl:px-20 mt-16 md:mt-24">
           <div className="h-10 w-48 bg-gray-200  rounded-md animate-pulse mb-10"></div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
             {[1,2,3,4].map(i => <div key={i} className="h-80 bg-gray-200  rounded-[2rem] animate-pulse"></div>)}
           </div>
        </div>
      ) : courses.length > 0 && (
        <div className="w-full px-6 lg:px-12 2xl:px-20 mt-16 md:mt-24">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl md:text-4xl font-semibold text-gray-900  tracking-tight flex items-center gap-3">
              <BookOpen className="text-gray-400" size={32} /> คอร์สเรียนแนะนำ
            </h2>
            <Link to="/courses" className="text-gray-500 hover:text-black dark:hover:text-white font-medium flex items-center transition-colors">ดูทั้งหมด <ChevronRight size={20}/></Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {courses.map((c: any) => (
              <Link to={`/courses/${c.id}`} key={c.id} className="group apple-glass rounded-[2rem] overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col">
                <div className="h-56 bg-gray-100  overflow-hidden relative">
                  {c.cover_image ? <img src={c.cover_image} alt="Cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"/> : <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>}
                  <div className="absolute inset-0 bg-zinc-950/0 group-hover:bg-zinc-950/10 transition-colors duration-500"></div>
                </div>
                <div className="p-6 flex flex-col flex-1 bg-white/50 /50">
                  <h3 className="text-xl font-semibold mb-2 text-gray-900  line-clamp-2 tracking-tight">{c.title}</h3>
                  <div className="mt-auto pt-4 flex justify-between items-center">
                    <span className="text-xl font-semibold text-gray-900 ">฿ {Number(c.price).toLocaleString()}</span>
                    <span className="bg-gray-100  text-gray-900  px-4 py-2 rounded-full text-sm font-medium">รายละเอียด</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 4. Documents Section */}
      {isDocumentsLoading ? null : documents.length > 0 && (
        <div className="w-full px-6 lg:px-12 2xl:px-20 mt-16 md:mt-24">
          <div className="flex items-center gap-4 mb-10">
            <div className="p-3 bg-gray-100  rounded-md">
              <FileText className="text-gray-600 " size={28} />
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold text-gray-900  tracking-tight">เอกสารและบทความ</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {documents.map((d: any) => (
              <div key={d.id} className="group apple-glass rounded-[2rem] overflow-hidden flex flex-col hover:shadow-xl transition-all duration-300">
                <div className="h-48 bg-gray-100  overflow-hidden">
                  {d.cover_image ? <img src={d.cover_image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"/> : <div className="w-full h-full flex items-center justify-center">No Image</div>}
                </div>
                <div className="p-6 bg-white/50 /50 flex flex-col flex-1">
                  <h3 className="text-lg font-semibold mb-4  line-clamp-2 tracking-tight">{d.title}</h3>
                  <Link to={`/documents/${d.id}`} className="block text-center mt-auto w-full bg-gray-100 hover:bg-gray-200  dark:hover:bg-gray-700 text-gray-900  font-medium py-3 rounded-full transition-colors">อ่านต่อ</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}