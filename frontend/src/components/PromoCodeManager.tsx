import React from 'react';

interface PromoCodeManagerProps {
  editingPromoId: string | null;
  setEditingPromoId: (id: string | null) => void;
  promoForm: any;
  setPromoForm: (form: any) => void;
  promoCodes: any[];
  handleSavePromo: (e: React.FormEvent) => void;
  handleDeletePromo: (id: string) => void;
}

export default function PromoCodeManager({
  editingPromoId, setEditingPromoId, promoForm, setPromoForm, promoCodes, handleSavePromo, handleDeletePromo
}: PromoCodeManagerProps) {
  return (
    <div className="p-6 border border-blue-100 bg-blue-50/40 dark:bg-blue-900/20 rounded-3xl shadow-sm">
      <h4 className="text-lg font-bold text-blue-800 dark:text-blue-300 mb-6 flex items-center gap-2">
        {editingPromoId ? '🎟️ แก้ไขโปรโมโค้ด' : '🎟️ สร้างโปรโมโค้ดใหม่สำหรับคอร์สนี้'}
      </h4>
      <form onSubmit={handleSavePromo} className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label className="block text-xs font-bold text-blue-700 dark:text-blue-400 mb-2">รหัสโค้ดส่วนลด</label>
          <input type="text" placeholder="เช่น SUMMER50" required className="w-full p-3.5 border border-blue-200 rounded-xl dark:bg-gray-900 dark:border-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all" value={promoForm.code} onChange={e=>setPromoForm({...promoForm, code: e.target.value.toUpperCase()})} />
        </div>
        <div className="w-full sm:w-32 shrink-0">
          <label className="block text-xs font-bold text-red-600 dark:text-red-400 mb-2">ส่วนลด (บาท)</label>
          <input type="number" placeholder="0" required min="0" className="w-full p-3.5 border border-red-200 rounded-xl dark:border-red-900/50 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-red-500 transition-all" value={promoForm.discount_amount} onChange={e=>setPromoForm({...promoForm, discount_amount: Number(e.target.value)})} />
        </div>
        <div className="w-full sm:w-36 shrink-0">
          <label className="block text-xs font-bold text-green-700 dark:text-green-400 mb-2">สิทธิ์ที่ใช้ได้</label>
          <input type="number" placeholder="0 = ไม่จำกัด" required min="0" className="w-full p-3.5 border border-green-200 rounded-xl dark:border-green-900/50 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-green-500 transition-all" value={promoForm.max_uses} onChange={e=>setPromoForm({...promoForm, max_uses: Number(e.target.value)})} />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button type="submit" className="bg-blue-600 text-white font-bold px-8 py-3.5 rounded-xl hover:bg-blue-700 transition-all shadow-md w-full">{editingPromoId ? 'บันทึก' : 'สร้างโค้ด'}</button>
          {editingPromoId && <button type="button" onClick={()=>{setEditingPromoId(null); setPromoForm({code:'',discount_amount:0,max_uses:0});}} className="bg-white border border-gray-300 text-gray-700 font-bold px-6 py-3.5 rounded-xl hover:bg-gray-50 transition-colors">ยกเลิก</button>}
        </div>
      </form>
      
      {/* รายการโค้ด */}
      <div className="mt-8 border-t border-blue-200/50 dark:border-blue-800/50 pt-6">
        <h5 className="font-bold text-sm mb-4 text-blue-800 dark:text-blue-300">รายการโค้ดส่วนลดที่สร้างแล้ว</h5>
        {promoCodes.length === 0 ? <p className="text-sm text-gray-500 bg-white dark:bg-gray-800 p-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-center">ยังไม่มีโค้ดส่วนลดสำหรับคอร์สนี้</p> : (
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {promoCodes.map((pc: any) => (
                    <div key={pc.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-hover hover:border-blue-300">
                        <div>
                            <div className="flex items-center gap-3 mb-1.5">
                                <span className="font-black text-blue-600 text-lg">{pc.code}</span>
                                <span className="bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1 rounded-md">ลด ฿{pc.discount_amount}</span>
                            </div>
                            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                ใช้ไปแล้ว <span className={pc.max_uses > 0 && pc.uses?.length >= pc.max_uses ? "text-red-500 font-bold" : "text-green-600 font-bold"}>{pc.uses?.length || 0}</span> / {pc.max_uses > 0 ? `${pc.max_uses} สิทธิ์` : 'ไม่จำกัดสิทธิ์'}
                            </div>
                        </div>
                        <div className="flex gap-2 items-center">
                          <button onClick={()=>{setEditingPromoId(pc.id); setPromoForm({code: pc.code, discount_amount: pc.discount_amount, max_uses: pc.max_uses});}} className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-4 py-2 rounded-lg text-sm font-bold transition-colors">แก้ไข</button>
                          <button onClick={()=>handleDeletePromo(pc.id)} className="bg-red-50 text-red-700 hover:bg-red-100 px-4 py-2 rounded-lg text-sm font-bold transition-colors">ลบ</button>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
}