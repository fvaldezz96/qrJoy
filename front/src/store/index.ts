import { configureStore } from '@reduxjs/toolkit';

import adminReducer from './slices/adminSlice';
import authReducer from './slices/authSlice';
import cartReducer from './slices/cartSlice';
import ordersReducer from './slices/ordersSlice';
import productsReducer from './slices/productsSlice';
import ticketsReducer from './slices/ticketsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productsReducer,
    cart: cartReducer,
    orders: ordersReducer,
    admin: adminReducer,
    tickets: ticketsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
