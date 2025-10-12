import { Router } from 'express';
import { verifyQr, redeemQr } from './qr.controller';
import { requireAdmin } from '../../middlewares/requireAuth';
const r = Router();
r.post('/verify', requireAdmin, verifyQr);
r.post('/redeem', requireAdmin, redeemQr);
export default r;