import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isBanned, setIsBanned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsBanned(false);
    setIsLoading(true);

    try {
      const response = await axios.post('/api/auth/login', { email, password });
      
      // แปลงจากข้อมูล .user เดิม เป็น .owner ให้ตรงกับ Schema และ Handler ล่าสุด
      const { token, owner } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('owner', JSON.stringify(owner));
      
      navigate('/');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ';
      const statusCode = err.response?.status;

      // ตรวจสอบ Error ว่าเป็นการถูกแบนจากระบบหรือไม่
      if (statusCode === 403 || errorMessage.toLowerCase().includes('ban') || errorMessage.toLowerCase().includes('ระงับ')) {
        setIsBanned(true);
        setError('บัญชีของคุณถูกระงับการใช้งาน');
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">เข้าสู่ระบบ</h2>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm text-center">{error}</p>
            {isBanned && (
              <div className="mt-2 text-center">
                <Link to="/appeal" className="text-blue-600 hover:underline text-sm font-medium">
                  คลิกที่นี่เพื่อยื่นอุทธรณ์
                </Link>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="example@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200 disabled:opacity-50"
          >
            {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          ยังไม่มีบัญชีใช่หรือไม่?{' '}
          <Link to="/register" className="text-blue-600 hover:underline font-medium">
            สมัครสมาชิก
          </Link>
        </div>
      </div>
    </div>
  );
}