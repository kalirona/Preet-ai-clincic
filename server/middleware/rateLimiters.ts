import rateLimit from "express-rate-limit";
import { AuthenticatedRequest } from "../types/auth";

function getUserOrIpKey(req: any): string {
  const user = (req as AuthenticatedRequest).user;
  if (user?.id) return `user:${user.id}`;
  return req.ip || req.socket.remoteAddress || "unknown";
}

// Higher protection for AI endpoints
export const aiRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getUserOrIpKey(req),
  handler: (req, res) => {
    res.status(429).json({
      error: "Too Many Requests",
      message: "Rate limit exceeded. Please try again after 10 minutes."
    });
  }
});

// Moderate protection for Client CRM endpoints
export const clientRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getUserOrIpKey(req),
  handler: (req, res) => {
    res.status(429).json({
      error: "Too Many Requests",
      message: "Rate limit exceeded. Please try again after 15 minutes."
    });
  }
});

// Protection for Dashboard endpoints
export const dashboardRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getUserOrIpKey(req),
  handler: (req, res) => {
    res.status(429).json({
      error: "Too Many Requests",
      message: "Rate limit exceeded. Please try again after 5 minutes."
    });
  }
});

// Protection for Team management endpoints
export const teamRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getUserOrIpKey(req),
  handler: (req, res) => {
    res.status(429).json({
      error: "Too Many Requests",
      message: "Rate limit exceeded. Please try again after 5 minutes."
    });
  }
});

// Protection for Notification Foundation endpoints
export const notificationRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getUserOrIpKey(req),
  handler: (req, res) => {
    res.status(429).json({
      error: "Too Many Requests",
      message: "Rate limit exceeded. Please try again after 5 minutes."
    });
  }
});

// Strict protection for public unauthenticated endpoints
export const publicRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getUserOrIpKey(req),
  handler: (req, res) => {
    res.status(429).json({
      error: "Too Many Requests",
      message: "Rate limit exceeded. Please try again later."
    });
  }
});
