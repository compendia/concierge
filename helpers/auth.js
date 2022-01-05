require('dotenv').config()

module.exports = (req, res, next) => {
  try {
    if (!req.query.secret || req.query.secret !== process.env.SECRET) {
      res.status(401).json({
        error: 'Invalid API secret.'
      });
    } else {
      next();
    }
  } catch {
    res.status(401).json({
      error: 'Invalid request.'
    });
  }
};