import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import api from '../../api/client';

export const fetchComandas = createAsyncThunk(
  'admin/fetchComandas',
  async (station: 'bar' | 'kitchen') => {
    const { data } = await api.get('/comandas', { params: { station } });
    return data.data as any[];
  },
);

export const redeemQr = createAsyncThunk(
  'admin/redeemQr',
  async (payload: { code: string; signature: string }) => {
    const { data } = await api.post('/qr/redeem', payload);
    return data.data;
  },
);

const slice = createSlice({
  name: 'admin',
  initialState: { comandas: [] as any[], loading: false, lastRedeem: null as any },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchComandas.pending, (s) => {
      s.loading = true;
    })
      .addCase(fetchComandas.fulfilled, (s, a) => {
        s.loading = false;
        s.comandas = a.payload;
      })
      .addCase(fetchComandas.rejected, (s) => {
        s.loading = false;
      })
      .addCase(redeemQr.fulfilled, (s, a) => {
        s.lastRedeem = a.payload;
      });
  },
});

export default slice.reducer;
