import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { checkAuthStatus } from "../store/slices/authSlice";

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
}

const ProtectedRoute = ({ children, roles }: ProtectedRouteProps) => {
  const dispatch = useDispatch<any>();
  const location = useLocation();

  const { isAuthenticated, role, status } = useSelector((state: any) => state.auth);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(checkAuthStatus());
    }
  }, [status, dispatch]);

  if (status === 'loading' || status === 'idle') {
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">
        กำลังตรวจสอบสิทธิ์การเข้าถึง...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Fallback role เผื่อกรณี Redux หายหรือ Backend ไม่ได้ตอบ Role กลับมา
  const currentRole = role || localStorage.getItem('role') || 'student';

  if (roles && roles.length > 0 && !roles.includes(currentRole)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;