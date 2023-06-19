import jwt from "jsonwebtoken";
import { Response } from "express";
import * as dotenv from "dotenv";
dotenv.config();

export type TokenUser = {
  id: number;
  email: string;
};
const secretKey = process.env.JWT_SECRET as string;

export const isTokenValid = ({ token }: { token: string }) =>
  jwt.verify(token, secretKey);

export const attachCookiesToResponse = ({
  res,
  userDetails,
}: {
  res: Response;
  userDetails: TokenUser;
}) => {
  const token = jwt.sign(userDetails, secretKey, {
    expiresIn: process.env.JWT_LIFETIME,
  });

  const oneDay = 1000 * 60 * 60 * 24;

  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 7 * oneDay),
    secure: process.env.NODE_ENV === "production",
    signed: true,
  });
};
