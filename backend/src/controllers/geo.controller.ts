// src/controllers/geo.controller.ts
import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

export async function listCities(req: Request, res: Response) {
  try {
    const { state, metro } = req.query as { state?: string; metro?: string };

    // Simple metro flag; later you can persist this in DB if you want.
    const isKCMetro = metro?.toLowerCase() === 'kc';

    const where =
      isKCMetro
        ? '' // KC metro == all current rows (MO + KS) for now
        : state?.toUpperCase() === 'MO'
          ? `WHERE state = 'MO'`
          : state?.toUpperCase() === 'KS'
            ? `WHERE state = 'KS'`
            : '';

    const rows = await prisma.$queryRawUnsafe<any[]>(`
      SELECT slug, name, state, timezone, longitude AS lng, latitude AS lat
      FROM cities
      ${where}
      ORDER BY name
    `);

    res.json({ success: true, data: { cities: rows } });
  } catch (e: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: e.message } });
  }
}

export async function resolveCity(req: Request, res: Response) {
  const { lat, lng } = req.query;
  const latitude = parseFloat(String(lat));
  const longitude = parseFloat(String(lng));
  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return res.status(400).json({ success:false, error:{ code:'VALIDATION_ERROR', message:'lat and lng required' }});
  }
  try {
    const [nearest] = await prisma.$queryRawUnsafe<any[]>(
      `SELECT slug, name, state, timezone,
              ST_Distance(location, ST_SetSRID(ST_MakePoint($1,$2),4326)::geography) AS distance_meters
       FROM cities
       WHERE ST_DWithin(location, ST_SetSRID(ST_MakePoint($1,$2),4326)::geography, 50000)
       ORDER BY distance_meters
       LIMIT 1`,
      longitude, latitude
    );
    if (nearest) return res.json({ success:true, data:{ city: nearest }});
    const [kc] = await prisma.$queryRawUnsafe<any[]>(
      `SELECT slug, name, state, timezone FROM cities WHERE slug='kansas-city-mo' LIMIT 1`
    );
    res.json({ success:true, data:{ city: kc }, message:'No nearby city found, using default' });
  } catch (e:any) {
    res.status(500).json({ success:false, error:{ code:'SERVER_ERROR', message:e.message }});
  }
}
