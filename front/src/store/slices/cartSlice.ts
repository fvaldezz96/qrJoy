import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import type { Product } from './productsSlice';

export interface CartItem {
  product: Product;
  qty: number;
}
interface CartState {
  items: CartItem[];
}
const initialState: CartState = { items: [] };

const slice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart(state, action: PayloadAction<{ product: Product; qty?: number }>) {
      const { product, qty = 1 } = action.payload;
      const found = state.items.find((i) => i.product._id === product._id);
      if (found) found.qty += qty;
      else state.items.push({ product, qty });
    },
    removeFromCart(state, action: PayloadAction<string>) {
      state.items = state.items.filter((i) => i.product._id !== action.payload);
    },
    clearCart(state) {
      state.items = [];
    },
  },
});

export const { addToCart, removeFromCart, clearCart } = slice.actions;
export default slice.reducer;
