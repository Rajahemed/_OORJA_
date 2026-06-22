const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'roadwarrior-super-secret-key';

function adminAuth(roles = []) {
  return (req, res, next) => {
    let token = '';
    const authHeader = req.headers.authorization;
        
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    } else if (req.query.token) {
        token = req.query.token;
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Admin authentication required.' });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }
      req.admin = decoded;
      next();
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
  };
}

module.exports = adminAuth;
