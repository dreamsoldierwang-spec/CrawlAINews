import { Router } from 'express';
import axios from 'axios';
import { userService } from '../services/user.service';
import { config } from '../config';
import { logger } from '../utils/logger';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const { code, nickname, avatarUrl } = req.body;

    if (!code) {
      res.status(400).json({ success: false, error: 'Code is required' });
      return;
    }

    const wxResponse = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
      params: {
        appid: config.wechat.appId,
        secret: config.wechat.secret,
        js_code: code,
        grant_type: 'authorization_code',
      },
      timeout: 10000,
    });

    if (wxResponse.data.errcode) {
      logger.error('WeChat login failed', wxResponse.data);
      res.status(400).json({ success: false, error: 'WeChat login failed' });
      return;
    }

    const openid = wxResponse.data.openid;
    const user = await userService.findOrCreateByOpenid(openid, nickname, avatarUrl);

    res.json({
      success: true,
      data: {
        token: user.id.toString(),
        user: {
          id: user.id,
          nickname: user.nickname,
          avatarUrl: user.avatar_url,
        },
      },
    });
  } catch (err) {
    logger.error('Login error', err);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

router.get('/user', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const token = authHeader.substring(7);
    const user = await userService.getById(parseInt(token, 10));

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        nickname: user.nickname,
        avatarUrl: user.avatar_url,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to get user' });
  }
});

export default router;
