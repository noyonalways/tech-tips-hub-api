import { JwtPayload } from "jsonwebtoken";
import { Document, Model, Types } from "mongoose";

export type TUserRole = "User" | "Admin";
export type TUserStatus = "Active" | "Blocked";
export type TSocialPlatform =
  | "Facebook"
  | "Instagram"
  | "Linkedin"
  | "Twitter"
  | "Github"
  | "Youtube";

export type TSocialLink = {
  platform: TSocialPlatform;
  url: string;
};

export interface IUser extends Document {
  fullName: string;
  username: string;
  bio: string;
  designation: string;
  email: string;
  phone: string;
  password: string;
  profilePicture: string;
  role: TUserRole;
  status: TUserStatus;
  followers: Types.ObjectId[];
  following: Types.ObjectId[];
  socialLinks: TSocialLink[];
  address: string;
  dateOfBirth: string;
  isVerified: boolean;
  isPremiumUser: boolean;
  isDeleted: boolean;
}

export interface IUserModel extends Model<IUser> {
  isPasswordMatch(
    plainTextPassword: string,
    hashedPassword: string,
  ): Promise<boolean>;
  createToken(
    jwtPayload: JwtPayload,
    secret: string,
    expiresIn: string,
  ): string;
}
