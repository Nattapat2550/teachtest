import React from 'react';

export default function ManageContentTab({
  courses, selectedCourse, setSelectedCourse, editingPromoId, setEditingPromoId, promoForm, setPromoForm, promoCodes, handleSavePromo, handleDeletePromo,
  editingPlaylistId, setEditingPlaylistId, playlistForm, setPlaylistForm, handleSavePlaylist,
  editingItemId, setEditingItemId, itemForm, setItemForm, setSelectedFile, uploading, uploadProgress, handleSaveItem, handleEditItem, handleDeleteItem, handleDeletePlaylist, renderExamEditor, fileInputClass
}: any) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700">
      <h2 className="text-xl font-bold mb-4 dark:text-white">เลือกคอร์สที่ต้องการจัดการเนื้อหา / โปรโมโค้ด</h2>
      <select className="w-full p-3 border rounded-xl mb-6 dark:bg-gray-900 dark:text-white outline-none" onChange={(e) => {
        setSelectedCourse(courses.find((c: any) => c.id === e.target.value));
        setEditingPlaylistId(null); setEditingItemId(null);
      }}>
        <option value="">-- เลือกคอร์ส --</option>
        {courses.map((c: any) => <option key={c.id} value={c.id}>{c.title}</option>)}
      </select>

      {selectedCourse && (
        <div className="space-y-8">
          {/* Promo Code Form */}
          <div className="p-5 border border-blue-200 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <h4 className="text-base font-bold text-blue-800 dark:text-blue-300 mb-4">{editingPromoId ? 'แก้ไขโปรโมโค้ด' : 'สร้างโปรโมโค้ดใหม่สำหรับคอร์สนี้'}</h4>
            <form onSubmit={handleSavePromo} className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <label className="block text-xs font-bold text-blue-700 dark:text-blue-400 mb-1">รหัสโค้ดส่วนลด</label>
                <input type="text" placeholder="เช่น SUMMER50" required className="w-full p-2.5 border rounded-lg dark:bg-gray-900 dark:text-white outline-none focus:border-blue-500" value={promoForm.code} onChange={e=>setPromoForm({...promoForm, code: e.target.value.toUpperCase()})} />
              </div>
              <div className="w-full sm:w-32 shrink-0">
                <label className="block text-xs font-bold text-red-600 dark:text-red-400 mb-1">ส่วนลดที่ให้ (บาท)</label>
                <input type="number" placeholder="0" required min="0" className="w-full p-2.5 border rounded-lg border-red-300 dark:border-red-900 dark:bg-gray-900 dark:text-white outline-none focus:border-red-500" value={promoForm.discount_amount} onChange={e=>setPromoForm({...promoForm, discount_amount: Number(e.target.value)})} />
              </div>
              <div className="w-full sm:w-32 shrink-0">
                <label className="block text-xs font-bold text-green-700 dark:text-green-400 mb-1">จำนวนสิทธิ์ที่ใช้ได้</label>
                <input type="number" placeholder="0 = ไม่จำกัด" required min="0" className="w-full p-2.5 border rounded-lg border-green-300 dark:border-green-900 dark:bg-gray-900 dark:text-white outline-none focus:border-green-500" value={promoForm.max_uses} onChange={e=>setPromoForm({...promoForm, max_uses: Number(e.target.value)})} />
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button type="submit" className="bg-blue-600 text-white font-bold px-6 py-2.5 rounded-lg hover:bg-blue-700 transition w-full h-11.5">{editingPromoId ? 'บันทึก' : 'สร้างโค้ด'}</button>
                {editingPromoId && <button type="button" onClick={()=>{setEditingPromoId(null); setPromoForm({code:'',discount_amount:0,max_uses:0});}} className="bg-gray-300 text-gray-800 font-bold px-4 py-2.5 rounded-lg hover:bg-gray-400 h-11.5">ยกเลิก</button>}
              </div>
            </form>
            
            <div className="mt-5 border-t pt-4 border-blue-200 dark:border-blue-800">
              <h5 className="font-bold text-sm mb-3 text-blue-800 dark:text-blue-300">โค้ดส่วนลดที่สร้างแล้ว</h5>
              {promoCodes.length === 0 ? <p className="text-sm text-gray-500">ยังไม่มีโค้ดส่วนลดสำหรับคอร์สนี้</p> : (
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                      {promoCodes.map((pc: any) => (
                          <div key={pc.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                              <div>
                                  <div className="flex items-center gap-3 mb-1">
                                      <span className="font-black text-blue-600 text-lg">{pc.code}</span>
                                      <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded">ลด ฿{pc.discount_amount}</span>
                                  </div>
                                  <div className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                      ใช้ไปแล้ว <span className={pc.max_uses > 0 && pc.uses?.length >= pc.max_uses ? "text-red-500 font-bold" : "text-green-600 font-bold"}>{pc.uses?.length || 0}</span> / {pc.max_uses > 0 ? `${pc.max_uses} สิทธิ์` : 'ไม่จำกัดสิทธิ์'}
                                  </div>
                              </div>
                              <div className="flex gap-2 items-center">
                                <button onClick={()=>{setEditingPromoId(pc.id); setPromoForm({code: pc.code, discount_amount: pc.discount_amount, max_uses: pc.max_uses});}} className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold">แก้ไข</button>
                                <button onClick={()=>handleDeletePromo(pc.id)} className="bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-xs font-bold">ลบ</button>
                              </div>
                          </div>
                      ))}
                  </div>
              )}
            </div>
          </div>

          {/* Playlists & Items Render */}
          <div className="p-4 border-2 border-dashed border-purple-200 dark:border-purple-900/50 rounded-xl">
            <h4 className="text-sm font-bold text-purple-600 dark:text-purple-400 mb-3">{editingPlaylistId ? 'แก้ไขบทเรียน' : 'สร้างบทเรียนใหม่'}</h4>
            <form onSubmit={handleSavePlaylist} className="flex flex-col sm:flex-row gap-4">
              <input type="number" placeholder="ลำดับ" required className="w-20 p-3 border rounded-xl dark:bg-gray-900 dark:text-white outline-none" value={playlistForm.sort_order} onChange={e=>setPlaylistForm({...playlistForm, sort_order: Number(e.target.value)})} />
              <input type="text" placeholder="ชื่อบทเรียน" required className="flex-1 p-3 border rounded-xl dark:bg-gray-900 dark:text-white outline-none" value={playlistForm.title} onChange={e=>setPlaylistForm({...playlistForm, title: e.target.value})} />
              <div className="flex gap-2">
                <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white px-6 font-bold rounded-xl">{editingPlaylistId ? 'อัปเดต' : '+ เพิ่ม'}</button>
                {editingPlaylistId && <button type="button" onClick={()=>{setEditingPlaylistId(null); setPlaylistForm({title: '', sort_order: 1});}} className="bg-gray-200 px-4 font-bold rounded-xl">ยกเลิก</button>}
              </div>
            </form>
          </div>

          {selectedCourse.playlists?.map((pl: any) => (
            <div key={pl.id} className="bg-gray-50 dark:bg-gray-900 p-5 rounded-xl border dark:border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg dark:text-white"><span className="text-purple-600 mr-2 border px-2 py-0.5 rounded-full">{pl.sort_order}</span>{pl.title}</h3>
                <div className="flex gap-2">
                  <button onClick={() => {setEditingPlaylistId(pl.id); setPlaylistForm({title:pl.title, sort_order:pl.sort_order});}} className="text-blue-500 font-bold px-2 py-1 text-sm bg-blue-50 rounded">แก้ไข</button>
                  <button onClick={() => handleDeletePlaylist(pl.id)} className="text-red-500 font-bold px-2 py-1 text-sm bg-red-50 rounded">ลบ</button>
                </div>
              </div>
              {pl.items?.map((it: any) => (
                <div key={it.id} className="mb-2">
                  {editingItemId === it.id ? (
                    <div className="p-4 bg-white dark:bg-gray-800 border-2 border-blue-400 rounded-xl my-2">
                        <div className="flex gap-3 mb-4">
                            <input type="number" placeholder="ลำดับ" required className="w-20 p-2 border rounded-lg dark:bg-gray-900 dark:text-white outline-none" value={itemForm.sort_order} onChange={e=>setItemForm({...itemForm, sort_order: Number(e.target.value)})} />
                            <input type="text" placeholder="ชื่อคลิป/ไฟล์" required className="flex-1 p-2 border rounded-lg dark:bg-gray-900 dark:text-white outline-none" value={itemForm.title} onChange={e=>setItemForm({...itemForm, title: e.target.value})} />
                            <select className="p-2 border rounded-lg dark:bg-gray-900 dark:text-white outline-none" value={itemForm.item_type} onChange={e=>setItemForm({...itemForm, item_type: e.target.value})}>
                              <option value="video">วิดีโอ</option><option value="file">เอกสาร</option><option value="exam">แบบทดสอบ</option>
                            </select>
                        </div>
                        
                        {/* Rendering File Input OR Exam Editor */}
                        {itemForm.item_type !== 'exam' ? (
                            <input type="file" onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)} className={fileInputClass} />
                        ) : (
                            renderExamEditor()
                        )}

                        {uploading && (
                           <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4 dark:bg-gray-700 overflow-hidden">
                              <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                           </div>
                        )}

                        <div className="flex gap-2">
                            <button onClick={(e) => handleSaveItem(e, pl.id)} disabled={uploading} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold">{uploading ? 'กำลังบันทึก...' : 'บันทึก'}</button>
                            <button onClick={() => setEditingItemId(null)} disabled={uploading} className="bg-gray-200 hover:bg-gray-300 px-6 py-2 rounded-lg font-bold">ยกเลิก</button>
                        </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center text-sm bg-white dark:bg-gray-800 p-3 rounded-lg border dark:border-gray-700">
                      <span className="dark:text-gray-200"><span className="text-gray-400 mr-2 border px-1.5 rounded">{it.sort_order}</span><span className="text-blue-500 uppercase mr-2 tracking-wider">[{it.item_type}]</span>{it.title}</span>
                      <div className="flex gap-2">
                        <button onClick={() => handleEditItem(it)} className="text-blue-500 font-bold px-2 py-1 rounded bg-blue-50">แก้ไข</button>
                        <button onClick={() => handleDeleteItem(it.id)} className="text-red-500 font-bold px-2 py-1 rounded bg-red-50">ลบ</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {/* ฟอร์มเพิ่มเนื้อหาใหม่ (New Item) */}
              {!editingItemId && (
                <div className="mt-4 pt-4 border-t dark:border-gray-700">
                    <div className="flex gap-3 mb-4">
                        <input type="number" placeholder="ลำดับ" required className="w-20 p-2 border rounded-lg dark:bg-gray-800 dark:text-white outline-none" value={itemForm.sort_order} onChange={e=>setItemForm({...itemForm, sort_order: Number(e.target.value)})} />
                        <input type="text" placeholder="ชื่อเนื้อหาใหม่" required className="flex-1 p-2 border rounded-lg dark:bg-gray-800 dark:text-white outline-none" value={itemForm.title} onChange={e=>setItemForm({...itemForm, title: e.target.value})} />
                        <select className="p-2 border rounded-lg dark:bg-gray-800 dark:text-white outline-none" value={itemForm.item_type} onChange={e=>setItemForm({...itemForm, item_type: e.target.value})}>
                          <option value="video">วิดีโอ</option><option value="file">เอกสาร</option><option value="exam">แบบทดสอบ</option>
                        </select>
                    </div>
                    
                    {itemForm.item_type !== 'exam' ? (
                        <input type="file" onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)} className={fileInputClass} />
                    ) : (
                        renderExamEditor()
                    )}

                    {uploading && (
                       <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4 dark:bg-gray-700 overflow-hidden">
                          <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                       </div>
                    )}

                    <button onClick={(e) => handleSaveItem(e, pl.id)} disabled={uploading || !itemForm.title} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 font-bold rounded-lg transition-colors">{uploading ? 'กำลังบันทึก...' : 'เพิ่มเนื้อหา'}</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}