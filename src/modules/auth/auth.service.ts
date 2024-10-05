import httpStatus from "http-status";
import { JwtPayload } from "jsonwebtoken";
import config from "../../config";
import { AppError } from "../../errors";
import { IUser } from "../user/user.interface";
import User from "../user/user.model";

const register = async (payload: IUser) => {
  const existedEmail = await User.findOne({ email: payload.email });
  if (existedEmail) {
    throw new AppError(409, "User already registered");
  }

  const existedUsername = await User.findOne({ username: payload.username });
  if (existedUsername) {
    throw new AppError(409, "Username already exists");
  }

  return User.create(payload);
};

const login = async (payload: IUser) => {
  const user = await User.findOne({ email: payload.email }).select("+password");

  if (!user) {
    throw new AppError(404, "User not found");
  }

  if (!(await User.isPasswordMatch(payload.password, user.password))) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Incorrect credentials");
  }

  if (user.status === "Blocked") {
    throw new AppError(httpStatus.FORBIDDEN, "User is blocked");
  }

  if (user.isDeleted) {
    throw new AppError(httpStatus.FORBIDDEN, "User is deleted");
  }

  const jwtPayload = {
    email: user.email,
    role: user.role,
  };

  const accessToken = User.createToken(
    jwtPayload,
    config.jwt_access_token_secret as string,
    config.jwt_access_token_expires_in as string,
  );

  const refreshToken = User.createToken(
    jwtPayload,
    config.jwt_refresh_token_secret as string,
    config.jwt_refresh_token_expires_in as string,
  );

  return { accessToken, refreshToken };
};

// get me (current logged in user)
const getMe = async (payload: JwtPayload) => {
  const user = await User.findOne({ email: payload.email });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }
  return user;
};

// change-password
const changePassword = async (
  userData: JwtPayload,
  payload: { oldPassword: string; newPassword: string },
) => {
  const user = await User.findOne({ email: userData.email }).select(
    "+password",
  );

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  // check the user is already deleted
  if (user.isDeleted) {
    throw new AppError(httpStatus.FORBIDDEN, "User is already deleted");
  }

  // check the is user status
  if (user.status === "Blocked") {
    throw new AppError(httpStatus.FORBIDDEN, "User is blocked");
  }

  // check the password is correct
  const isPasswordMatch = await User.isPasswordMatch(
    payload.oldPassword,
    user?.password,
  );
  if (!isPasswordMatch) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Password did not match");
  }

  // hash new password
  const newHashedPassword = await User.generateHashPassword(
    payload.newPassword,
  );

  return await User.findOneAndUpdate(
    {
      email: userData.email,
      role: userData.role,
    },
    {
      password: newHashedPassword,
      passwordChangeAt: new Date(),
    },
    { new: true, runValidators: true },
  );
};

export const authService = {
  register,
  login,
  getMe,
  changePassword,
};
