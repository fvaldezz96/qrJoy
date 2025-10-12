import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import api from '../../api/client';

export interface Ticket {
  _id: string;
  eventDate: string;
  price: number;
  status: 'issued' | 'paid' | 'redeemed' | 'cancelled';
  qrId?: string;
}
export interface TicketPayResponse {
  ticketId: string;
  pngDataUrl: string;
  code: string;
  signature: string;
}

export const createTicket = createAsyncThunk(
  'tickets/create',
  async (body: { eventDate: string; price: number }) => {
    const { data } = await api.post('/tickets', body);
    return data.data as Ticket;
  },
);

export const payMockTicket = createAsyncThunk('tickets/payMock', async (ticketId: string) => {
  const { data } = await api.post(`/tickets/${ticketId}/pay-mock`);
  return data.data as TicketPayResponse;
});

export const fetchMyTickets = createAsyncThunk('tickets/fetchMine', async () => {
  const { data } = await api.get('/tickets/me');
  return data.data as Ticket[];
});

const slice = createSlice({
  name: 'tickets',
  initialState: {
    list: [] as Ticket[],
    current: null as Ticket | null,
    payQR: null as TicketPayResponse | null,
    loading: false,
    error: undefined as string | undefined,
  },
  reducers: {
    resetTicket(state) {
      state.current = null;
      state.payQR = null;
    },
  },
  extraReducers: (b) => {
    b.addCase(createTicket.pending, (s) => {
      s.loading = true;
    })
      .addCase(createTicket.fulfilled, (s, a) => {
        s.loading = false;
        s.current = a.payload;
      })
      .addCase(createTicket.rejected, (s, a) => {
        s.loading = false;
        s.error = a.error.message;
      })
      .addCase(payMockTicket.pending, (s) => {
        s.loading = true;
      })
      .addCase(payMockTicket.fulfilled, (s, a) => {
        s.loading = false;
        s.payQR = a.payload;
      })
      .addCase(payMockTicket.rejected, (s, a) => {
        s.loading = false;
        s.error = a.error.message;
      })
      .addCase(fetchMyTickets.fulfilled, (s, a) => {
        s.list = a.payload;
      });
  },
});

export const { resetTicket } = slice.actions;
export default slice.reducer;
