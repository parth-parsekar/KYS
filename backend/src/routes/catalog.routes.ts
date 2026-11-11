import { Router, Request, Response } from 'express';
import { ServiceCatalog } from '../models/ServiceCatalog.js';

const router = Router();

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// GET /api/catalog
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, search } = req.query;
    const filter: any = { isActive: true };

    if (category && category !== 'All' && category !== 'All categories') {
      filter.category = category;
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      filter.name = { $regex: escapeRegex(search.trim()), $options: 'i' };
    }

    const services = await ServiceCatalog.find(filter).sort({ name: 1 });
    res.json({
      success: true,
      count: services.length,
      disclaimer: 'Catalog defaults are suggestions. KYS does not charge, verify payments or cancel third-party services.',
      services,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Error fetching catalog' });
  }
});

export default router;

