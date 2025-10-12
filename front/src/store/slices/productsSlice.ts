import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import api from '../../api/client';

export interface Product {
  _id: string;
  name: string;
  category: 'drink' | 'food' | 'ticket';
  price: number;
  imageUrl?: string;
}

export const fetchProducts = createAsyncThunk(
  'products/fetch',
  async (category?: 'drink' | 'food' | 'ticket') => {
    const { data } = await api.get('/products', { params: { category } });
    return data.data as Product[];
  },
);

const slice = createSlice({
  name: 'products',
  initialState: { list: [] as Product[], loading: false, error: undefined as string | undefined },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchProducts.pending, (s) => {
      s.loading = true;
    })
      .addCase(fetchProducts.fulfilled, (s, a) => {
        s.loading = false;
        s.list = a.payload;
      })
      .addCase(fetchProducts.rejected, (s, a) => {
        s.loading = false;
        s.error = a.error.message;
      });
  },
});

export default slice.reducer;
