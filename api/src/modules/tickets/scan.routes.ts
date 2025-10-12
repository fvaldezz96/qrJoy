import { Router } from 'express';

// import { requireAdmin } from '../../middlewares/requireAuth';
import { getQRInfo, scanEntranceQR } from './scan.controller';

const r = Router();

r.post('/scan', scanEntranceQR);
// r.post('/scan', requireAdmin, scanEntranceQR);
r.get('/info/:code', getQRInfo);
// r.get('/info/:code', requireAdmin, getQRInfo);

export default r;
