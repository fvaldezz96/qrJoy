import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import api from '../../api/client';
import { RootState } from '../index';

export interface Supplier {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
    active: boolean;
}

interface SuppliersState {
    items: Supplier[];
    loading: boolean;
    error: string | null;
}

const initialState: SuppliersState = { items: [], loading: false, error: null };

export const fetchSuppliers = createAsyncThunk('suppliers/fetchAll', async () => {
    // GET /api/suppliers (System A endpoint)
    // Usamos el cliente api que tiene soporte para fallback o proxy si está configurado
    const { data } = await api.getSuppliers();
    return data.data as Supplier[]; // Asumiendo estructura estandar
});

const suppliersSlice = createSlice({
    name: 'suppliers',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchSuppliers.pending, (s) => {
                s.loading = true;
            })
            .addCase(fetchSuppliers.fulfilled, (s, a) => {
                s.loading = false;
                s.items = a.payload || [];
            })
            .addCase(fetchSuppliers.rejected, (s, a) => {
                s.loading = false;
                s.error = a.error.message || 'Error loading suppliers';
            });
    },
});

export const selectAllSuppliers = (state: RootState) => state.suppliers.items;

export default suppliersSlice.reducer;
