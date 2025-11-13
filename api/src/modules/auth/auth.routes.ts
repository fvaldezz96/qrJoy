import { Router } from 'express';

import { requireAdmin, requireAuth } from '../../middlewares/requireAuth';
import { listUsers, login, me, register } from './auth.controller';

const r = Router();
r.post('/register', register);
r.post('/login', login);
r.get('/me', requireAuth, me);
r.get('/', requireAdmin, listUsers);

export default r;
