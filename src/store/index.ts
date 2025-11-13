import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';

import adminReducer from './slices/adminSlice';
import authReducer from './slices/authSlice';
import cartReducer from './slices/cartSlice';
import entranceTicketsReducer from './slices/entranceTicketsSlice';
import ordersReducer from './slices/ordersSlice';
import productsReducer from './slices/productsSlice';
import ticketsReducer from './slices/ticketsSlice';
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth'],
};

const rootReducer = combineReducers({
  auth: authReducer,
  products: productsReducer,
  cart: cartReducer,
  orders: ordersReducer,
  entranceTickets: entranceTicketsReducer,
  admin: adminReducer,
  tickets: ticketsReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({ serializableCheck: false }),
});

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
