import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

export async function getProfile(req: Request, res: Response) {
  try {
    const userId = (req as any).user!.id;
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { profile: true } });
    if (!user) return res.status(404).json({ success:false, error:{ code:'NOT_FOUND', message:'User not found' }});
    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        status: user.status,
        preferredCitySlug: user.preferredCitySlug,
        searchRadiusKm: user.searchRadiusKm,
        profile: user.profile,
        createdAt: user.createdAt,
        lastActive: user.lastActive
      }
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ success:false, error:{ code:'INTERNAL_ERROR', message:'Failed to get profile' } });
  }
}

export async function updateProfile(req: Request, res: Response) {
  try {
    const userId = (req as any).user!.id;
    const { firstName, bio, occupation, education, heightCm, age, gender } = req.body;
    if (bio && bio.length > 500) return res.status(400).json({ success:false, error:{ code:'VALIDATION_ERROR', message:'Bio max 500 characters' } });
    if (age && (age < 18 || age > 120)) return res.status(400).json({ success:false, error:{ code:'VALIDATION_ERROR', message:'Age must be 18-120' } });

    const profile = await prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        firstName: firstName || 'Anonymous',
        age: age || 18,
        gender: gender ?? null,
        bio: bio ?? null,
        occupation: occupation ?? null,
        education: education ?? null,
        heightCm: heightCm ?? null
      },
      update: {
        ...(firstName !== undefined && { firstName }),
        ...(age !== undefined && { age }),
        ...(gender !== undefined && { gender }),
        ...(bio !== undefined && { bio }),
        ...(occupation !== undefined && { occupation }),
        ...(education !== undefined && { education }),
        ...(heightCm !== undefined && { heightCm })
      }
    });

    res.json({ success: true, data: { profile } });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ success:false, error:{ code:'INTERNAL_ERROR', message:'Failed to update profile' } });
  }
}

export async function updateLocation(req: Request, res: Response) {
  try {
    const userId = (req as any).user!.id;
    const { citySlug, radiusKm } = req.body;
    if (radiusKm !== undefined && (radiusKm < 5 || radiusKm > 100)) {
      return res.status(400).json({ success:false, error:{ code:'VALIDATION_ERROR', message:'Radius must be 5-100 km' } });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(citySlug !== undefined && { preferredCitySlug: citySlug }),
        ...(radiusKm !== undefined && { searchRadiusKm: radiusKm })
      }
    });

    res.json({ success: true, data: { preferredCitySlug: updated.preferredCitySlug, searchRadiusKm: updated.searchRadiusKm } });
  } catch (err) {
    console.error('Update location error:', err);
    res.status(500).json({ success:false, error:{ code:'INTERNAL_ERROR', message:'Failed to update location' } });
  }
}
