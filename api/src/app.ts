import cors from 'cors';
import express from 'express';
import morgan from 'morgan';

import authRoutes from './modules/auth/auth.routes';
import stockRoutes from './modules/inventory/stock.routes';
import orderRoutes from './modules/orders/order.routes';
import productRoutes from './modules/products/product.routes';
import qrRoutes from './modules/qr/qr.routes';
import comandaRoutes from './modules/tables/comanda.routes';
import tableRoutes from './modules/tables/table.route';
import entraceTickets from './modules/tickets/entranceTickets.routes';
import scannQr from './modules/tickets/scan.routes';
import ticketRoutes from './modules/tickets/ticket.routes';
import usersRoutes from './modules/users/user.routes';
// import userAuthRoutes from './modules/users/user.routes';

export const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// app.use('/auth', userAuthRoutes);
app.use('/users', usersRoutes);
app.use('/products', productRoutes);
app.use('/stock', stockRoutes);
app.use('/orders', orderRoutes);
app.use('/tickets', ticketRoutes);
app.use('/qr', qrRoutes);
app.use('/tables', tableRoutes);
app.use('/comandas', comandaRoutes);
app.use('/auth', authRoutes);
app.use('/entrance-tickets', entraceTickets);
app.use('/scan', scannQr);

app.use((err: any, _req: any, res: any, _next: any) => {
  console.error(err);
  res.status(err.status || 500).json({
    ok: false,
    error: { code: err.code || 'INTERNAL', message: err.message || 'Internal Error' },
  });
});
