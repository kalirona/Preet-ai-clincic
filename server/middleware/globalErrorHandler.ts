import { Request, Response, NextFunction } from "express";
import { ApiError } from "../types/errors";

export const globalErrorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error("[Error Handler Logs]:", error);

  const isProduction = process.env.NODE_ENV === "production";
  
  let statusCode = 500;
  let message = "Internal Server Error";
  let details: any = undefined;

  if (error instanceof ApiError) {
    statusCode = error.statusCode;
    message = error.message;
  } else if (error.statusCode) {
    statusCode = error.statusCode;
    message = error.message;
  } else if (error.status) {
    statusCode = error.status;
    message = error.message;
  }

  // Handle specific status codes naming consistency if requested
  if (statusCode === 400 && message === "Internal Server Error") {
    message = "Validation Error";
  } else if (statusCode === 401 && message === "Internal Server Error") {
    message = "Unauthorized";
  } else if (statusCode === 450) {
    // Just mapping
    statusCode = 400;
  }

  const responseBody: any = {
    error: message,
  };

  if (!isProduction) {
    responseBody.stack = error.stack;
    responseBody.details = error.details || error.message;
  }

  res.status(statusCode).json(responseBody);
};
