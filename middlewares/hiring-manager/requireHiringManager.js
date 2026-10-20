module.exports = function requireHiringManager(req, res, next) {
  const role = String(req.user?.role || '').toLowerCase().replace(/[\s_-]/g, '');
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication is required' }
    });
  }
  if (role !== 'hiringmanager' && role !== 'hm') {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Hiring Manager role required' }
    });
  }
  next();
};
