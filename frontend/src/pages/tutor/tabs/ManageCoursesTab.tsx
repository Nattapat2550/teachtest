import React from 'react';

export default function ManageCoursesTab({
  courses, courseForm, setCourseForm, editingCourseId, setEditingCourseId, handleSaveCourse, handleDeleteCourse
}: any) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700 h-fit">
        <h2 className="text-xl font-bold mb-4 dark:text-white">{editingCourseId ? 'แก้ไขคอร์ส' : 'สร้างคอร์สใหม่'}</h2>
        <form onSubmit={handleSaveCourse} className="space-y-4">
          <input type="text" placeholder="ชื่อคอร์ส" required className="w-full p-3 border rounded-xl dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" value={courseForm.title} onChange={e=>setCourseForm({...courseForm, title: e.target.value})} />
          <input type="text" placeholder="URL รูปปกคอร์ส" className="w-full p-3 border rounded-xl dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" value={courseForm.cover_image} onChange={e=>setCourseForm({...courseForm, cover_image: e.target.value})} />
          <input type="number" placeholder="ราคา (บาท)" required className="w-full p-3 border rounded-xl dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" value={courseForm.price} onChange={e=>setCourseForm({...courseForm, price: Number(e.target.value)})} />
          <textarea placeholder="รายละเอียดคอร์ส" rows={4} className="w-full p-3 border rounded-xl dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" value={courseForm.description} onChange={e=>setCourseForm({...courseForm, description: e.target.value})} />
          <div className="flex gap-2">
            <button type="submit" className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition">{editingCourseId ? 'บันทึกแก้ไข' : 'สร้างคอร์ส'}</button>
            {editingCourseId && (
              <button type="button" onClick={()=>{setEditingCourseId(null); setCourseForm({title:'',price:0,description:'',cover_image:''});}} className="px-4 bg-gray-200 text-gray-800 font-bold rounded-xl hover:bg-gray-300">ยกเลิก</button>
            )}
          </div>
        </form>
      </div>
      <div className="lg:col-span-2">
        <h2 className="text-xl font-bold mb-4 dark:text-white">รายการคอร์สทั้งหมดที่จัดการได้</h2>
        <div className="space-y-4">
          {courses.map((c: any) => (
            <div key={c.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border dark:border-gray-700 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-4 w-full">
                {c.cover_image ? <img src={c.cover_image} className="w-20 h-14 object-cover rounded-lg border dark:border-gray-600" alt="cover" /> : <div className="w-20 h-14 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>}
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white">{c.title}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">ราคา: ฿{c.price}</p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={()=>{setEditingCourseId(c.id); setCourseForm({title: c.title, price: c.price, description: c.description, cover_image: c.cover_image}); window.scrollTo({top:0});}} className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 px-4 py-2 rounded-lg font-bold text-sm transition-colors">แก้ไข</button>
                <button onClick={()=>handleDeleteCourse(c.id)} className="bg-red-100 text-red-700 hover:bg-red-200 px-4 py-2 rounded-lg font-bold text-sm transition-colors">ลบ</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}