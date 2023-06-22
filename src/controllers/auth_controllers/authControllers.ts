import { attachCookiesToResponse } from "./../../utils/jwt";
import { NextFunction, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { comparePassword, hashPassword } from "../../utils/bcrypt";
import CustomError from "../../errors";
import { StatusCodes } from "http-status-codes";
import axios from "axios";

const prisma = new PrismaClient();

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      userName,
      role,
      address,
      phoneNumber,
    } = req.body;
    console.log("userName---->", userName);

    if (!userName || !password || !email) {
      if (!userName)
        throw new CustomError.BadRequestError("Please provide userName");
      if (!password)
        throw new CustomError.BadRequestError("Please provide password");
      if (!email) throw new CustomError.BadRequestError("Please provide email");
    }

    let countryCode: number | null = null;

    if (phoneNumber) {
      const checkedPhoneNumber = parsePhoneNumberFromString(phoneNumber);
      console.log("checkedPhoneNumber--->", checkedPhoneNumber);
      if (!checkedPhoneNumber || !checkedPhoneNumber.isValid())
        throw new CustomError.BadRequestError("Phone number is not valid");

      countryCode = Number(checkedPhoneNumber?.countryCallingCode);
    }

    const userExist = await prisma.profiles.findUnique({
      where: {
        email,
      },
    });
    if (userExist?.userId) {
      throw new CustomError.BadRequestError("this consultant already exists");
    }

    const hashedPassword = await hashPassword(password);

    const userData = {
      data: {
        userName,
        password: hashedPassword,
        createdAt: new Date(),
        role,
      },
    };

    const profileData = {
      firstName,
      lastName,
      email,
      address,
      phoneNumber,
      countryCode,
    };

    const newUser = await prisma.users.create(userData);

    const profile = await prisma.profiles.create({
      data: {
        ...profileData,
        userId: newUser.id,
      },
    });

    // userDetails is user information to be extracted from token
    const userDetails = {
      id: newUser.id,
      role: newUser.role,
      email: profile.email,
    };

    attachCookiesToResponse({ res, userDetails });

    axios.post("http://localhost:8080/api/v1/createCalendar", userDetails);

    res.status(StatusCodes.CREATED).send("User resgistration is succesfull");
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userName, password } = req.body;

    if (!userName || !password) {
      throw new CustomError.BadRequestError(
        "Please provide username and password"
      );
    }
    const user = await prisma.users.findUnique({
      where: { userName },
      select: {
        id: true,
        password: true,
        role: true,
        profile: true,
      },
    });
    if (!user) {
      throw new CustomError.UnauthenticatedError("Invalid Credentials");
    }

    if (!user.profile?.email)
      throw new CustomError.BadRequestError("user profile couldn't be found");

    const isPasswordCorrect = await comparePassword(password, user.password);

    if (!isPasswordCorrect) {
      throw new CustomError.UnauthenticatedError("Invalid Credentials");
    }

    // userDetails is user details to be extracted from token
    const userDetails = {
      id: user.id,
      role: user.role,
      email: user.profile.email,
    };
    const token = attachCookiesToResponse({ res, userDetails });

    res.status(StatusCodes.OK).json({ token });
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    res.cookie("token", "logout", {
      httpOnly: true,
      expires: new Date(Date.now() + 1000),
    });
    res.status(StatusCodes.OK).json({ msg: "User successfully signed out" });
  } catch (error) {
    next(error);
  }
};
