import { StatusCodes } from "http-status-codes";
import { CustomAPIError } from "./custom-api";

export class BadRequestError extends CustomAPIError {
  public statusCode = StatusCodes.BAD_REQUEST;

  constructor(public message: any) {
    super(message);
  }
}
