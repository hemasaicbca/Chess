import { Request, Response, Router } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { User } from '@repo/db';
import { COOKIE_MAX_AGE } from '../consts';
const router = Router();

const CLIENT_URL =
  process.env.AUTH_REDIRECT_URL ?? 'http://localhost:5173/game/random';
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

interface userJwtClaims {
  userId: string;
  name: string;
  isGuest?: boolean;
}

interface UserDetails {
  id: string;
  token?: string;
  name: string;
  isGuest?: boolean;
}

router.post('/guest', async (req: Request, res: Response) => {
  const bodyData = req.body;
  const guestUUID = 'guest-' + randomUUID();

  const user = await User.create({
    username: guestUUID,
    email: guestUUID + '@chess100x.com',
    name: bodyData.name || guestUUID,
    provider: 'GUEST',
    rating: 1200,
  });

  const token = jwt.sign(
    { userId: user.id, name: user.name, isGuest: true },
    JWT_SECRET,
  );
  const userDetails: UserDetails = {
    id: user.id,
    name: user.name!,
    token: token,
    isGuest: true,
  };
  res.cookie('guest', token, { maxAge: COOKIE_MAX_AGE });
  res.json(userDetails);
});

router.get('/refresh', async (req: Request, res: Response) => {
  if (req.user) {
    const user = req.user as UserDetails;
    const userDb = (await User.findById(user.id).lean()) as
      | { name?: string | null }
      | null;

    const token = jwt.sign({ userId: user.id, name: userDb?.name }, JWT_SECRET);
    res.json({
      token,
      id: user.id,
      name: userDb?.name,
    });
  } else if (req.cookies && req.cookies.guest) {
    const decoded = jwt.verify(req.cookies.guest, JWT_SECRET) as userJwtClaims;
    const token = jwt.sign(
      { userId: decoded.userId, name: decoded.name, isGuest: true },
      JWT_SECRET,
    );
    const userDetails: UserDetails = {
      id: decoded.userId,
      name: decoded.name,
      token: token,
      isGuest: true,
    };
    res.cookie('guest', token, { maxAge: COOKIE_MAX_AGE });
    res.json(userDetails);
  } else {
    res.status(401).json({ success: false, message: 'Unauthorized' });
  }
});

router.get('/login/failed', (req: Request, res: Response) => {
  res.status(401).json({ success: false, message: 'failure' });
});

router.get('/logout', (req: Request, res: Response) => {
  res.clearCookie('guest');
  req.logout((err) => {
    if (err) {
      console.error('Error logging out:', err);
      res.status(500).json({ error: 'Failed to log out' });
    } else {
      res.clearCookie('jwt');
      res.redirect('http://localhost:5173/');
    }
  });
});

router.get('/google', (req: Request, res: Response, next) => {
  if (!(passport as any)._strategy('google')) {
    return res.status(503).json({
      success: false,
      message: 'Google authentication is not configured',
    });
  }

  return passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

router.get(
  '/google/callback',
  passport.authenticate('google', {
    successRedirect: CLIENT_URL,
    failureRedirect: '/login/failed',
  }),
);

router.get('/github', (req: Request, res: Response, next) => {
  if (!(passport as any)._strategy('github')) {
    return res.status(503).json({
      success: false,
      message: 'GitHub authentication is not configured',
    });
  }

  return passport.authenticate('github', { scope: ['read:user', 'user:email'] })(req, res, next);
});

router.get(
  '/github/callback',
  passport.authenticate('github', {
    successRedirect: CLIENT_URL,
    failureRedirect: '/login/failed',
  }),
);

export default router;
