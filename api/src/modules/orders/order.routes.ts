import { Router } from 'express';

import { requireAdmin, requireAuth } from '../../middlewares/requireAuth';
import { createOrder, listOrders, payMockOrder, updateOrderStatus } from './orders.controller';
const r = Router();
// r.post('/', requireAuth, createOrder);
r.post('/', createOrder);
r.get('/', requireAdmin, listOrders);
r.post('/:id/pay-mock', requireAuth, payMockOrder);
r.patch('/:id/status', requireAdmin, updateOrderStatus);
export default r;
