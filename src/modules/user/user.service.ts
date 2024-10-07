import httpStatus from "http-status";
import { JwtPayload } from "jsonwebtoken";
import { USER_STATUS } from "../../constant";
import { AppError } from "../../errors";
import { IUser, TSocialLink } from "./user.interface";
import User from "./user.model";

const updateProfile = async (userData: JwtPayload, payload: IUser) => {
  const updatedUser = await User.findOneAndUpdate(
    { email: userData.email },
    payload,
    {
      new: true,
      runValidators: true,
    },
  );

  if (!updatedUser) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  return updatedUser;
};

const updateSocialLinks = async (
  userData: JwtPayload,
  payload: TSocialLink[],
) => {
  const updatedUser = await User.findOneAndUpdate(
    { email: userData.email },
    payload,
    {
      new: true,
      runValidators: true,
    },
  );

  if (!updatedUser) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  return updatedUser;
};

const blockUser = async (id: string) => {
  const user = await User.findById(id);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (user.status === USER_STATUS.BLOCKED) {
    throw new AppError(httpStatus.BAD_REQUEST, "User is already blocked");
  }

  return await User.findByIdAndUpdate(
    id,
    { status: USER_STATUS.BLOCKED },
    { new: true, runValidators: true },
  );
};

const unBlockUser = async (id: string) => {
  const user = await User.findById(id);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (user.status === USER_STATUS.ACTIVE) {
    throw new AppError(httpStatus.BAD_REQUEST, "User is already Active");
  }

  return await User.findByIdAndUpdate(
    id,
    { status: USER_STATUS.ACTIVE },
    { new: true, runValidators: true },
  );
};

export const userService = {
  updateProfile,
  updateSocialLinks,
  blockUser,
  unBlockUser,
};
