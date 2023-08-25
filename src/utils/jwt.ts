import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";

export type TokenUser = {
  id: number;
  email: string;
  role: string;
};

export const isTokenValid = ({ token }: { token: string }) =>
  jwt.verify(token, JWT_SECRET);
