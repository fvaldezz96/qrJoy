import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

import { API_BASE_URL } from '../../config';

export interface AdminMetrics {
  orders: {
    total: number;
    pending: number;
    paid: number;
    revenue: number;
  };
  products: {
    active: number;
    outOfStock: number;
  };
  tickets: {
    total: number;
    used: number;
    unused: number;
    revenue: number;
  };
  qrs: {
    totalGenerated: number;
    used: number;
  };
}

export const fetchMetrics = createAsyncThunk('admin/fetchMetrics', async () => {
  const { data } = await axios.get(`${API_BASE_URL}/admin/metrics`);
  // console.log('Fetched admin metrics:', data);
  return data.data as AdminMetrics;
});

const adminSlice = createSlice({
  name: 'admin',
  initialState: {
    metrics: null as AdminMetrics | null,
    loading: false,
    error: undefined as string | undefined,
  },
  reducers: {
    clearMetrics: (state) => {
      state.metrics = null;
      state.error = undefined;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMetrics.pending, (state) => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(fetchMetrics.fulfilled, (state, action) => {
        state.loading = false;
        state.metrics = action.payload;
      })
      .addCase(fetchMetrics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { clearMetrics } = adminSlice.actions;
export default adminSlice.reducer;
