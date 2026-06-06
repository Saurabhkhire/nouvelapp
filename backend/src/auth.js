// JWT auth helpers and middleware.
import jwt from 'jsonwebtoken';

const SECRET = () => process.env.JWT_SECRET || 'dev-insecure-secret-change-me';

export function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, SECRET(), { expiresIn: '30d' });
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Authentication required.' });
  try {
    req.user = jwt.verify(token, SECRET());
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}
