import { StatusCodes } from "http-status-codes";
import { CustomAPIError } from "./custom-api";

export class NotFoundError extends CustomAPIError {
  public statusCode = StatusCodes.NOT_FOUND;

  constructor(public message: any) {
    super(message);
  }
}
