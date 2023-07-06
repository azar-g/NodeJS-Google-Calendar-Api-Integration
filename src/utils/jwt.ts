import jwt from "jsonwebtoken";
import * as dotenv from "dotenv";
dotenv.config();

export type TokenUser = {
  id: number;
  email: string;
  role: string;
};
const secretKey = process.env.JWT_SECRET as string;

export const isTokenValid = ({ token }: { token: string }) =>
  jwt.verify(token, secretKey);
