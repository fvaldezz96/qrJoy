import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';
import SecurePersistStorage from './secureStorage';

import adminReducer from './slices/adminSlice';
import authReducer from './slices/authSlice';
import cartReducer from './slices/cartSlice';
import comandasReducer from './slices/comandasSlice';
import entranceTicketsReducer from './slices/entranceTicketsSlice';
import ordersReducer from './slices/ordersSlice';
import productsReducer from './slices/productsSlice';
import stockReducer from './slices/stockSlice';
import suppliersReducer from './slices/suppliersSlice';
import qrsReducer from './slices/qrsSlice';
import tablesReducer from './slices/tablesSlice';
import ticketsReducer from './slices/ticketsSlice';
import complaintsReducer from './slices/complaintsSlice';
const persistConfig = {
  key: 'root',
  storage: SecurePersistStorage,
  whitelist: ['auth'],
};

const rootReducer = combineReducers({
  auth: authReducer,
  products: productsReducer,
  cart: cartReducer,
  orders: ordersReducer,
  comandas: comandasReducer,
  entranceTickets: entranceTicketsReducer,
  admin: adminReducer,
  tables: tablesReducer,
  tickets: ticketsReducer,
  qrs: qrsReducer,
  stock: stockReducer,
  suppliers: suppliersReducer,
  complaints: complaintsReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({ serializableCheck: false }),
});

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
