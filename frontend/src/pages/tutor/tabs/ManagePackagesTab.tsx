import React from 'react';

export default function ManagePackagesTab({
  packages, pkgForm, setPkgForm, editingPkgId, setEditingPkgId, handleSavePackage, handleDeletePackage, toggleCourseInPackage, courses
}: any) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700 h-fit">
        <h2 className="text-xl font-bold mb-4 dark:text-white">{editingPkgId ? 'แก้ไขแพ็กเกจ' : 'จัดแพ็กเกจใหม่'}</h2>
        <form onSubmit={handleSavePackage} className="space-y-4">
          <input type="text" placeholder="ชื่อแพ็กเกจ (เช่น แพ็กสุดคุ้ม 3 คอร์ส)" required className="w-full p-3 border rounded-xl dark:bg-gray-900 dark:text-white outline-none" value={pkgForm.title} onChange={e=>setPkgForm({...pkgForm, title: e.target.value})} />
          <input type="number" placeholder="ราคาเหมาจ่าย (บาท)" required className="w-full p-3 border rounded-xl dark:bg-gray-900 dark:text-white outline-none" value={pkgForm.price} onChange={e=>setPkgForm({...pkgForm, price: Number(e.target.value)})} />
          <textarea placeholder="รายละเอียดส่วนลดต่างๆ" rows={3} className="w-full p-3 border rounded-xl dark:bg-gray-900 dark:text-white outline-none" value={pkgForm.description} onChange={e=>setPkgForm({...pkgForm, description: e.target.value})} />
          <input type="text" placeholder="URL รูปปก" className="w-full p-3 border rounded-xl dark:bg-gray-900 dark:text-white outline-none" value={pkgForm.cover_image} onChange={e=>setPkgForm({...pkgForm, cover_image: e.target.value})} />
          
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-900 h-40 overflow-y-auto">
            <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">เลือกคอร์สที่จะรวมในแพ็ก:</p>
            {courses.map((c: any) => (
              <label key={c.id} className="flex items-center gap-3 mb-2 cursor-pointer">
                <input type="checkbox" checked={pkgForm.course_ids.includes(c.id)} onChange={() => toggleCourseInPackage(c.id)} className="w-4 h-4 text-blue-600" />
                <span className="text-sm dark:text-white truncate">{c.title}</span>
              </label>
            ))}
          </div>

          <div className="flex gap-2">
            <button type="submit" className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700">{editingPkgId ? 'บันทึกแก้ไข' : 'สร้างแพ็กเกจ'}</button>
            {editingPkgId && <button type="button" onClick={()=>{setEditingPkgId(null); setPkgForm({title:'',description:'',price:0,cover_image:'',course_ids:[]})}} className="px-4 bg-gray-200 text-gray-800 font-bold rounded-xl">ยกเลิก</button>}
          </div>
        </form>
      </div>

      <div className="lg:col-span-2">
        <h2 className="text-xl font-bold mb-4 dark:text-white">แพ็กเกจคอร์สทั้งหมด</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {packages.map((p: any) => (
            <div key={p.id} className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 shadow-sm p-4">
              {p.cover_image && <img src={p.cover_image} className="w-full h-32 object-cover rounded-lg mb-3" alt="cover" />}
              <h3 className="font-bold text-lg dark:text-white">{p.title}</h3>
              <p className="text-blue-600 font-black mb-2">฿{p.price}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{p.course_ids?.length || 0} คอร์สที่รวมอยู่</p>
              <div className="flex gap-2">
                <button onClick={()=>{setEditingPkgId(p.id); setPkgForm({title:p.title, description:p.description, price:p.price, cover_image:p.cover_image, course_ids:p.course_ids||[]}); window.scrollTo({top:0});}} className="flex-1 bg-yellow-100 text-yellow-700 py-2 rounded-lg font-bold">แก้ไข</button>
                <button onClick={()=>handleDeletePackage(p.id)} className="flex-1 bg-red-100 text-red-700 py-2 rounded-lg font-bold">ลบ</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}