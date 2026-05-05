import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string;
  stock: number;
}

interface CartState {
  items: CartItem[];
}

const initialState: CartState = {
  items: [],
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const existing = state.items.find(item => item.productId === action.payload.productId);
      if (existing) {
        if (existing.quantity + action.payload.quantity <= action.payload.stock) {
          existing.quantity += action.payload.quantity;
        } else {
          existing.quantity = action.payload.stock;
        }
      } else {
        // จำกัดไม่ให้เพิ่มเกิดจำนวนสต็อกที่มีตั้งแต่ครั้งแรก
        const qty = Math.min(action.payload.quantity, action.payload.stock);
        if (qty > 0) {
          state.items.push({ ...action.payload, quantity: qty });
        }
      }
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.productId !== action.payload);
    },
    updateQuantity: (state, action: PayloadAction<{productId: string, quantity: number}>) => {
      const itemIndex = state.items.findIndex(i => i.productId === action.payload.productId);
      if (itemIndex !== -1) {
        const item = state.items[itemIndex];
        // หากจำนวนที่อัปเดตเหลือน้อยกว่าหรือเท่ากับ 0 ให้ลบออกจากตะกร้าอัตโนมัติ
        if (action.payload.quantity <= 0) {
          state.items.splice(itemIndex, 1);
        } else if (action.payload.quantity <= item.stock) {
          item.quantity = action.payload.quantity;
        } else {
          item.quantity = item.stock;
        }
      }
    },
    clearCart: (state) => {
      state.items = [];
    }
  },
});

export const { addToCart, removeFromCart, updateQuantity, clearCart } = cartSlice.actions;
export default cartSlice.reducer;