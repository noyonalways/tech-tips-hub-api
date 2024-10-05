import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { model, Schema } from "mongoose";
import config from "../../config";
import {
  SocialPlatform,
  UserGender,
  UserRoles,
  UserStatus,
} from "./user.constant";
import { IUser, IUserModel, TSocialLink } from "./user.interface";

const socialLinksSchema = new Schema<TSocialLink>(
  {
    platform: {
      type: String,
      enum: {
        values: SocialPlatform,
        message: "{VALUE} is not a valid social platform",
      },
    },
    url: {
      type: String,
      required: [true, "Url is required"],
    },
  },
  { _id: false },
);

const userSchema = new Schema<IUser>(
  {
    fullName: {
      type: String,
      required: [true, "Full Name is required"],
    },
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
    },
    bio: {
      type: String,
      default: "",
    },
    designation: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
    },
    phone: {
      type: String,
      default: "",
    },
    location: {
      type: String,
      default: "",
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: 0,
    },
    passwordChangeAt: {
      type: Date,
    },
    profilePicture: {
      type: String,
      default: "",
    },
    gender: {
      type: String,
      enum: {
        values: UserGender,
        message: "{VALUE} is not a valid gender",
      },
      required: [true, "Gender is required"],
    },
    role: {
      type: String,
      enum: {
        values: UserRoles,
        message: "{VALUE} is not a valid role",
      },
      default: "User",
    },
    status: {
      type: String,
      enum: {
        values: UserStatus,
        message: "{VALUE} is not a valid status",
      },
      default: "Active",
    },
    followers: {
      type: [Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    following: {
      type: [Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    dateOfBirth: {
      type: Date,
      required: [true, "Date of Birth is required"],
    },
    socialLinks: {
      type: [socialLinksSchema],
      default: [],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isPremiumUser: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

userSchema.pre("save", async function (next) {
  this.password = await bcrypt.hash(
    this.password,
    Number(config.bcrypt_salt_round),
  );
  next();
});

userSchema.post("save", function (doc, next) {
  doc.password = "";
  next();
});

// user static methods
userSchema.statics.isPasswordMatch = function (
  plainTextPassword: string,
  hashedPassword,
) {
  return bcrypt.compare(plainTextPassword, hashedPassword);
};

userSchema.statics.generateHashPassword = async function (
  plainTextPassword: string,
) {
  return await bcrypt.hash(plainTextPassword, Number(config.bcrypt_salt_round));
};

userSchema.statics.createToken = function (
  jwtPayload: { email: string; role: string },
  secret: string,
  expiresIn: string,
) {
  return jwt.sign(jwtPayload, secret, {
    expiresIn,
  });
};

userSchema.statics.verifyToken = function (token: string, secret: string) {
  return jwt.verify(token, secret);
};

userSchema.statics.isJWTIssuedBeforePasswordChanged = function (
  passwordChangedTimestamp: Date,
  jwtIssuedTimestamp: number,
) {
  const passwordChangedTime =
    new Date(passwordChangedTimestamp).getTime() / 1000;
  return passwordChangedTime > jwtIssuedTimestamp;
};

const User = model<IUser, IUserModel>("User", userSchema);
export default User;
