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

 const [walletModal, setWalletModal] = useState(false);
 const [newBalance, setNewBalance] = useState<number>(0);

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
 return <div className="p-8 text-center text-muted ">กำลังโหลด...</div>;
 }

 return (
 <div className="bg-canvas rounded-md shadow-sm border border-outline p-6">
 <h2 className="text-xl font-bold text-ink mb-6">จัดการผู้ใช้งาน</h2>

 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-canvas /50 text-muted text-sm border-b border-outline ">
 <th className="p-4">ID / User ID</th>
 <th className="p-4">Email / Username</th>
 <th className="p-4">สิทธิ์ (Role)</th>
 <th className="p-4">ยอดเงิน (Wallet)</th>
 <th className="p-4 text-right">จัดการ</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-outline ">
 {users.length === 0 ? (
 <tr>
 <td colSpan={5} className="p-8 text-center text-muted ">
 ไม่พบผู้ใช้งานในระบบ
 </td>
 </tr>
 ) : (
 users.map(u => (
 <tr key={u.user_id || u.id} className="hover:bg-canvas dark:hover:bg-gray-750 transition-colors">
 <td className="p-4 text-muted text-xs font-mono">
 {u.user_id || u.id}
 </td>
 <td className="p-4 text-ink font-medium">{u.email || u.username || 'ไม่มีข้อมูล'}</td>
 <td className="p-4">
 <span className={`px-2 py-1 rounded text-xs font-bold ${
 u.role === 'admin' ? 'bg-purple-100 text-purple-700 /30 ' : 
 u.role === 'tutor' ? 'bg-orange-100 text-orange-700 /30 ' :
 u.role === 'student' ? 'bg-blue-100 text-blue-700 /30 ' :
 'bg-canvas text-ink '
 }`}>
 {u.role ? u.role.toUpperCase() : 'STUDENT'}
 </span>
 </td>
 <td className="p-4 font-bold text-green-600 ">
 ฿{(u.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
 </td>
 <td className="p-4 flex justify-end gap-2">
 <button 
 onClick={() => openRoleModal(u)} 
 className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 /30 dark:hover:bg-blue-900/50 text-blue-700 rounded-md text-sm font-medium transition-colors"
 >
 เปลี่ยนสิทธิ์
 </button>
 <button 
 onClick={() => openWalletModal(u)} 
 className="px-3 py-1.5 bg-yellow-100 hover:bg-yellow-200 /30 dark:hover:bg-yellow-900/50 text-yellow-700 rounded-md text-sm font-medium transition-colors"
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

 {walletModal && selectedUser && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
 <div className="bg-canvas rounded-md w-full max-w-sm shadow-2xl p-6">
 <h3 className="text-xl font-bold text-ink mb-4">เพิ่ม/ลดยอดเงินกระเป๋า</h3>
 <p className="text-sm text-muted mb-6">บัญชี: {selectedUser.email || selectedUser.username}</p>
 
 <form onSubmit={handleUpdateWallet}>
 <div className="mb-6">
 <label className="block text-sm font-medium text-ink mb-2">
 ยอดเงินล่าสุด (บาท)
 </label>
 <input
 type="number"
 step="0.01"
 required
 value={newBalance}
 onChange={e => setNewBalance(parseFloat(e.target.value) || 0)}
 className="w-full px-4 py-3 border border-outline rounded-md bg-canvas text-ink text-lg font-bold focus:ring-2 focus:ring-blue-500 outline-none"
 />
 </div>
 
 <div className="flex justify-end gap-3">
 <button type="button" onClick={() => setWalletModal(false)} className="px-4 py-2 rounded-md bg-canvas hover:bg-canvas dark:hover:bg-gray-600 text-ink font-medium transition-colors">
 ยกเลิก
 </button>
 <button type="submit" className="px-4 py-2 rounded-md bg-primary hover:bg-primary-active text-white font-medium shadow-md transition-colors">
 ยืนยันบันทึก
 </button>
 </div>
 </form>
 </div>
 </div>
 )}

 {roleModal && selectedUser && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
 <div className="bg-canvas rounded-md w-full max-w-sm shadow-2xl p-6">
 <h3 className="text-xl font-bold text-ink mb-4">จัดการสิทธิ์ผู้ใช้</h3>
 <p className="text-sm text-muted mb-6">บัญชี: {selectedUser.email || selectedUser.username}</p>
 
 <form onSubmit={handleUpdateRole}>
 <div className="mb-6">
 <label className="block text-sm font-medium text-ink mb-2">
 เลือกระดับสิทธิ์ (Role)
 </label>
 <select
 value={newRole}
 onChange={e => setNewRole(e.target.value)}
 className="w-full px-4 py-3 border border-outline rounded-md bg-canvas text-ink text-base focus:ring-2 focus:ring-blue-500 outline-none"
 >
 <option value="student">Student (นักเรียน)</option>
 <option value="tutor">Tutor (ติวเตอร์ผู้สอน)</option>
 <option value="admin">Admin (ผู้ดูแลระบบ)</option>
 </select>
 </div>
 
 <div className="flex justify-end gap-3">
 <button type="button" onClick={() => setRoleModal(false)} className="px-4 py-2 rounded-md bg-canvas hover:bg-canvas dark:hover:bg-gray-600 text-ink font-medium transition-colors">
 ยกเลิก
 </button>
 <button type="submit" className="px-4 py-2 rounded-md bg-primary hover:bg-primary-active text-white font-medium shadow-md transition-colors">
 ยืนยันอัปเดต
 </button>
 </div>
 </form>
 </div>
 </div>
 )}
 </div>
 );
}