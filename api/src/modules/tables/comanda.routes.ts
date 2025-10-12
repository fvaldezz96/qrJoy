import { Router } from 'express';

import { requireAdmin } from '../../middlewares/requireAuth';
import { createComanda, listComandas, updateComanda } from './comanda.controller';
const r = Router();
r.post('/', createComanda);
// r.post('/', requireAdmin, createComanda);
r.get('/', requireAdmin, listComandas);
r.patch('/:id', requireAdmin, updateComanda);
export default r;
