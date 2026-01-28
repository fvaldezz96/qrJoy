import { createAsyncThunk, createEntityAdapter, createSlice } from '@reduxjs/toolkit';

import api from '../../api/client';
import { ENDPOINTS } from '../../config';
import { setAuthToken } from '../../api/setAuthToken';
import { readToken } from '../../utils/tokenStorage';
import { RootState } from '../index';

export type ProductCategory = 'drink' | 'food' | 'ticket';

export interface Product {
  _id: string;
  id: string;
  selectId: string;
  name: string;
  category: ProductCategory;
  price: number;
  imageUrl?: string;
  sku?: string;
  active: boolean;
  stock?: number;
  enabled: boolean;
  redeemed?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type UpsertProductDto = Omit<Product, '_id' | 'createdAt' | 'updatedAt'>;

const productsAdapter = createEntityAdapter<Product>({
  sortComparer: (a: Product, b: Product) => a.name.localeCompare(b.name),
});

export const createProduct = createAsyncThunk<Product, Partial<Product>>(
  'products/create',
  async (payload, { rejectWithValue }) => {
    try {
      const storedToken = await readToken();
      if (storedToken) {
        setAuthToken(storedToken);
      }

      const { data } = await api.post(ENDPOINTS.products.create, payload);
      return data.data as Product;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.message || 'No se pudo crear el producto');
    }
  },
);

interface ProductsState {
  loading: boolean;
  loadingByCategory: Record<ProductCategory | 'all', boolean>;
  error: string | null;
  lastFetched: number;
  creating: boolean;
  createError: string | null;
}

const initialState = productsAdapter.getInitialState<ProductsState>({
  loading: false,
  loadingByCategory: { all: false, drink: false, food: false, ticket: false },
  error: null,
  lastFetched: 0,
  creating: false,
  createError: null,
});

// === THUNKS ===

type FetchProductsArgs = { force?: boolean; category?: ProductCategory | 'all' };

/** TRAE PRODUCTOS CON FILTRO OPCIONAL + CACHÉ */
export const fetchProducts = createAsyncThunk<
  Product[],
  FetchProductsArgs | void,
  { state: RootState }
>(
  'products/fetchAll',
  async (args, { getState }) => {
    const state = getState();
    const force = args?.force || false;

    // Caché: si ya tiene datos, no recarga
    const hasData = Object.keys(state.products.entities).length > 0;
    if (hasData && !force) {
      return Object.values(state.products.entities) as Product[];
    }

    // TRAE TODO
    const { data } = await api.get(ENDPOINTS.products.base);
    return data.data.items as Product[];
  },
  {
    condition: (_, { getState }) => {
      const { loading } = getState().products;
      return !loading; // evita múltiples llamadas
    },
  },
);

// === SLICE ===
const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    clearProductsError: (state) => {
      state.error = null;
    },
    clearProductsCache: (state) => {
      productsAdapter.removeAll(state);
      state.lastFetched = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      // === FETCH ALL ===
      .addCase(fetchProducts.pending, (state, action) => {
        const category = (action.meta.arg as FetchProductsArgs | undefined)?.category || 'all';
        state.loadingByCategory[category] = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        const category = (action.meta.arg as FetchProductsArgs | undefined)?.category || 'all';
        state.loadingByCategory[category] = false;
        state.loading = false;
        state.lastFetched = Date.now();

        if (category === 'all') {
          productsAdapter.setAll(state, action.payload);
        } else {
          // Solo actualiza los de esa categoría
          const existing = state.ids
            .map((id) => state.entities[id]!)
            .filter((p) => p.category !== category);
          productsAdapter.setAll(state, [...existing, ...action.payload]);
        }
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        const category = (action.meta.arg as FetchProductsArgs | undefined)?.category || 'all';
        state.loadingByCategory[category] = false;
        state.loading = false;
        state.error = action.error.message || 'Error al cargar productos';
      })
      .addCase(createProduct.pending, (state) => {
        state.creating = true;
        state.createError = null;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.creating = false;
        productsAdapter.addOne(state, action.payload);
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.creating = false;
        state.createError = (action.payload as string) || action.error.message || null;
      });
  },
});

// === ACCIONES ===
export const { clearProductsError, clearProductsCache } = productsSlice.actions;

// === SELECTORS ===
export const productsSelectors = productsAdapter.getSelectors<RootState>((s) => s.products);

export const selectAllProducts = productsSelectors.selectAll;
export const selectProductById = productsSelectors.selectById;

export const selectProductsLoading = (state: RootState) => state.products.loading;
export const selectProductsError = (state: RootState) => state.products.error;
export const selectLastFetched = (state: RootState) => state.products.lastFetched;
export const selectProductCreating = (state: RootState) => state.products.creating;
export const selectProductCreateError = (state: RootState) => state.products.createError;

export const selectProductsByCategory =
  (category: ProductCategory | 'all') =>
    (state: RootState): Product[] => {
      if (category === 'all') return selectAllProducts(state);
      return selectAllProducts(state).filter((p) => p.category === category);
    };

export const selectLoadingByCategory =
  (category: ProductCategory | 'all') =>
    (state: RootState): boolean =>
      state.products.loadingByCategory[category];

export default productsSlice.reducer;
