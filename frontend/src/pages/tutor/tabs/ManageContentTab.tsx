import React from 'react';
import PromoCodeManager from '../../../components/PromoCodeManager';
import ExamEditor from '../../../components/ExamEditor';

// Type definitions can be moved to a separate types.ts file for better structure
interface ManageContentProps {
  courses: any[];
  selectedCourse: any;
  setSelectedCourse: (course: any) => void;
  // ... (keep existing props for state management, or ideally move to a Context/Zustand slice later)
  editingPromoId: string | null;
  setEditingPromoId: (id: string | null) => void;
  promoForm: any;
  setPromoForm: (form: any) => void;
  promoCodes: any[];
  handleSavePromo: (e: React.FormEvent) => void;
  handleDeletePromo: (id: string) => void;
  // Playlist & Items
  editingPlaylistId: string | null;
  setEditingPlaylistId: (id: string | null) => void;
  playlistForm: any;
  setPlaylistForm: (form: any) => void;
  handleSavePlaylist: (e: React.FormEvent) => void;
  handleDeletePlaylist: (id: string) => void;
  editingItemId: string | null;
  setEditingItemId: (id: string | null) => void;
  itemForm: any;
  setItemForm: (form: any) => void;
  setSelectedFile: (file: File | null) => void;
  uploading: boolean;
  uploadProgress: number;
  handleSaveItem: (e: React.FormEvent, playlistId: string) => void;
  handleEditItem: (item: any) => void;
  handleDeleteItem: (id: string) => void;
  // Exam
  examQuestions: any[];
  setExamQuestions: (questions: any[]) => void;
  fileInputClass: string;
}

