import { Router } from 'express';

import { requireAdmin } from '../../middlewares/requireAuth';
import { adjustStock, listStock } from './stock.controller';
const r = Router();
r.get('/', requireAdmin, listStock);
r.patch('/:productId', requireAdmin, adjustStock);
export default r;
