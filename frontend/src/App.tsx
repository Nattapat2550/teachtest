import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './layouts/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import 'react-quill-new/dist/quill.snow.css';

// Authen & Common
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const CompleteProfilePage = lazy(() => import('./pages/CompleteProfilePage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

// Public Pages (เพิ่มตรงนี้)
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const DownloadPage = lazy(() => import('./pages/DownloadPage'));

// Admin Component
const AdminPage = lazy(() => import('./pages/admin/AdminPage'));

// LMS Components
const CourseCatalog = lazy(() => import('./pages/student/CourseCatalog'));
const CourseDetail = lazy(() => import('./pages/student/CourseDetail'));
const MyLearning = lazy(() => import('./pages/student/MyLearning'));
const LearningRoom = lazy(() => import('./pages/student/LearningRoom'));
const TutorDashboard = lazy(() => import('./pages/tutor/TutorDashboard'));

const App: React.FC = () => {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen text-gray-500">กำลังโหลด...</div>}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/complete-profile" element={<CompleteProfilePage />} />
          
          {/* Public Pages ที่กดเข้าไม่ได้ (เพิ่ม Route ตรงนี้) */}
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/download" element={<DownloadPage />} />
          
          {/* Public / Student Routes */}
          <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/courses" element={<ProtectedRoute><CourseCatalog /></ProtectedRoute>} />
          <Route path="/courses/:id" element={<ProtectedRoute><CourseDetail /></ProtectedRoute>} />
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