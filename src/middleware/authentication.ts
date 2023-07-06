import { NextFunction, Request, Response } from "express";
import CustomError from "../errors";
import { isTokenValid } from "../utils/jwt";
import { TokenUser } from "../utils/jwt";

export interface AuthenticatedRequest extends Request {
  user?: TokenUser;
}

export const authenticatedUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.signedCookies.token;

    if (!token) {
      throw new CustomError.UnauthenticatedError("Authentication Invalid");
    }

    const { id, email, role } = isTokenValid({ token }) as TokenUser;
    req.user = { id, email, role };

    next();
  } catch (error) {
    next(error);
  }
};
