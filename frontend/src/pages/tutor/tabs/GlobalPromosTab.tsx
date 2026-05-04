import React from 'react';

export default function GlobalPromosTab({
  globalPromos, globalPromoForm, setGlobalPromoForm, handleSaveGlobalPromo, courses, handleDeleteGlobalPromo, editingGlobalPromoId, setEditingGlobalPromoId
}: any) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700">
      <h2 className="text-xl font-bold mb-4 dark:text-white text-purple-600">
        {editingGlobalPromoId ? 'แก้ไขโค้ดส่วนลดกลาง' : 'สร้างโค้ดส่วนลดกลาง (ใช้ได้ทุกคอร์ส รวมถึงแพ็กเกจ)'}
      </h2>
      <form onSubmit={handleSaveGlobalPromo} className="flex flex-col sm:flex-row gap-4 items-end mb-8 border p-5 rounded-xl border-purple-200 bg-purple-50 dark:bg-purple-900/20">
        <div className="flex-1">
          <label className="block text-xs font-bold text-blue-700 dark:text-blue-400 mb-1">รหัสโค้ด</label>
          <input type="text" placeholder="เช่น SUPERADMIN" required className="w-full p-2.5 border rounded-lg dark:bg-gray-900 dark:text-white outline-none" value={globalPromoForm.code} onChange={e=>setGlobalPromoForm({...globalPromoForm, code: e.target.value.toUpperCase()})} />
        </div>
        <div className="w-full sm:w-28">
          <label className="block text-xs font-bold text-red-600 mb-1">ลด (บาท)</label>
          <input type="number" required min="0" className="w-full p-2.5 border rounded-lg dark:bg-gray-900 dark:text-white outline-none" value={globalPromoForm.discount_amount} onChange={e=>setGlobalPromoForm({...globalPromoForm, discount_amount: Number(e.target.value)})} />
        </div>
        <div className="w-full sm:w-28">
          <label className="block text-xs font-bold text-green-700 mb-1">สิทธิ์ที่ใช้ได้</label>
          <input type="number" placeholder="0 = ไม่อั้น" required min="0" className="w-full p-2.5 border rounded-lg dark:bg-gray-900 dark:text-white outline-none" value={globalPromoForm.max_uses} onChange={e=>setGlobalPromoForm({...globalPromoForm, max_uses: Number(e.target.value)})} />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">กำหนดคอร์ส (เว้นว่าง = Global)</label>
          <select className="w-full p-2.5 border rounded-lg dark:bg-gray-900 dark:text-white outline-none" value={globalPromoForm.course_id} onChange={e=>setGlobalPromoForm({...globalPromoForm, course_id: e.target.value})}>
            <option value="">[Global - ใช้ได้กับทุกอย่าง]</option>
            {courses.map((c: any) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="bg-purple-600 text-white font-bold px-6 py-2.5 rounded-lg hover:bg-purple-700 transition h-11.5">
            {editingGlobalPromoId ? 'บันทึก' : 'สร้างโค้ดกลาง'}
          </button>
          {editingGlobalPromoId && (
            <button type="button" onClick={() => { setEditingGlobalPromoId(null); setGlobalPromoForm({ code: '', discount_amount: 0, max_uses: 0, course_id: '' }); }} className="bg-gray-300 text-gray-800 font-bold px-4 py-2.5 rounded-lg hover:bg-gray-400 h-11.5">ยกเลิก</button>
          )}
        </div>
      </form>

      <h3 className="font-bold text-lg mb-4 dark:text-white">รายการโค้ดส่วนลดกลาง</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {globalPromos.map((gp: any) => (
          <div key={gp.id} className="p-4 bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded-xl flex justify-between items-center">
            <div>
              <h4 className="font-black text-purple-600 text-lg">{gp.code} <span className="text-sm bg-red-100 text-red-600 px-2 py-0.5 rounded font-bold ml-2">- ฿{gp.discount_amount}</span></h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">เงื่อนไข: {gp.course_id ? `เฉพาะคอร์ส ID: ${gp.course_id}` : 'ใช้ได้ทุกอย่าง (Global)'}</p>
              <p className="text-xs font-bold text-gray-400 mt-1">ถูกใช้: {gp.uses?.length || 0} / {gp.max_uses > 0 ? gp.max_uses : 'ไม่จำกัด'}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setEditingGlobalPromoId(gp.id); setGlobalPromoForm({ code: gp.code, discount_amount: gp.discount_amount, max_uses: gp.max_uses, course_id: gp.course_id || '' }); }} className="bg-blue-100 text-blue-700 px-3 py-2 rounded-lg font-bold hover:bg-blue-200 transition text-sm">แก้ไข</button>
              <button onClick={() => handleDeleteGlobalPromo(gp.id)} className="bg-red-100 text-red-700 px-3 py-2 rounded-lg font-bold hover:bg-red-200 transition text-sm">ลบ</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}