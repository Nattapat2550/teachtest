import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { studentApi } from '../../services/api';

export default function LearningRoom() {
  const { enrollmentId } = useParams();
  const navigate = useNavigate();
  const [learningData, setLearningData] = useState<any>(null);
  const [activeItem, setActiveItem] = useState<any>(null);
  const [marking, setMarking] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Tracking Unique Watched Seconds for Video
  const watchedSecondsRef = useRef<Set<number>>(new Set());

  // Exam State
  const [examAnswers, setExamAnswers] = useState<{ [qIdx: number]: any }>({});
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [examScore, setExamScore] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        (e.ctrlKey && (e.key === 'U' || e.key === 'S'))
      ) {
        e.preventDefault();
      }
    };
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  useEffect(() => {
    studentApi.getMyLearning().then(res => {
      const current = res.data.find((e: any) => e.id === enrollmentId);
      if (current) {
        setLearningData(current);
        if (current.course.playlists?.[0]?.items?.[0]) {
          setActiveItem(current.course.playlists[0].items[0]);
        }
      } else {
        navigate('/my-learning');
      }
    });
  }, [enrollmentId, navigate]);

  useEffect(() => {
    setExamAnswers({});
    setExamSubmitted(false);
    setExamScore(0);
    setMarking(false);
    
    // โหลดประวัติการดูวิดีโอจาก LocalStorage เพื่อให้เวลาสะสมยังอยู่ถ้ารีเฟรชหน้า
    if (activeItem?.item_type === 'video') {
      const savedWatched = localStorage.getItem(`video_watched_${enrollmentId}_${activeItem.id}`);
      if (savedWatched) {
        try {
          watchedSecondsRef.current = new Set(JSON.parse(savedWatched));
        } catch(e) {
          watchedSecondsRef.current.clear();
        }
      } else {
        watchedSecondsRef.current.clear();
      }
    }
  }, [activeItem]);

  const handleMarkProgress = async (itemId: string) => {
    try {
      await studentApi.updateProgress(enrollmentId!, itemId);
      setLearningData((prev: any) => {
        const newData = { ...prev };
        const newCourse = { ...(newData.course || {}) };
        const newProgress = [...(newCourse.progress || [])];
        
        if (!newProgress.some((p: any) => p.item_id === itemId)) {
          newProgress.push({ item_id: itemId, is_completed: true });
        }
        
        newCourse.progress = newProgress;
        newData.course = newCourse;
        return newData;
      });
    } catch (e) {
      console.error('Failed to update progress', e);
    }
  };

  const isCompleted = (itemId: string) => {
    return learningData?.course?.progress?.some((p: any) => p.item_id === itemId && p.is_completed);
  };

  // ----- Video Handlers -----
  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const video = e.target as HTMLVideoElement;
    const savedTime = localStorage.getItem(`video_time_${enrollmentId}_${activeItem.id}`);
    if (savedTime) {
      video.currentTime = parseFloat(savedTime);
    }
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const video = e.target as HTMLVideoElement;
    if (!video.duration) return;

    // บันทึกตำแหน่งวินาทีล่าสุด
    localStorage.setItem(`video_time_${enrollmentId}_${activeItem.id}`, video.currentTime.toString());

    // สะสมเวลาการดู (ข้ามได้แต่วินาทีที่ข้ามจะไม่ถูกนับ)
    if (!video.seeking) {
      const currentSec = Math.floor(video.currentTime);
      if (!watchedSecondsRef.current.has(currentSec)) {
        watchedSecondsRef.current.add(currentSec);
        
        // บันทึกวินาทีที่ดูสะสมลง LocalStorage ทุกๆ 5 วินาทีเพื่อลดการเขียนถี่เกินไป
        if (currentSec % 5 === 0) {
          localStorage.setItem(`video_watched_${enrollmentId}_${activeItem.id}`, JSON.stringify(Array.from(watchedSecondsRef.current)));
        }
      }
    }

    const watchedRatio = watchedSecondsRef.current.size / video.duration;

    // ถ้าดูคลิปสะสมเกิน 90% ถึงจะถือว่าผ่าน
    if (watchedRatio >= 0.90 && !marking && !isCompleted(activeItem.id)) {
      setMarking(true);
      handleMarkProgress(activeItem.id).finally(() => {
        setTimeout(() => setMarking(false), 1500); 
      });
    }
  };

  const getFullUrl = (url: string) => {
    if (!url) return '';
    const token = localStorage.getItem('token') || '';
    let finalUrl = url;
    
    if (!url.startsWith('http')) {
      const baseUrl = (api.defaults.baseURL || 'https://teachtest.onrender.com').replace(/\/$/, '');
      const path = url.startsWith('/') ? url : `/${url}`;
      finalUrl = `${baseUrl}${path}`;
    }
    const separator = finalUrl.includes('?') ? '&' : '?';
    return `${finalUrl}${separator}token=${token}`;
  };

  const calculateProgress = () => {
    if (!learningData) return 0;
    let totalItems = 0;
    learningData.course.playlists?.forEach((pl: any) => {
      totalItems += pl.items?.length || 0;
    });
    const completedItems = learningData.course.progress?.filter((p: any) => p.is_completed).length || 0;
    if (totalItems === 0) return 0;
    return Math.round((completedItems / totalItems) * 100);
  };

  const percent = calculateProgress();

  if (!learningData) return <div className="flex justify-center items-center h-screen">กำลังโหลด...</div>;

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-80px)] bg-gray-50 dark:bg-gray-900">
      
      <div className="w-full md:w-96 bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex flex-col shadow-lg z-10">
        <div className="p-6 bg-linear-to-r from-blue-600 to-indigo-600 text-white">
          <h2 className="text-xl font-black leading-snug mb-3">{learningData.course.title}</h2>
          
          <div className="w-full bg-white/30 rounded-full h-2 overflow-hidden mb-1">
            <div className="bg-green-400 h-full rounded-full transition-all duration-500" style={{ width: `${percent}%` }}></div>
          </div>
          <div className="flex justify-between text-xs font-medium text-blue-100">
            <span>ความคืบหน้า</span>
            <span>{percent}%</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {learningData.course.playlists?.map((pl: any) => (
            <div key={pl.id} className="border-b dark:border-gray-700">
              <div className="px-6 py-4 bg-gray-100 dark:bg-gray-900/50 font-bold dark:text-gray-200 text-sm tracking-wide">
                {pl.title}
              </div>
              <div className="flex flex-col">
                {pl.items?.map((item: any) => {
                  const completed = isCompleted(item.id);
                  const active = activeItem?.id === item.id;
                  return (
                    <button 
                      key={item.id}
                      onClick={() => setActiveItem(item)}
                      className={`w-full text-left px-6 py-4 flex items-start gap-4 transition-all border-l-4 ${
                        active ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-600' : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className={`mt-0.5 shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        completed ? 'bg-green-500 border-green-500' : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {completed && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <div className="flex flex-col">
                        <span className={`text-sm font-semibold ${active ? 'text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                          {item.title}
                        </span>
                        <span className="text-xs text-gray-400 mt-1 uppercase tracking-wider">{item.item_type}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 p-6 lg:p-10 overflow-y-auto bg-gray-50 dark:bg-gray-900">
        {activeItem ? (
          <div className="max-w-5xl mx-auto">
            <h1 className="text-3xl font-black mb-8 text-gray-900 dark:text-white">{activeItem.title}</h1>
            
            {activeItem.item_type === 'video' && (
              <div className="bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-gray-900/10 mb-8 relative">
                <video 
                  ref={videoRef}
                  controls
                  controlsList="nodownload"
                  disablePictureInPicture
                  onContextMenu={(e) => e.preventDefault()}
                  className="w-full aspect-video outline-none bg-black"
                  src={getFullUrl(activeItem.content_url)}
                  onLoadedMetadata={handleLoadedMetadata}
                  onTimeUpdate={handleTimeUpdate}
                  playsInline
                />
              </div>
            )}

            {activeItem.item_type === 'file' && (
              <div className="bg-white dark:bg-gray-800 p-12 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm text-center">
                <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">ไฟล์เอกสารประกอบการเรียน</h3>
                <a 
                  href={getFullUrl(activeItem.content_url)} 
                  target="_blank" rel="noreferrer"
                  onClick={() => handleMarkProgress(activeItem.id)}
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:bg-blue-700 hover:-translate-y-1 transition-all"
                >
                  เปิดอ่านเอกสาร / ดาวน์โหลด
                </a>
              </div>
            )}

            {activeItem.item_type === 'exam' && (
              <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">แบบทดสอบ: {activeItem.title}</h3>
                {(() => {
                  let questions: any[] = [];
                  try { questions = JSON.parse(activeItem.content_data || '[]'); } catch (e) {}
                  
                  if (questions.length === 0) return <p className="text-gray-500">ไม่มีคำถามในแบบทดสอบนี้</p>;

                  let maxScore = 0;
                  questions.forEach(q => {
                      if (q.question_type === 'multiple_choice' || (q.question_type === 'short_answer' && q.correct_answer && q.correct_answer.trim() !== '')) {
                          maxScore++;
                      }
                  });

                  const handleSubmitExam = () => {
                    let score = 0;
                    questions.forEach((q, qIdx) => {
                      if (q.question_type === 'short_answer') {
                        if (q.correct_answer && q.correct_answer.trim() !== '') {
                           const ans = (examAnswers[qIdx] || '').toString().trim().toLowerCase();
                           if (ans === q.correct_answer.trim().toLowerCase()) {
                               score++;
                           }
                        }
                      } else {
                        const selectedChoiceIdx = examAnswers[qIdx];
                        if (selectedChoiceIdx !== undefined && q.choices[selectedChoiceIdx]?.is_correct) {
                          score++;
                        }
                      }
                    });
                    setExamScore(score);
                    setExamSubmitted(true);
                    handleMarkProgress(activeItem.id); 
                  };

                  return (
                    <div className="space-y-8 text-left">
                      {questions.map((q: any, qIdx: number) => (
                        <div key={qIdx} className="p-6 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
                          <p className="font-bold text-lg mb-4 text-gray-900 dark:text-white">{qIdx + 1}. {q.question_text}</p>
                          {q.image_url && (
                            <img src={q.image_url} alt="Question" className="max-w-full md:max-w-md rounded-lg shadow-sm mb-4" />
                          )}
                          
                          {q.question_type === 'short_answer' ? (
                            <div className="mt-2">
                              {q.correct_answer && q.correct_answer.trim() !== '' ? (
                                <>
                                  <textarea
                                    className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    rows={3}
                                    placeholder="พิมพ์คำตอบของคุณที่นี่..."
                                    disabled={examSubmitted}
                                    value={examAnswers[qIdx] || ''}
                                    onChange={(e) => setExamAnswers({...examAnswers, [qIdx]: e.target.value})}
                                  />
                                  {examSubmitted && (
                                    <div className="mt-3 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm font-bold shadow-sm">
                                        คำตอบที่ถูกต้อง: {q.correct_answer}
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="text-gray-500 italic text-sm">
                                  {/* ข้อนี้เป็นคำถามปลายเปิดหรือข้อความอ่าน ไม่มีช่องให้กรอกคำตอบ */}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-3 pl-2">
                              {q.choices.map((c: any, cIdx: number) => (
                                <label key={cIdx} className="flex items-center gap-3 cursor-pointer">
                                  <input type="radio"
                                    name={`q_${qIdx}`}
                                    checked={examAnswers[qIdx] === cIdx}
                                    disabled={examSubmitted}
                                    onChange={() => setExamAnswers({ ...examAnswers, [qIdx]: cIdx })}
                                    className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className={`${
                                    examSubmitted && c.is_correct ? 'text-green-600 font-bold' : 'text-gray-700 dark:text-gray-300'
                                  } ${
                                    examSubmitted && examAnswers[qIdx] === cIdx && !c.is_correct ? 'text-red-600 line-through' : ''
                                  }`}>
                                    {c.choice_text}
                                    {examSubmitted && c.is_correct && ' (ถูกต้อง)'}
                                  </span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                      {!examSubmitted ? (
                        <button onClick={handleSubmitExam} className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 shadow-md transition-all">
                          ส่งคำตอบ
                        </button>
                      ) : (
                        <div className="p-6 bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800 text-green-800 dark:text-green-400 rounded-xl text-center shadow-sm">
                          <p className="text-3xl font-black mb-2">ส่งคำตอบเรียบร้อยแล้ว!</p>
                          <p className="font-medium">
                            ได้คะแนนจากส่วนที่ตรวจอัตโนมัติ: {examScore} / {maxScore} ข้อ <br />
                            (ระบบได้บันทึกความคืบหน้าของคุณแล้ว)
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <svg className="w-20 h-20 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <p className="text-xl font-medium">เลือกเนื้อหาทางซ้ายมือเพื่อเริ่มต้นเรียนรู้</p>
          </div>
        )}
      </div>
    </div>
  );
}