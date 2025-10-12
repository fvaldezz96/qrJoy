import { Router } from 'express';

// import { requireAdmin, requireAuth } from '../../middlewares/requireAuth';
import { login, register } from './auth.controller';
import { listUsers, me } from './users.controller';
const r = Router();
r.post('/register', register);
r.post('/login', login);
r.get('/me', me); //requireAuth,
r.get('/all', listUsers); //requireAdmin
export default r;
