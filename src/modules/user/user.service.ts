import httpStatus from "http-status";
import { JwtPayload } from "jsonwebtoken";
import { AppError } from "../../errors";
import { IUser } from "./user.interface";
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

export const userService = {
  updateProfile,
};
