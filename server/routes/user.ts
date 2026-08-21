import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.ts';
import { signUserToken, requireUserAuth, createRateLimiter, AuthRequest } from '../auth.ts';

export const userRouter = Router();

// Register new user
userRouter.post('/auth/register', createRateLimiter(10, 60000), async (req: AuthRequest, res: Response) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    res.status(400).json({ error: 'Please provide full name, valid email, and a password.' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters in length.' });
    return;
  }

  const existing = db.findUserByEmail(email);
  if (existing) {
    res.status(409).json({ error: 'An account with this email address already exists.' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = db.createUser({ email, passwordHash, name });
  const token = signUserToken(user);

  res.status(201).json({
    success: true,
    user,
    token,
  });
});

// Login user
userRouter.post('/auth/login', createRateLimiter(15, 60000), async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Please provide your email and password.' });
    return;
  }

  const userWithHash = db.findUserByEmail(email);
  if (!userWithHash) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  if (userWithHash.isSuspended) {
    res.status(403).json({
      error: 'Your account has been suspended by administration.',
      reason: userWithHash.suspensionReason,
    });
    return;
  }

  const isMatch = await bcrypt.compare(password, userWithHash.passwordHash);
  if (!isMatch) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  const { passwordHash: _, ...safeUser } = userWithHash;
  const token = signUserToken(safeUser);

  res.json({
    success: true,
    user: safeUser,
    token,
  });
});

// Logout
userRouter.post('/auth/logout', (_req: AuthRequest, res: Response) => {
  res.json({ success: true, message: 'Signed out successfully.' });
});

// User Profile
userRouter.get('/user/profile', requireUserAuth, (req: AuthRequest, res: Response) => {
  res.json({ user: req.user });
});

// Update Profile
userRouter.put('/user/profile', requireUserAuth, (req: AuthRequest, res: Response) => {
  const { name, bio, avatarUrl } = req.body;
  if (!req.user) return;

  const updated = db.updateUserProfile(req.user.id, { name, bio, avatarUrl });
  if (!updated) {
    res.status(400).json({ error: 'Unable to update profile.' });
    return;
  }

  res.json({ success: true, user: updated });
});

// Get User Favorites
userRouter.get('/user/favorites', requireUserAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  const favorites = db.getFavoritesByUser(req.user.id);
  res.json(favorites);
});

// Toggle / Add Favorite
userRouter.post('/user/favorites/:videoId', requireUserAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  const { videoId } = req.params;
  const video = db.getVideoById(videoId);
  if (!video) {
    res.status(404).json({ error: 'Video not found.' });
    return;
  }

  const result = db.toggleFavorite(req.user.id, videoId);
  res.json({ success: true, isFavorite: result.isFavorite });
});

// Remove Favorite
userRouter.delete('/user/favorites/:videoId', requireUserAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  const { videoId } = req.params;
  const removed = db.removeFavorite(req.user.id, videoId);
  res.json({ success: true, removed });
});

// Get Watch History
userRouter.get('/user/history', requireUserAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  const history = db.getWatchHistoryByUser(req.user.id);
  res.json(history);
});

// Record / Update Watch Progress
userRouter.post('/user/history', requireUserAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  const { videoId, progressSeconds, durationSeconds } = req.body;

  if (!videoId || progressSeconds === undefined || !durationSeconds) {
    res.status(400).json({ error: 'Invalid watch history payload.' });
    return;
  }

  const item = db.updateWatchHistory({
    userId: req.user.id,
    videoId,
    progressSeconds: Math.floor(progressSeconds),
    durationSeconds: Math.floor(durationSeconds),
  });

  res.json({ success: true, item });
});

// Clear single history item
userRouter.delete('/user/history/:videoId', requireUserAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  const { videoId } = req.params;
  db.clearWatchHistory(req.user.id, videoId);
  res.json({ success: true });
});

// Clear all watch history
userRouter.delete('/user/history', requireUserAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  db.clearWatchHistory(req.user.id);
  res.json({ success: true, message: 'Watch history cleared successfully.' });
});

// Add comment to video (requires auth)
userRouter.post('/videos/:id/comments', requireUserAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  const { id } = req.params;
  const { content } = req.body;

  if (!content || !content.trim()) {
    res.status(400).json({ error: 'Comment content cannot be empty.' });
    return;
  }

  const video = db.getVideoById(id);
  if (!video) {
    res.status(404).json({ error: 'Video not found.' });
    return;
  }

  const comment = db.addComment({
    videoId: id,
    userId: req.user.id,
    userName: req.user.name,
    userAvatar: req.user.avatarUrl,
    content: content.trim(),
  });

  res.status(201).json(comment);
});
