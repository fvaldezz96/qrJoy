import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

import api from '../../api/client';
import type { RootState } from '..';

export interface OrderPayResponse {
  orderId: string;
  pngDataUrl: string;
  code: string;
  signature: string;
}

export interface QR {
  pngDataUrl: string;
  code: string;
  signature: string;
}

export interface Order {
  _id: string;
  items: {
    productId: string;
    qty: number;
    price: number;
  }[];
  tableId?: string;
  type: string;
  qrId?: string;
  qr: QR;
  userId?: string;
  total: number;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GetAllOrdersResponse {
  orders: Order[];
  total: number;
  page?: number;
  limit?: number;
}

// Crear una nueva orden
export const createOrder = createAsyncThunk(
  'orders/create',
  async ({ tableId, type }: { tableId: string; type: string }, { getState }) => {
    console.log('Creating order for tableId:', tableId, 'type:', type);
    const st = getState() as RootState;

    const items = st.cart.items.map((i) => ({
      productId: i.product._id,
      qty: i.qty,
      price: i.product.price,
    }));

    // console.log('Creating order with:', { items, tableId, type });

    const { data } = await axios.post('https://qrjoy-api-production.up.railway.app/orders', {
      items,
      tableId,
      type,
    });

    return data.data._id as string;
  },
);

// Pagar una orden simulada
export const payMockOrder = createAsyncThunk('orders/payMock', async (orderId: string) => {
  const { data } = await api.post(`/orders/${orderId}/pay-mock`);
  return data.data as OrderPayResponse;
});

// Obtener todas las órdenes
export const getAllOrders = createAsyncThunk('orders/getAll', async () => {
  try {
    const { data } = await axios.get('https://qrjoy-api-production.up.railway.app/orders');

    const orders = data.data.orders;
    const total = data.data.total;

    return { orders, total };
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    throw new Error(error.response?.data?.message || 'Error fetching orders');
  }
});

const slice = createSlice({
  name: 'orders',
  initialState: {
    currentOrderId: null as string | null,
    qr: null as OrderPayResponse | null,
    orders: [] as Order[],
    ordersMeta: {
      total: 0,
      page: 1,
      limit: 10,
    },
    loading: false,
    loadingOrders: false,
    error: undefined as string | undefined,
  },
  reducers: {
    resetOrder(s) {
      s.currentOrderId = null;
      s.qr = null;
    },
    clearOrders(s) {
      s.orders = [];
      s.ordersMeta = { total: 0, page: 1, limit: 10 };
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
      })
      .addCase(getAllOrders.pending, (s) => {
        s.loadingOrders = true;
        s.error = undefined;
      })
      .addCase(getAllOrders.fulfilled, (s, a) => {
        s.loadingOrders = false;
        s.orders = a.payload.orders;
        s.ordersMeta = {
          total: a.payload.total,
          page: a.payload?.page || 1,
          limit: a.payload?.limit || 10,
        };
      })
      .addCase(getAllOrders.rejected, (s, a) => {
        s.loadingOrders = false;
        s.error = a.error.message;
      });
  },
});

export const { resetOrder, clearOrders } = slice.actions;
export default slice.reducer;
