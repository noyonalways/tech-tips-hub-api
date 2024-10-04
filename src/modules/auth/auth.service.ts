import httpStatus from "http-status";
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

export const authService = {
  register,
  login,
};
