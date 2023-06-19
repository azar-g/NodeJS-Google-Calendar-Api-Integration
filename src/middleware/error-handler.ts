import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

const errorHandlerMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log("****errorhandler****", err);
  let customError = {
    statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    message: err.message || "Something went wrong try again later",
  };

  // if (err instanceof CustomAPIError) {
  //   return res.status(err.statusCode).json({ msg: err.message })
  // }

  /*  if (err.name === "CastError") {
    customError.msg = `No item found with id : ${err.value}`;
    customError.statusCode = 404;
  } */

  return res
    .status(customError.statusCode)
    .json({ message: customError.message });
};

export default errorHandlerMiddleware;
