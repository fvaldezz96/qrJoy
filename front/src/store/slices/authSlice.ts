import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

import api, { setAuthToken } from '../../api/client';

type Role = 'user' | 'admin';
interface AuthState {
  token: string | null;
  role: Role | null;
  loading: boolean;
  error?: string;
}
const initialState: AuthState = { token: null, role: null, loading: false };

export const loginThunk = createAsyncThunk(
  'auth/login',
  async (body: { email: string; password: string }) => {
    const { data } = await api.post('/auth/login', body);
    return data.data as { token: string; role: Role };
  },
);

const slice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.token = null;
      state.role = null;
      setAuthToken(null);
    },
  },
  extraReducers: (b) => {
    b.addCase(loginThunk.pending, (s) => {
      s.loading = true;
      s.error = undefined;
    })
      .addCase(loginThunk.fulfilled, (s, a: PayloadAction<{ token: string; role: Role }>) => {
        s.loading = false;
        s.token = a.payload.token;
        s.role = a.payload.role;
        setAuthToken(a.payload.token);
      })
      .addCase(loginThunk.rejected, (s, a) => {
        s.loading = false;
        s.error = a.error.message;
      });
  },
});

export const { logout } = slice.actions;
export default slice.reducer;
