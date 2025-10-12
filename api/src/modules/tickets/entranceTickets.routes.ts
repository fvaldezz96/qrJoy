import { Router } from 'express';

// import { requireAuth } from '../../middlewares/requireAuth';
import { getTicketDetails, getUserTickets, purchaseTicket } from './entranceTickets.controller';

const r = Router();

r.post('/purchase/:id', purchaseTicket);
// r.post('/purchase', requireAuth, purchaseTicket);
r.get('/my-tickets', getUserTickets);
// r.get('/my-tickets', requireAuth, getUserTickets);
r.get('/:ticketId', getTicketDetails);
// r.get('/:ticketId', requireAuth, getTicketDetails);

export default r;
