import { Router } from 'express';

import { requireAuth } from '../../middlewares/requireAuth';
import {
  closeOrderAndEmitReceipt,
  createTicket,
  myTickets,
  payMockTicket,
} from './tickets.controller';
const r = Router();
r.post('/', createTicket);
r.post('/:id/close', closeOrderAndEmitReceipt);
// r.post('/', requireAuth, createTicket);
// r.post('/:id/pay-mock', requireAuth, payMockTicket);
r.post('/:id/pay-mock', payMockTicket);
r.get('/me', requireAuth, myTickets);
export default r;