export default function ManageContentTab(props: ManageContentProps) {
  const {
    courses, selectedCourse, setSelectedCourse,
    editingPlaylistId, setEditingPlaylistId, playlistForm, setPlaylistForm, handleSavePlaylist, handleDeletePlaylist,
    editingItemId, setEditingItemId, itemForm, setItemForm, setSelectedFile, uploading, uploadProgress, handleSaveItem, handleEditItem, handleDeleteItem,
    fileInputClass
  } = props;

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
      <div className="mb-8">
        <h2 className="text-2xl font-black mb-4 text-gray-900 dark:text-white">จัดการเนื้อหาและโปรโมโค้ด</h2>
        <select 
          className="w-full p-4 border border-gray-200 rounded-2xl dark:bg-gray-900 dark:border-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
          onChange={(e) => {
            setSelectedCourse(courses.find((c: any) => c.id === e.target.value));
            setEditingPlaylistId(null); 
            setEditingItemId(null);
          }}
        >
          <option value="">-- เลือกคอร์สเรียน --</option>
          {courses.map((c: any) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </div>

      {selectedCourse && (
        <div className="space-y-10 animate-fade-in">
          {/* 1. Promo Code Section */}
          <PromoCodeManager {...props} />

          {/* 2. Playlist & Items Section */}
          <div className="p-6 border-2 border-dashed border-purple-100 dark:border-purple-900/40 bg-purple-50/30 dark:bg-gray-800/50 rounded-3xl">
            <h4 className="text-lg font-bold text-purple-700 dark:text-purple-400 mb-4 flex items-center gap-2">
              {editingPlaylistId ? '✏️ แก้ไขบทเรียน' : '📝 สร้างบทเรียนใหม่ (Playlist)'}
            </h4>
            <form onSubmit={handleSavePlaylist} className="flex flex-col sm:flex-row gap-4">
              <input type="number" placeholder="ลำดับ" required className="w-full sm:w-24 p-3.5 border border-gray-200 rounded-xl dark:bg-gray-900 dark:border-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-purple-500" value={playlistForm.sort_order} onChange={e=>setPlaylistForm({...playlistForm, sort_order: Number(e.target.value)})} />
              <input type="text" placeholder="ชื่อบทเรียน" required className="flex-1 p-3.5 border border-gray-200 rounded-xl dark:bg-gray-900 dark:border-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-purple-500" value={playlistForm.title} onChange={e=>setPlaylistForm({...playlistForm, title: e.target.value})} />
              <div className="flex gap-2">
                <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3.5 font-bold rounded-xl transition-all shadow-md">{editingPlaylistId ? 'อัปเดต' : '+ เพิ่มบทเรียน'}</button>
                {editingPlaylistId && <button type="button" onClick={()=>{setEditingPlaylistId(null); setPlaylistForm({title: '', sort_order: 1});}} className="bg-gray-200 text-gray-700 px-6 py-3.5 font-bold rounded-xl hover:bg-gray-300 transition-colors">ยกเลิก</button>}
              </div>
            </form>
          </div>

          {/* 3. Render Playlists */}
          <div className="space-y-6">
            {selectedCourse.playlists?.map((pl: any) => (
              <div key={pl.id} className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-bold text-xl dark:text-white flex items-center gap-3">
                    <span className="bg-purple-100 text-purple-700 w-8 h-8 flex items-center justify-center rounded-full text-sm">{pl.sort_order}</span>
                    {pl.title}
                  </h3>
                  <div className="flex gap-2">
                    <button onClick={() => {setEditingPlaylistId(pl.id); setPlaylistForm({title:pl.title, sort_order:pl.sort_order});}} className="text-blue-600 font-bold px-3 py-1.5 text-sm bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">แก้ไข</button>
                    <button onClick={() => handleDeletePlaylist(pl.id)} className="text-red-600 font-bold px-3 py-1.5 text-sm bg-red-50 rounded-lg hover:bg-red-100 transition-colors">ลบ</button>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {pl.items?.map((it: any) => (
                    <div key={it.id}>
                      {editingItemId === it.id ? (
                        <div className="p-6 bg-white dark:bg-gray-800 border-2 border-blue-400 rounded-2xl my-4 shadow-sm">
                           <div className="flex flex-col sm:flex-row gap-3 mb-6">
                              <input type="number" placeholder="ลำดับ" required className="w-full sm:w-24 p-3 border border-gray-200 rounded-xl dark:bg-gray-900 dark:border-gray-700 dark:text-white outline-none" value={itemForm.sort_order} onChange={e=>setItemForm({...itemForm, sort_order: Number(e.target.value)})} />
                              <input type="text" placeholder="ชื่อคลิป/ไฟล์" required className="flex-1 p-3 border border-gray-200 rounded-xl dark:bg-gray-900 dark:border-gray-700 dark:text-white outline-none" value={itemForm.title} onChange={e=>setItemForm({...itemForm, title: e.target.value})} />
                              <select className="p-3 border border-gray-200 rounded-xl dark:bg-gray-900 dark:border-gray-700 dark:text-white outline-none font-medium" value={itemForm.item_type} onChange={e=>setItemForm({...itemForm, item_type: e.target.value})}>
                                <option value="video">🎥 วิดีโอ</option><option value="file">📄 เอกสาร</option><option value="exam">📝 แบบทดสอบ</option>
                              </select>
                          </div>
                          
                          {itemForm.item_type !== 'exam' ? (
                              <input type="file" onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)} className={fileInputClass} />
                          ) : (
                              <ExamEditor examQuestions={props.examQuestions} setExamQuestions={props.setExamQuestions} />
                          )}

                          {uploading && (
                             <div className="w-full bg-gray-100 rounded-full h-3 mb-6 dark:bg-gray-700 overflow-hidden">
                                <div className="bg-blue-600 h-3 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                             </div>
                          )}

                          <div className="flex gap-3">
                              <button onClick={(e) => handleSaveItem(e, pl.id)} disabled={uploading} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-md">{uploading ? 'กำลังบันทึก...' : '💾 บันทึกเนื้อหา'}</button>
                              <button onClick={() => setEditingItemId(null)} disabled={uploading} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-3 rounded-xl font-bold transition-colors">ยกเลิก</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:shadow-sm transition-shadow">
                          <span className="dark:text-gray-200 flex items-center gap-3">
                            <span className="text-gray-400 bg-gray-100 dark:bg-gray-700 w-6 h-6 flex items-center justify-center rounded text-xs font-bold">{it.sort_order}</span>
                            <span className="text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">{it.item_type}</span>
                            <span className="font-medium">{it.title}</span>
                          </span>
                          <div className="flex gap-2">
                            <button onClick={() => handleEditItem(it)} className="text-blue-600 font-bold px-3 py-1.5 text-sm rounded-lg hover:bg-blue-50 transition-colors">แก้ไข</button>
                            <button onClick={() => handleDeleteItem(it.id)} className="text-red-500 font-bold px-3 py-1.5 text-sm rounded-lg hover:bg-red-50 transition-colors">ลบ</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* ปุ่มเพิ่มเนื้อหาใหม่ใน Playlist */}
                  {!editingItemId && (
                    <div className="mt-4 pt-4">
                        <button onClick={() => {
                          setEditingItemId("new"); 
                          setItemForm({ title: '', item_type: 'video', sort_order: (pl.items?.length || 0) + 1, content_url: '' });
                        }} className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 py-4 font-bold rounded-2xl transition-all">
                          + เพิ่มเนื้อหาใหม่ในบทเรียนนี้
                        </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}