import httpStatus from "http-status";
import jwt, { JwtPayload } from "jsonwebtoken";
import config from "../config";
import { TUserRoles } from "../modules/user/user.interface";
import { catchAsync, sendResponse } from "../utils";

const auth = (...requiredRoles: TUserRoles[]) => {
  return catchAsync(async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return sendResponse(res, {
        success: false,
        statusCode: httpStatus.UNAUTHORIZED,
        message: "Unauthorized Access",
        data: undefined,
      });
    }

    const decoded = jwt.verify(
      token,
      config.jwt_access_token_secret as string,
    ) as JwtPayload;

    const { email, role } = decoded;

    // check the use is exists or not
    // const user = await User.isUserExists("email", email);
    // if (!user) {
    //   throw new AppError(httpStatus.NOT_FOUND, "User not found");
    // }

    if (requiredRoles && !requiredRoles.includes(role)) {
      return sendResponse(res, {
        success: false,
        statusCode: httpStatus.FORBIDDEN,
        message: "Access Forbidden",
        data: undefined,
      });
    }

    // req.user = decoded;
    next();
  });
};

export default auth;
