import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

import api from '../../api/client';
import { RootState } from '../index';

export interface StockItem {
    _id: string;
    productId: {
        _id: string;
        name: string;
        sku: string;
    };
    location: 'bar' | 'restaurant' | 'door';
    quantity: number;
}

interface StockState {
    items: StockItem[];
    loading: boolean;
    error: string | null;
}

const initialState: StockState = { items: [], loading: false, error: null };

export const fetchStock = createAsyncThunk('stock/fetchAll', async () => {
    const { data } = await api.get('/stock');
    return data.data as StockItem[];
});

export const adjustStock = createAsyncThunk(
    'stock/adjust',
    async (body: { productId: string; location: string; delta: number }, { dispatch }) => {
        // PATCH /stock/:productId
        // body: { location, delta, set? }
        const { data } = await api.patch(`/stock/${body.productId}`, body);
        return data.data as StockItem; // Devuelve el stock actualizado
    },
);

// Acción para "Restock" completo (Expense + Stock)
export const restockProductThunk = createAsyncThunk(
    'stock/restock',
    async (
        payload: {
            productId: string;
            productName: string; // Para el gasto
            supplierId: string;
            quantity: number;
            cost: number;
            location: 'bar' | 'restaurant' | 'door';
        },
        { dispatch },
    ) => {
        // 1. Crear Gasto en Sistema A (Product API)
        // Usamos el endpoint específico o genérico de gastos
        await api.createExpense({
            name: `Restock: ${payload.productName}`,
            description: `Stock replenishment for ${payload.location}`,
            amount: payload.cost,
            quantity: 1,
            supplierId: payload.supplierId,
            productId: payload.productId, // Ojo: ID de System B vs A. Si coinciden genial, sino solo nombre.
            storeId: 'dummy-store-id', // El backend lo inferirá o lo pasamos si tenemos contexto
        });

        // 2. Actualizar Stock en Sistema B (QR API)
        const result = await dispatch(
            adjustStock({
                productId: payload.productId,
                location: payload.location,
                delta: payload.quantity,
            }),
        ).unwrap();

        return result;
    },
);

const stockSlice = createSlice({
    name: 'stock',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchStock.pending, (s) => {
                s.loading = true;
            })
            .addCase(fetchStock.fulfilled, (s, a) => {
                s.loading = false;
                s.items = a.payload;
            })
            .addCase(fetchStock.rejected, (s, a) => {
                s.loading = false;
                s.error = a.error.message || 'Error loading stock';
            })
            .addCase(adjustStock.fulfilled, (s, a) => {
                // Actualizar item en el array
                const idx = s.items.findIndex(
                    (i) => i.productId._id === a.payload.productId._id && i.location === a.payload.location,
                );
                if (idx !== -1) {
                    s.items[idx] = a.payload;
                } else {
                    s.items.push(a.payload);
                }
            });
    },
});

export const selectStockByProduct = (productId: string) => (state: RootState) =>
    state.stock.items.filter((i) => i.productId._id === productId);

export default stockSlice.reducer;
