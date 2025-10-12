import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import api from '../../api/client';
import type { RootState } from '..';

export interface OrderPayResponse {
  orderId: string;
  pngDataUrl: string;
  code: string;
  signature: string;
}

export const createOrder = createAsyncThunk('orders/create', async (_: void, { getState }) => {
  const st = getState() as RootState;
  const items = st.cart.items.map((i) => ({
    productId: i.product._id,
    qty: i.qty,
    price: i.product.price,
  }));
  const { data } = await api.post('/orders', { type: 'bar', items });
  return data.data._id as string;
});

export const payMockOrder = createAsyncThunk('orders/payMock', async (orderId: string) => {
  const { data } = await api.post(`/orders/${orderId}/pay-mock`);
  return data.data as OrderPayResponse;
});

const slice = createSlice({
  name: 'orders',
  initialState: {
    currentOrderId: null as string | null,
    qr: null as OrderPayResponse | null,
    loading: false,
    error: undefined as string | undefined,
  },
  reducers: {
    resetOrder(s) {
      s.currentOrderId = null;
      s.qr = null;
    },
  },
  extraReducers: (b) => {
    b.addCase(createOrder.pending, (s) => {
      s.loading = true;
    })
      .addCase(createOrder.fulfilled, (s, a) => {
        s.loading = false;
        s.currentOrderId = a.payload;
      })
      .addCase(createOrder.rejected, (s, a) => {
        s.loading = false;
        s.error = a.error.message;
      })
      .addCase(payMockOrder.pending, (s) => {
        s.loading = true;
      })
      .addCase(payMockOrder.fulfilled, (s, a) => {
        s.loading = false;
        s.qr = a.payload;
      })
      .addCase(payMockOrder.rejected, (s, a) => {
        s.loading = false;
        s.error = a.error.message;
      });
  },
});

export const { resetOrder } = slice.actions;
export default slice.reducer;
