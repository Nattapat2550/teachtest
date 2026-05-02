// frontend/src/pages/admin/tabs/UsersTab.tsx
import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

interface User {
  id: string;
  user_id?: string;
  email?: string;
  username?: string;
  role: string;
  balance?: number;
}

export default function UsersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // === Wallet Modal State ===
  const [walletModal, setWalletModal] = useState(false);
  const [newBalance, setNewBalance] = useState<number>(0);

  // === Role Modal State ===
  const [roleModal, setRoleModal] = useState(false);
  const [newRole, setNewRole] = useState<string>('student');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/admin/users');
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch users', err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
     fetchUsers();
   }, []);

  // --- Handlers จัดการ Wallet ---
  const openWalletModal = (user: User) => {
    setSelectedUser(user);
    setNewBalance(user.balance || 0);
    setWalletModal(true);
  };

  const handleUpdateWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    const targetId = selectedUser.user_id || selectedUser.id;
    
    try {
      await api.put(`/api/admin/users/${targetId}/wallet`, { balance: newBalance });
      setWalletModal(false);
      fetchUsers();
      alert('อัปเดตยอดเงินสำเร็จ');
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการอัปเดตยอดเงิน');
    }
  };

  // --- Handlers จัดการ Role ---
  const openRoleModal = (user: User) => {
    setSelectedUser(user);
    setNewRole(user.role || 'student');
    setRoleModal(true);
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    const targetId = selectedUser.user_id || selectedUser.id;
    try {
      await api.put(`/api/admin/users/${targetId}/role`, { role: newRole });
      setRoleModal(false);
      fetchUsers();
      alert('อัปเดตสิทธิ์สำเร็จ');
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการอัปเดตสิทธิ์');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500 dark:text-gray-400">กำลังโหลด...</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">จัดการผู้ใช้งาน</h2>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 text-sm border-b border-gray-200 dark:border-gray-700">
              <th className="p-4">ID / User ID</th>
              <th className="p-4">Email / Username</th>
              <th className="p-4">สิทธิ์ (Role)</th>
              <th className="p-4">ยอดเงิน (Wallet)</th>
              <th className="p-4 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500 dark:text-gray-400">
                  ไม่พบผู้ใช้งานในระบบ
                </td>
              </tr>
            ) : (
              users.map(u => (
                <tr key={u.user_id || u.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                  <td className="p-4 text-gray-500 dark:text-gray-400 text-xs font-mono">
                    {u.user_id || u.id}
                  </td>
                  <td className="p-4 text-gray-900 dark:text-white font-medium">{u.email || u.username || 'ไม่มีข้อมูล'}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      u.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 
                      u.role === 'tutor' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                      u.role === 'student' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {u.role ? u.role.toUpperCase() : 'STUDENT'}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-green-600 dark:text-green-400">
                     ฿{(u.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-4 flex justify-end gap-2">
                    <button 
                       onClick={() => openRoleModal(u)} 
                       className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 rounded-lg text-sm font-medium transition-colors"
                    >
                      เปลี่ยนสิทธิ์
                    </button>
                    <button 
                       onClick={() => openWalletModal(u)} 
                       className="px-3 py-1.5 bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:hover:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400 rounded-lg text-sm font-medium transition-colors"
                    >
                      จัดการเงิน
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ========================================== */}
      {/* Modal จัดการยอดเงิน (Wallet) */}
      {/* ========================================== */}
      {walletModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm shadow-2xl p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">ปรับปรุงยอดเงิน</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">ผู้ใช้: {selectedUser.email || selectedUser.username}</p>
            
            <form onSubmit={handleUpdateWallet}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ยอดเงินล่าสุด (บาท)
                </label>
                <input 
                   type="number" 
                   step="0.01"
                  required 
                   value={newBalance} 
                   onChange={e => setNewBalance(parseFloat(e.target.value) || 0)} 
                   className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-lg font-bold focus:ring-2 focus:ring-blue-500 outline-none" 
                 />
              </div>
              
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setWalletModal(false)} className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium transition-colors">
                  ยกเลิก
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md transition-colors">
                  บันทึกยอดเงิน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* Modal เปลี่ยนสิทธิ์ (Role) */}
      {/* ========================================== */}
      {roleModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm shadow-2xl p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">เปลี่ยนสิทธิ์ผู้ใช้</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">ผู้ใช้: {selectedUser.email || selectedUser.username}</p>
            
            <form onSubmit={handleUpdateRole}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    เลือกสิทธิ์ (Role)
                </label>
                <select 
                   value={newRole} 
                   onChange={e => setNewRole(e.target.value)} 
                   className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-base focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="student">Student (นักเรียน)</option>
                  <option value="tutor">Tutor (ผู้สอน)</option>
                  <option value="admin">Admin (ผู้ดูแลระบบ)</option>
                </select>
              </div>
              
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setRoleModal(false)} className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium transition-colors">
                  ยกเลิก
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md transition-colors">
                  บันทึกสิทธิ์
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}