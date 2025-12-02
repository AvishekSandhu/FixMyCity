// backend/src/middleware/auth.middleware.js
export function requireAuth(req, res, next) {
  const { userId } = req.auth || {};
  if (!userId) {
    return res.status(401).json({ error: 'Unauthenticated' });
  }
  req.userId = userId;
  next();
}