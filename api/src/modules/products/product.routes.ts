import { Router } from 'express';

import { requireAdmin } from '../../middlewares/requireAuth';
import {
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  patchProduct,
  restoreProduct,
  softDeleteProduct,
  updateProduct,
} from './products.controller';

const r = Router();

r.get('/', listProducts);
r.get('/:id', getProduct);

// r.post('/create', requireAdmin, createProduct);
r.post('/create', createProduct);
r.put('/:id', requireAdmin, updateProduct);
r.patch('/:id', requireAdmin, patchProduct);

r.delete('/:id', requireAdmin, softDeleteProduct);
r.post('/:id/restore', requireAdmin, restoreProduct);
r.delete('/:id', requireAdmin, deleteProduct);

export default r;
