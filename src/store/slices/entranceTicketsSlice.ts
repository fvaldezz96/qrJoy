import { createAsyncThunk, createEntityAdapter, createSlice } from '@reduxjs/toolkit';

import api from '../../api/client';
import { RootState } from '../index';

// === TIPOS ===
export type TicketType = 'joypark' | 'joyweek' | 'joybox';

export interface EntranceTicket {
  id: string;
  _id: string;
  userId: string;
  type: TicketType;
  price: number;
  qrId: {
    _id: string;
    code: string;
    state: 'active' | 'used' | 'expired';
  };
  validUntil: string;
  purchaseDate?: string;
  metadata?: {
    name: string;
    durationHours: number;
  };
}

export type PurchaseResponse = {
  totalPrice: number;
  quantity: number;
  tickets: {
    ticketId: string;
    type: TicketType;
    price: number;
    qrImage: string;
    qrCode: string;
    validUntil: string;
  }[];
};

// === ADAPTER ===
const ticketsAdapter = createEntityAdapter<EntranceTicket, string>({
  selectId: (t) => t._id,
  sortComparer: (a, b) => new Date(b.validUntil).getTime() - new Date(a.validUntil).getTime(),
});

interface TicketsState {
  loading: boolean;
  error: string | null;
  lastFetched: number;
  receipts: any[];
}

const initialState = ticketsAdapter.getInitialState<TicketsState>({
  loading: false,
  error: null,
  lastFetched: 0,
  receipts: [],
});

// === THUNKS ===

/** TRAE LAS ENTRADAS DEL USUARIO */
export const fetchUserTickets = createAsyncThunk<
  EntranceTicket[],
  { userId: string; role?: string },
  { state: RootState }
>(
  'entranceTickets/fetchUserTickets',
  async ({ userId }, { getState }) => {
    const state = getState();
    const hasData = Object.keys(state.entranceTickets.entities).length > 0;
    const now = Date.now();
    const isFresh = now - state.entranceTickets.lastFetched < 30_000; // 30 seg

    if (hasData && isFresh) {
      return Object.values(state.entranceTickets.entities) as EntranceTicket[];
    }

    const { data } = await api.get(`/entrance-tickets/my-tickets`);

    return data.data.tickets as EntranceTicket[];
  },
  {
    condition: ({ userId }, { getState }) => {
      const { loading } = getState().entranceTickets;
      return !!userId && !loading;
    },
  },
);

/** COMPRA ENTRADAS */
export const purchaseTickets = createAsyncThunk<
  PurchaseResponse,
  { ticketType: TicketType; quantity: number; userId: string }
>('entranceTickets/purchase', async ({ ticketType, quantity, userId }) => {
  const { data } = await api.post(`/entrance-tickets/purchase`, {
    ticketType,
    quantity,
  });
  return data.data.purchase as PurchaseResponse;
});

/** TRAE LOS RECIBOS DE PEDIDOS DEL USUARIO */
export const fetchUserReceipts = createAsyncThunk(
  'entranceTickets/fetchReceipts',
  async () => {
    const { data } = await api.get('/tickets/me');
    // The endpoint returns { ok: true, data: Ticket[] }
    return data.data;
  }
);

// === SLICE ===
const entranceTicketsSlice = createSlice({
  name: 'entranceTickets',
  initialState,
  reducers: {
    clearTicketsError: (state) => {
      state.error = null;
    },
    clearTicketsCache: (state) => {
      ticketsAdapter.removeAll(state);
      state.lastFetched = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      // FETCH
      .addCase(fetchUserTickets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserTickets.fulfilled, (state, action) => {
        state.loading = false;
        state.lastFetched = Date.now();
        ticketsAdapter.setAll(state, action.payload);
      })
      .addCase(fetchUserTickets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Error al cargar entradas';
      })

      // PURCHASE
      .addCase(purchaseTickets.pending, (state) => {
        state.error = null;
      })
      .addCase(purchaseTickets.fulfilled, (state) => {
        // Opcional: recargar tickets después de compra
        state.lastFetched = 0;
      })
      .addCase(purchaseTickets.rejected, (state, action) => {
        state.error = action.error.message || 'Error al comprar';
      })
      .addCase(fetchUserReceipts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserReceipts.fulfilled, (state, action) => {
        state.loading = false;
        state.receipts = action.payload;
      })
      .addCase(fetchUserReceipts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Error al cargar recibos';
      });
  },
});

// === ACCIONES ===
export const { clearTicketsError, clearTicketsCache } = entranceTicketsSlice.actions;

// === SELECTORS ===
export const ticketsSelectors = ticketsAdapter.getSelectors<RootState>(
  (state) => state.entranceTickets,
);

export const selectAllTickets = ticketsSelectors.selectAll;
export const selectTicketById = ticketsSelectors.selectById;
export const selectTicketsLoading = (state: RootState) => state.entranceTickets.loading;
export const selectTicketsError = (state: RootState) => state.entranceTickets.error;

export default entranceTicketsSlice.reducer;
