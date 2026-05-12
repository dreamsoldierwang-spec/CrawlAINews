import { Router } from 'express';
import { favoriteService } from '../services/favorite.service';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res) => {
  try {
    const favorites = await favoriteService.getUserFavorites(req.userId!);
    res.json({ success: true, data: favorites });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch favorites' });
  }
});

router.post('/', async (req: AuthRequest, res) => {
  try {
    const { newsId } = req.body;

    if (!newsId) {
      res.status(400).json({ success: false, error: 'newsId is required' });
      return;
    }

    await favoriteService.addFavorite(req.userId!, parseInt(newsId, 10));
    res.json({ success: true, message: 'Added to favorites' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to add favorite' });
  }
});

router.delete('/:newsId', async (req: AuthRequest, res) => {
  try {
    const newsId = parseInt(req.params.newsId, 10);
    await favoriteService.removeFavorite(req.userId!, newsId);
    res.json({ success: true, message: 'Removed from favorites' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to remove favorite' });
  }
});

export default router;
