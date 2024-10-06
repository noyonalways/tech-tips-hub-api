import httpStatus from "http-status";
import { JwtPayload } from "jsonwebtoken";
import { AppError } from "../../errors";
import Category from "../category/category.model";
import User from "../user/user.model";
import { IPost } from "./post.interface";
import Post from "./post.model";
import { generateUniqueSlug } from "./post.utils";

const create = async (userData: JwtPayload, payload: IPost) => {
  const user = await User.findOne({ email: userData.email });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  const category = await Category.findById(payload.category);
  if (!category) {
    throw new AppError(httpStatus.NOT_FOUND, "Category not found");
  }

  payload.author = user._id;
  payload.category = category._id;

  // Generate unique slug
  payload.slug = await generateUniqueSlug(payload.title, user.username);

  const session = await Post.startSession();

  try {
    // Start transaction
    session.startTransaction();

    // Create a new post within the transaction
    const newPost = await Post.create([{ ...payload }], { session });
    if (newPost.length < 0) {
      throw new AppError(httpStatus.BAD_REQUEST, "Failed to create post");
    }

    // Increment postCount of the category by 1
    const updatedCategory = await Category.findByIdAndUpdate(
      category._id,
      { $inc: { postCount: 1 } }, // Increment the postCount field by 1
      { session, new: true }, // Pass session and return the updated category
    );
    if (!updatedCategory) {
      throw new AppError(httpStatus.BAD_REQUEST, "Failed to update category");
    }

    // Commit the transaction and end the session
    await session.commitTransaction();
    await session.endSession();

    return (await newPost[0].populate("author")).populate("category");
  } catch (err) {
    // Abort transaction in case of an error
    await session.abortTransaction();
    await session.endSession();
    throw err;
  }
};

export const postService = {
  create,
};
