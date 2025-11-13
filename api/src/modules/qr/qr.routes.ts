import { Router } from 'express';

import { requireAdmin } from '../../middlewares/requireAuth';
import { redeemQr, verifyQr } from './qr.controller';
const r = Router();
r.post('/verify', requireAdmin, verifyQr);
r.post('/redeem', requireAdmin, redeemQr);
export default r;
