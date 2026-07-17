import React, { useState, useEffect } from 'react';
import { tutorApi } from '../../../services/api';

export default function AnalyticsTab() {
 const [data, setData] = useState<any>(null);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 tutorApi.getAnalytics()
 .then(res => setData(res.data))
 .catch(err => console.error(err))
 .finally(() => setLoading(false));
 }, []);

 if (loading) return <div className="p-8 text-center text-muted font-bold">กำลังโหลดข้อมูลสถิติ...</div>;
 if (!data) return <div className="p-8 text-center text-red-500 font-bold">ไม่สามารถดึงข้อมูลได้</div>;

 return (
 <div className="space-y-8 animate-fade-in">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="bg-linear-to-br from-green-500 to-emerald-600 rounded-md p-6 text-white shadow-lg shadow-green-500/30">
 <p className="text-green-100 font-bold mb-1">รายรับรวมทั้งหมด</p>
 <h3 className="text-4xl font-black">฿ {data.summary.total_revenue.toLocaleString()}</h3>
 </div>
 <div className="bg-linear-to-br from-blue-500 to-indigo-600 rounded-md p-6 text-white shadow-lg shadow-blue-500/30">
 <p className="text-blue-100 font-bold mb-1">จำนวนการขายทั้งหมด (Enrollments)</p>
 <h3 className="text-4xl font-black">{data.summary.total_enrollments.toLocaleString()} <span className="text-lg">รายการ</span></h3>
 </div>
 </div>

 <div className="bg-canvas rounded-md shadow-sm border border-outline p-6">
 <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
 <span>📊</span>ยอดขายแยกตามคอร์สเรียน
 </h3>
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-canvas /50 text-muted text-sm">
 <th className="p-4 font-bold rounded-tl-xl">ชื่อคอร์สเรียน</th>
 <th className="p-4 font-bold text-center">ผู้เรียน (คน)</th>
 <th className="p-4 font-bold text-right rounded-tr-xl">รายรับ (บาท)</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-outline ">
 {data.course_stats.map((c: any) => (
 <tr key={c.id} className="hover:bg-canvas dark:hover:bg-gray-700/50 transition">
 <td className="p-4 font-semibold text-ink ">{c.title}</td>
 <td className="p-4 text-center font-bold text-primary ">{c.total_enrollments}</td>
 <td className="p-4 text-right font-black text-green-600 ">฿{c.total_revenue.toLocaleString()}</td>
 </tr>
 ))}
 {data.course_stats.length === 0 && <tr><td colSpan={3} className="p-4 text-center text-muted">ยังไม่มีข้อมูล</td></tr>}
 </tbody>
 </table>
 </div>
 </div>

 <div className="bg-canvas rounded-md shadow-sm border border-outline p-6">
 <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
 <span>💰</span>ประวัติการสั่งซื้อล่าสุด (Recent Sales)
 </h3>
 <div className="overflow-x-auto max-h-80">
 <table className="w-full text-left border-collapse">
 <thead className="bg-canvas /50 text-muted text-sm sticky top-0">
 <tr>
 <th className="p-3 font-bold">วันที่-เวลา</th>
 <th className="p-3 font-bold">รหัสนักเรียน</th>
 <th className="p-3 font-bold">คอร์สที่ซื้อ</th>
 <th className="p-3 font-bold">โค้ดที่ใช้</th>
 <th className="p-3 font-bold text-right">ยอดชำระ</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-outline ">
 {data.recent_sales.map((s: any) => (
 <tr key={s.id} className="hover:bg-canvas dark:hover:bg-gray-700/50 text-sm">
 <td className="p-3 text-muted ">{new Date(s.enrolled_at).toLocaleString('th-TH')}</td>
 <td className="p-3 font-mono text-muted ">{s.student_id.substring(0,8)}...</td>
 <td className="p-3 font-semibold text-ink ">{s.course_title}</td>
 <td className="p-3">
 {s.promo_code_used ? <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">{s.promo_code_used}</span> : '-'}
 </td>
 <td className="p-3 text-right font-bold text-green-600 ">฿{s.price_paid.toLocaleString()}</td>
 </tr>
 ))}
 {data.recent_sales.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-muted">ยังไม่มีการสั่งซื้อ</td></tr>}
 </tbody>
 </table>
 </div>
 </div>

 <div className="bg-canvas rounded-md shadow-sm border border-outline p-6">
 <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
 <span>🎟️</span>การใช้งานโค้ดส่วนลด (Promo Code Usage)
 </h3>
 <div className="overflow-x-auto max-h-80">
 <table className="w-full text-left border-collapse">
 <thead className="bg-canvas /50 text-muted text-sm sticky top-0">
 <tr>
 <th className="p-3 font-bold">เวลาที่ใช้</th>
 <th className="p-3 font-bold">โค้ด (Code)</th>
 <th className="p-3 font-bold">รหัสนักเรียน</th>
 <th className="p-3 font-bold">ใช้กับรายการ</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-outline ">
 {data.promo_usages.map((p: any, idx: number) => (
 <tr key={idx} className="hover:bg-canvas dark:hover:bg-gray-700/50 text-sm">
 <td className="p-3 text-muted ">{new Date(p.used_at).toLocaleString('th-TH')}</td>
 <td className="p-3"><span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">{p.code}</span></td>
 <td className="p-3 font-mono text-muted ">{p.student_id.substring(0,8)}...</td>
 <td className="p-3 font-semibold text-ink ">{p.course_title}</td>
 </tr>
 ))}
 {data.promo_usages.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-muted">ยังไม่มีการใช้โค้ดส่วนลด</td></tr>}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 );
}