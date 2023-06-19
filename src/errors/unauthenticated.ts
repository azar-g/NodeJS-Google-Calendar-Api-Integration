import { StatusCodes } from "http-status-codes";
import { CustomAPIError } from "./custom-api";

export class UnauthenticatedError extends CustomAPIError {
  public statusCode = StatusCodes.UNAUTHORIZED;

  constructor(public message: any) {
    super(message);
  }
}
