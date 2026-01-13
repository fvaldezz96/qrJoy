import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

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
    productId?: string;
    productName?: string;
    qty: number;
    price: number;
  }[];
  tableId?: string;
  tableNumber?: number | null;
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

export interface MpPreferenceResponse {
  preferenceId: string;
  initPoint: string;
  sandboxInitPoint?: string;
}

// Crear una nueva orden
export const createOrder = createAsyncThunk(
  'orders/create',
  async ({ tableId, type, items: distinctItems }: { tableId?: string; type: string; items?: any[] }, { getState }) => {
    const st = getState() as RootState;

    // Use provided items OR fallback to global cart
    let items = distinctItems;

    if (!items) {
      items = st.cart.items.map((i) => ({
        productId: i.product._id,
        qty: i.qty,
        price: i.product.price,
      }));
    } else {
      // Ensure format if passing from local state
      items = items.map(i => ({
        productId: i.product._id,
        qty: i.quantity || i.qty,
        price: i.price
      }));
    }

    const body: Record<string, any> = {
      items,
      tableId,
      type,
    };

    if (st.auth.user?._id) {
      body.userId = st.auth.user._id;
    }

    const { data } = await api.post('/orders', body);

    return data.data._id as string;
  },
);

export const payMockOrder = createAsyncThunk('orders/payMock', async (orderId: string) => {
  try {
    const { data } = await api.post(`/orders/${orderId}/pay-mock`);
    return data.data as OrderPayResponse;

  } catch (error: any) {
    console.error('Error paying order:', error);
    throw new Error(error.response?.data?.message || 'Error paying order');
  }
});

export const createMpPayment = createAsyncThunk(
  'orders/createMpPayment',
  async ({ orderId }: { orderId: string }) => {
    const { data } = await api.post('/payments/mp/create', { orderId });
    return data.data as MpPreferenceResponse;
  },
);

export const confirmMpPayment = createAsyncThunk(
  'orders/confirmMpPayment',
  async ({ paymentId, orderId }: { paymentId?: string; orderId?: string }) => {
    const { data } = await api.post('/payments/mp/confirm', { paymentId, orderId });
    return data.data as OrderPayResponse;
  },
);

export const getAllOrders = createAsyncThunk('orders/getAll', async () => {
  try {
    const { data } = await api.get('/orders');

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
    // Acciones de WebSocket en tiempo real
    orderCreatedRealtime(s, a: PayloadAction<Order>) {
      // Agregar nueva orden al inicio de la lista
      s.orders.unshift(a.payload);
      s.ordersMeta.total += 1;
    },
    orderUpdatedRealtime(s, a: PayloadAction<Order>) {
      // Actualizar orden existente
      const index = s.orders.findIndex(order => order._id === a.payload._id);
      if (index !== -1) {
        s.orders[index] = a.payload;
      }
    },
    orderStatusChangedRealtime(s, a: PayloadAction<{ orderId: string; status: string; updatedAt?: string }>) {
      // Actualizar solo el status de la orden
      const index = s.orders.findIndex(order => order._id === a.payload.orderId);
      if (index !== -1) {
        s.orders[index].status = a.payload.status;
        if (a.payload.updatedAt) {
          s.orders[index].updatedAt = a.payload.updatedAt;
        }
      }
    },
    orderDeletedRealtime(s, a: PayloadAction<{ orderId: string }>) {
      // Remover orden de la lista
      s.orders = s.orders.filter(order => order._id !== a.payload.orderId);
      s.ordersMeta.total = Math.max(0, s.ordersMeta.total - 1);
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
      .addCase(createMpPayment.pending, (s) => {
        s.loading = true;
      })
      .addCase(createMpPayment.fulfilled, (s) => {
        s.loading = false;
      })
      .addCase(createMpPayment.rejected, (s, a) => {
        s.loading = false;
        s.error = a.error.message;
      })
      .addCase(confirmMpPayment.pending, (s) => {
        s.loading = true;
      })
      .addCase(confirmMpPayment.fulfilled, (s, a) => {
        s.loading = false;
        s.qr = a.payload;
      })
      .addCase(confirmMpPayment.rejected, (s, a) => {
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
        // s.ordersMeta = {
        //   total: a.payload.total,
        //   page: a.payload?.page || 1,
        //   limit: a.payload?.limit || 10,
        // };
      })
      .addCase(getAllOrders.rejected, (s, a) => {
        s.loadingOrders = false;
        s.error = a.error.message;
      });
  },
});

export const {
  resetOrder,
  clearOrders,
  orderCreatedRealtime,
  orderUpdatedRealtime,
  orderStatusChangedRealtime,
  orderDeletedRealtime
} = slice.actions;
export default slice.reducer;
