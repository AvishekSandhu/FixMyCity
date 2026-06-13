// backend/src/middleware/role.middleware.js
import { getUserRole, isAdminRole, isOfficerRole } from '../role.js';

export async function requireAdmin(req, res, next) {
  try {
    const role = await getUserRole(req.userId);
    if (!isAdminRole(role)) {
      return res.status(403).json({ error: 'Forbidden: admin only' });
    }
    req.userRole = role;
    next();
  } catch (err) {
    next(err);
  }
}

export async function requireOfficerOrAdmin(req, res, next) {
  try {
    const role = await getUserRole(req.userId);
    if (!isOfficerRole(role) && !isAdminRole(role)) {
      return res
        .status(403)
        .json({ error: 'Forbidden: officers/admins only' });
    }
    req.userRole = role;
    next(); // ✅ just next(), no argument
  } catch (err) {
    next(err);
  }
}