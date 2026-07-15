import React from 'react';
import PromoCodeManager from '../../../components/PromoCodeManager';
import ExamEditor from '../../../components/ExamEditor';

interface ManageContentProps {
  courses: any[];
  selectedCourse: any;
  setSelectedCourse: (course: any) => void;
  editingPromoId: string | null;
  setEditingPromoId: (id: string | null) => void;
  promoForm: any;
  setPromoForm: (form: any) => void;
  promoCodes: any[];
  handleSavePromo: (e: React.FormEvent) => void;
  handleDeletePromo: (id: string) => void;
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
    <div className="bg-white  p-8 rounded-md shadow-sm border border-gray-100  transition-colors">
      <div className="mb-8">
        <h2 className="text-2xl font-black mb-4 text-gray-900 ">จัดการเนื้อหาและโปรโมโค้ด</h2>
        <select 
          className="w-full p-4 border border-gray-200 rounded-md    outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
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
          <div className="p-6 border-2 border-dashed border-purple-100 /40 bg-purple-50/30 /50 rounded-md">
            <h4 className="text-lg font-bold text-purple-700  mb-4 flex items-center gap-2">
              {editingPlaylistId ? '✏️ แก้ไขบทเรียน' : '📝 สร้างบทเรียนใหม่ (Playlist)'}
            </h4>
            <form onSubmit={handleSavePlaylist} className="flex flex-col sm:flex-row gap-4">
              <input type="number" placeholder="ลำดับ" required className="w-full sm:w-24 p-3.5 border border-gray-200 rounded-md    outline-none focus:ring-2 focus:ring-purple-500" value={playlistForm.sort_order} onChange={e=>setPlaylistForm({...playlistForm, sort_order: Number(e.target.value)})} />
              <input type="text" placeholder="ชื่อบทเรียน" required className="flex-1 p-3.5 border border-gray-200 rounded-md    outline-none focus:ring-2 focus:ring-purple-500" value={playlistForm.title} onChange={e=>setPlaylistForm({...playlistForm, title: e.target.value})} />
              <div className="flex gap-2">
                <button type="submit" className="bg-primary hover:bg-purple-700 text-white px-8 py-3.5 font-bold rounded-md transition-all shadow-md">{editingPlaylistId ? 'อัปเดต' : '+ เพิ่มบทเรียน'}</button>
                {editingPlaylistId && <button type="button" onClick={()=>{setEditingPlaylistId(null); setPlaylistForm({title: '', sort_order: 1});}} className="bg-gray-200 text-gray-700 px-6 py-3.5 font-bold rounded-md hover:bg-gray-300 transition-colors">ยกเลิก</button>}
              </div>
            </form>
          </div>

          {/* 3. Render Playlists */}
          <div className="space-y-6">
            {selectedCourse.playlists?.map((pl: any) => (
              <div key={pl.id} className="bg-canvas /50 p-6 rounded-md border border-gray-100 ">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200 ">
                  <h3 className="font-bold text-xl  flex items-center gap-3">
                    <span className="bg-purple-100 text-purple-700 w-8 h-8 flex items-center justify-center rounded-full text-sm">{pl.sort_order}</span>
                    {pl.title}
                  </h3>
                  <div className="flex gap-2">
                    <button onClick={() => {setEditingPlaylistId(pl.id); setPlaylistForm({title:pl.title, sort_order:pl.sort_order});}} className="text-primary font-bold px-3 py-1.5 text-sm bg-blue-50 rounded-md hover:bg-blue-100 transition-colors">แก้ไข</button>
                    <button onClick={() => handleDeletePlaylist(pl.id)} className="text-red-600 font-bold px-3 py-1.5 text-sm bg-red-50 rounded-md hover:bg-red-100 transition-colors">ลบ</button>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {pl.items?.map((it: any) => (
                    <div key={it.id}>
                      {editingItemId === it.id ? (
                        <div className="p-6 bg-white  border-2 border-blue-400 rounded-md my-4 shadow-sm">
                           <div className="flex flex-col sm:flex-row gap-3 mb-6">
                              <input type="number" placeholder="ลำดับ" required className="w-full sm:w-24 p-3 border border-gray-200 rounded-md    outline-none" value={itemForm.sort_order} onChange={e=>setItemForm({...itemForm, sort_order: Number(e.target.value)})} />
                              <input type="text" placeholder="ชื่อคลิป/ไฟล์" required className="flex-1 p-3 border border-gray-200 rounded-md    outline-none" value={itemForm.title} onChange={e=>setItemForm({...itemForm, title: e.target.value})} />
                              <select className="p-3 border border-gray-200 rounded-md    outline-none font-medium" value={itemForm.item_type} onChange={e=>setItemForm({...itemForm, item_type: e.target.value})}>
                                <option value="video">🎥 วิดีโอ</option><option value="file">📄 เอกสาร</option><option value="exam">📝 แบบทดสอบ</option>
                              </select>
                          </div>
                          
                          {itemForm.item_type !== 'exam' ? (
                              <input type="file" onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)} className={fileInputClass} />
                          ) : (
                              <ExamEditor examQuestions={props.examQuestions} setExamQuestions={props.setExamQuestions} />
                          )}

                          {uploading && (
                             <div className="w-full bg-gray-100 rounded-full h-3 mb-6  overflow-hidden">
                                <div className="bg-primary h-3 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                             </div>
                          )}

                          <div className="flex gap-3">
                              <button onClick={(e) => handleSaveItem(e, pl.id)} disabled={uploading} className="bg-primary hover:bg-primary-active text-white px-8 py-3 rounded-md font-bold transition-all shadow-md">{uploading ? 'กำลังบันทึก...' : '💾 บันทึกเนื้อหา'}</button>
                              <button onClick={() => setEditingItemId(null)} disabled={uploading} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-3 rounded-md font-bold transition-colors">ยกเลิก</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center bg-white  p-4 rounded-md border border-gray-100  hover:shadow-sm transition-shadow">
                          <span className=" flex items-center gap-3">
                            <span className="text-gray-400 bg-gray-100  w-6 h-6 flex items-center justify-center rounded text-xs font-bold">{it.sort_order}</span>
                            <span className="text-primary bg-blue-50 /30 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">{it.item_type}</span>
                            <span className="font-medium">{it.title}</span>
                          </span>
                          <div className="flex gap-2">
                            <button onClick={() => handleEditItem(it)} className="text-primary font-bold px-3 py-1.5 text-sm rounded-md hover:bg-blue-50 transition-colors">แก้ไข</button>
                            <button onClick={() => handleDeleteItem(it.id)} className="text-red-500 font-bold px-3 py-1.5 text-sm rounded-md hover:bg-red-50 transition-colors">ลบ</button>
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
                        }} className="w-full border-2 border-dashed border-gray-300  text-primary hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-gray-800 py-4 font-bold rounded-md transition-all">
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