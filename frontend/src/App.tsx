import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './layouts/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import 'react-quill-new/dist/quill.snow.css';

import { useServerWakeup } from './hooks/useServerWakeup';
import { useOAuthCallback } from './hooks/useOAuthCallback';

// Authen & Common
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const CheckCodePage = lazy(() => import('./pages/CheckCodePage'));
const CompleteProfilePage = lazy(() => import('./pages/CompleteProfilePage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

// Public Pages
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const DownloadPage = lazy(() => import('./pages/DownloadPage'));

// Admin Component
const AdminPage = lazy(() => import('./pages/admin/AdminPage'));

// LMS Components
const CourseCatalog = lazy(() => import('./pages/student/CourseCatalog'));
const CourseDetail = lazy(() => import('./pages/student/CourseDetail'));
const PackageDetail = lazy(() => import('./pages/student/PackageDetail'));
const MyLearning = lazy(() => import('./pages/student/MyLearning'));
const LearningRoom = lazy(() => import('./pages/student/LearningRoom'));
const TutorDashboard = lazy(() => import('./pages/tutor/TutorDashboard'));

const App: React.FC = () => {

 const { serverReady, wakingUp } = useServerWakeup();
 useOAuthCallback();

 if (!serverReady) {
 return (
 <div className="flex flex-col justify-center items-center min-h-screen bg-canvas text-ink p-6 text-center transition-colors duration-300">
 <div className="relative flex justify-center items-center mb-8">
 <div className="absolute animate-ping inline-flex h-20 w-20 rounded-full bg-blue-400 opacity-20"></div>
 {/* แก้ไข Spinner เพื่อไม่ให้เกิด border-accent-on-rounded */}
 <div className="animate-spin rounded-full h-16 w-16 border-4 border-outline border-t-blue-600 "></div>
 </div>
 <h1 className="text-2xl md:text-3xl font-black mb-3">TeachTest</h1>
 <h2 className="text-xl font-bold mb-3 text-primary ">กำลังเชื่อมต่อกับเซิร์ฟเวอร์...</h2>
 <p className="text-muted max-w-md text-sm md:text-base font-medium">
 {wakingUp 
 ? "กำลังปลุกระบบฐานข้อมูลและเซิร์ฟเวอร์ (อาจใช้เวลา 30-50 วินาทีในครั้งแรกเนื่องจากระบบประหยัดพลังงาน) กรุณารอสักครู่ ⏳" 
 : "ระบบกำลังเตรียมความพร้อม..."}
 </p>
 </div>
 );
 }

 return (
 <Suspense fallback={<div className="flex justify-center items-center min-h-screen text-muted">กำลังโหลด...</div>}>
 <Routes>
 <Route element={<Layout />}>
 <Route path="/" element={<LandingPage />} />
 <Route path="/login" element={<LoginPage />} />
 <Route path="/register" element={<RegisterPage />} />
 <Route path="/check" element={<CheckCodePage />} />
 <Route path="/reset" element={<ResetPasswordPage />} />
 <Route path="/complete-profile" element={<CompleteProfilePage />} />
 <Route path="/about" element={<AboutPage />} />
 <Route path="/contact" element={<ContactPage />} />
 <Route path="/download" element={<DownloadPage />} />
 
 {/* Public / Student Routes */}
 <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
 <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
 <Route path="/courses" element={<ProtectedRoute><CourseCatalog /></ProtectedRoute>} />
 <Route path="/courses/:id" element={<ProtectedRoute><CourseDetail /></ProtectedRoute>} />
 <Route path="/packages/:id" element={<ProtectedRoute><PackageDetail /></ProtectedRoute>} />
 <Route path="/my-learning" element={<ProtectedRoute roles={['student', 'admin', 'tutor']}><MyLearning /></ProtectedRoute>} />
 <Route path="/learn/:enrollmentId" element={<ProtectedRoute roles={['student', 'admin', 'tutor']}><LearningRoom /></ProtectedRoute>} />
 
 {/* Tutor Routes */}
 <Route path="/tutor" element={<ProtectedRoute roles={['tutor', 'admin']}><TutorDashboard /></ProtectedRoute>} />
 
 {/* Admin Routes */}
 <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminPage /></ProtectedRoute>} />
 <Route path="*" element={<Navigate to="/" replace />} />
 </Route>
 </Routes>
 </Suspense>
 );
};

export default App;