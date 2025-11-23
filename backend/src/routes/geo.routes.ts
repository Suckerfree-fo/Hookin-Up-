import { Router } from 'express';
import { listCities, resolveCity } from '../controllers/geo.controller.js';

const router = Router();
router.get('/cities', listCities);
router.get('/resolve', resolveCity);

export default router;
