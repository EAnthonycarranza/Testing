// utils/auth.js
const withAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    next();
  };
  
  const isAdmin = (req, res, next) => {
    if (!req.session.userId || !req.session.isAdmin) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
  
  module.exports = { withAuth, isAdmin };
  