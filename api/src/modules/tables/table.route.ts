import { Router } from 'express';

import { requireAdmin } from '../../middlewares/requireAuth';
import { createTable, deleteTable, listTables, updateTable } from './tables.controller';

const r = Router();

r.get('/', requireAdmin, listTables);
r.post('/create', createTable);
// r.post('/create', requireAdmin, createTable);
r.put('/:id', requireAdmin, updateTable);
r.delete('/:id', requireAdmin, deleteTable);

export default r;
