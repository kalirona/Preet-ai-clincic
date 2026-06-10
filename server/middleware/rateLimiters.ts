import rateLimit from "express-rate-limit";

// Higher protection for AI endpoints
export const aiRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res, next) => {
    res.status(429).json({
      error: "Too Many Requests",
      message: "Rate limit exceeded. Please try again after 10 minutes."
    });
  }
});

// Moderate protection for SEO scanning
export const seoRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    res.status(429).json({
      error: "Too Many Requests",
      message: "Rate limit exceeded. Please try again after 15 minutes."
    });
  }
});

// Moderate protection for Wordpress endpoints
export const wordpressRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    res.status(429).json({
      error: "Too Many Requests",
      message: "Rate limit exceeded. Please try again after 15 minutes."
    });
  }
});

// Moderate protection for Client CRM endpoints
export const clientRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    res.status(429).json({
      error: "Too Many Requests",
      message: "Rate limit exceeded. Please try again after 15 minutes."
    });
  }
});

// Protection for Dashboard endpoints
export const dashboardRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    res.status(429).json({
      error: "Too Many Requests",
      message: "Rate limit exceeded. Please try again after 5 minutes."
    });
  }
});

// Protection for Team management endpoints
export const teamRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    res.status(429).json({
      error: "Too Many Requests",
      message: "Rate limit exceeded. Please try again after 5 minutes."
    });
  }
});

// Protection for Notification Foundation endpoints
export const notificationRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    res.status(429).json({
      error: "Too Many Requests",
      message: "Rate limit exceeded. Please try again after 5 minutes."
    });
  }
});

