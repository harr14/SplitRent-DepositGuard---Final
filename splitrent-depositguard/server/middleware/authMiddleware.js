const { adminAuth, db } = require('../config/firebaseAdmin');

// Verify Firebase ID Token from Authorization header
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token format' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    req.user = decodedToken;

    // Fetch user's role from Firestore
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    req.user.role = userDoc.exists ? userDoc.data().role : 'TENANT';

    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(403).json({ error: 'Forbidden: Invalid or expired token' });
  }
};

// Role-Based Guard (e.g., requireRole('TENANT') or requireRole('LANDLORD'))
const requireRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== requiredRole) {
      return res.status(403).json({
        error: `Access denied. Only users with role [${requiredRole}] can perform this action.`
      });
    }
    next();
  };
};

module.exports = { verifyToken, requireRole };