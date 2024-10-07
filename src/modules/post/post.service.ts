import httpStatus from "http-status";
import { JwtPayload } from "jsonwebtoken";
import mongoose from "mongoose";
import { QueryBuilder } from "../../builder";
import { AppError } from "../../errors";
import Category from "../category/category.model";
import { IComment } from "../comment/comment.interface";
import Comment from "../comment/comment.model";
import Subscription from "../subscription/subscription.model";
import User from "../user/user.model";
import { postSearchableFields } from "./post.constant";
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

// get all post (for anyone to see title small part of description, category, views, upvote, downvote etc)
const getAll = async (query: Record<string, unknown>) => {
  const postQuery = new QueryBuilder(
    Post.find({}).populate("author").populate("category"),
    query,
  )
    .search(postSearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await postQuery.modelQuery;
  const meta = await postQuery.countTotal();

  return { result, meta };
};

// get current logged in user all posts
const getLoggedInUserPosts = async (
  userData: JwtPayload,
  query: Record<string, unknown>,
) => {
  const user = await User.findOne({ email: userData.email });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  const postQuery = new QueryBuilder(
    Post.find({ author: user._id }).populate("author").populate("category"),
    query,
  )
    .search(postSearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await postQuery.modelQuery;
  const meta = await postQuery.countTotal();

  return { result, meta };
};

const getPostByProperty = async (key: string, value: string) => {
  let post;

  if (key === "_id") {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      throw new AppError(httpStatus.BAD_REQUEST, "Invalid post Id");
    }
    post = await Post.findById(value)
      .populate({
        path: "author",
        select: "fullName email profilePicture",
      })
      .populate({
        path: "category",
        select: "name description postCount",
      });
  } else {
    post = await Post.findOne({ [key]: value })
      .populate({
        path: "author",
        select: "fullName email profilePicture",
      })
      .populate({
        path: "category",
        select: "name description postCount",
      });
  }

  if (!post) {
    throw new AppError(httpStatus.NOT_FOUND, "Post not found");
  }

  return post;
};

// get premium single post
const getPremiumSinglePost = async (userData: JwtPayload, id: string) => {
  const currentLoggedInUser = await User.findOne({ email: userData.email });
  if (!currentLoggedInUser) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  // Fetch the post by its ID
  const post = await Post.findById(id)
    .populate({
      path: "author",
      select: "fullName email profilePicture",
    })
    .populate({
      path: "category",
      select: "name description postCount",
    });

  if (!post) {
    throw new AppError(httpStatus.NOT_FOUND, "Post not found");
  }

  // If the logged-in user is the author of the post, allow access without checking premium status
  if (post.author._id.equals(currentLoggedInUser._id)) {
    return post;
  }

  // If the logged-in user is not the author, check if they are a premium member
  if (!currentLoggedInUser.isPremiumUser) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Premium content access is only for premium members",
    );
  }

  // Fetch the user's current subscription
  const currentSubscription = await Subscription.findOne({
    user: currentLoggedInUser._id,
  });

  // Check if the subscription exists
  if (!currentSubscription) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You do not have an active subscription. Please subscribe to access premium content.",
    );
  }

  // Check if the subscription is active and not expired
  const currentDate = new Date();
  if (
    currentSubscription.status !== "Active" ||
    currentDate < new Date(currentSubscription.startDate) ||
    currentDate > new Date(currentSubscription.endDate)
  ) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Your premium subscription has expired or is not active. Please renew your subscription.",
    );
  }

  // Increment the view count only if the user has not viewed this post before
  const hasViewed = post.viewedBy.includes(currentLoggedInUser._id);
  if (!hasViewed) {
    await Post.findByIdAndUpdate(id, {
      $inc: { views: 1 },
      $push: { viewedBy: currentLoggedInUser._id },
    });
  }

  return post;
};

// upvote a post
const upvotePost = async (userData: JwtPayload, postId: string) => {
  // Start a session for transaction handling
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const currentLoggedInUser = await User.findOne({ email: userData.email });
    if (!currentLoggedInUser) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    // Fetch the post by its ID
    const post = await Post.findById(postId).session(session);
    if (!post) {
      throw new AppError(httpStatus.NOT_FOUND, "Post not found");
    }

    // Check if the user has already upvoted the post
    const hasAlreadyUpvoted = post.upvotedBy.includes(currentLoggedInUser._id);
    const hasAlreadyDownvoted = post.downvotedBy.includes(
      currentLoggedInUser._id,
    );

    if (hasAlreadyUpvoted) {
      // Remove upvote if the user has already upvoted (toggle behavior)
      post.upVotes -= 1;
      post.upvotedBy = post.upvotedBy.filter(
        (userId) => !userId.equals(currentLoggedInUser._id),
      );
    } else {
      // Add upvote
      post.upVotes += 1;
      post.upvotedBy.push(currentLoggedInUser._id);

      // If the user had downvoted the post previously, remove the downvote
      if (hasAlreadyDownvoted) {
        post.downVotes -= 1;
        post.downvotedBy = post.downvotedBy.filter(
          (userId) => !userId.equals(currentLoggedInUser._id),
        );
      }
    }

    // Save the changes
    await post.save({ session });

    // Commit the transaction and end the session
    await session.commitTransaction();
    session.endSession();

    return {
      message: hasAlreadyUpvoted
        ? "Upvote removed"
        : "Post upvoted successfully",
      post,
    };
  } catch (error) {
    // Abort the transaction in case of error
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

// downvote a post
const downvotePost = async (userData: JwtPayload, postId: string) => {
  // Start a session for transaction handling
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const currentLoggedInUser = await User.findOne({ email: userData.email });
    if (!currentLoggedInUser) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    // Fetch the post by its ID
    const post = await Post.findById(postId).session(session);
    if (!post) {
      throw new AppError(httpStatus.NOT_FOUND, "Post not found");
    }

    // Check if the user has already downvoted the post
    const hasAlreadyDownvoted = post.downvotedBy.includes(
      currentLoggedInUser._id,
    );
    const hasAlreadyUpvoted = post.upvotedBy.includes(currentLoggedInUser._id);

    if (hasAlreadyDownvoted) {
      // Remove downvote if the user has already downvoted (toggle behavior)
      post.downVotes -= 1;
      post.downvotedBy = post.downvotedBy.filter(
        (userId) => !userId.equals(currentLoggedInUser._id),
      );
    } else {
      // Add downvote
      post.downVotes += 1;
      post.downvotedBy.push(currentLoggedInUser._id);

      // If the user had upvoted the post previously, remove the upvote
      if (hasAlreadyUpvoted) {
        post.upVotes -= 1;
        post.upvotedBy = post.upvotedBy.filter(
          (userId) => !userId.equals(currentLoggedInUser._id),
        );
      }
    }

    // Save the changes
    await post.save({ session });

    // Commit the transaction and end the session
    await session.commitTransaction();
    session.endSession();

    return {
      message: hasAlreadyDownvoted
        ? "Downvote removed"
        : "Post downvoted successfully",
      post,
    };
  } catch (error) {
    // Abort the transaction in case of error
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

// comment on post with transaction
const commentOnPost = async (
  userData: JwtPayload,
  postId: string,
  payload: IComment,
) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Find the current logged-in user
    const currentLoggedInUser = await User.findOne({
      email: userData.email,
    }).session(session);

    if (!currentLoggedInUser) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    // Fetch the post by its ID
    const post = await Post.findById(postId).session(session);
    if (!post) {
      throw new AppError(httpStatus.NOT_FOUND, "Post not found");
    }

    // Create a new comment
    const comment = await Comment.create(
      [
        {
          ...payload,
          user: currentLoggedInUser._id,
          post: post._id,
        },
      ],
      { session },
    );

    // Increment the totalComments field on the post
    post.totalComments += 1;
    await post.save({ session });

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    // Find and populate the comment with specific fields from user and post
    return await Comment.findById(comment[0]._id)
      .populate({
        path: "user",
        select: "fullName email profilePicture",
      })
      .populate({
        path: "post",
        select: "title category slug",
      });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

// get all comments by post id
const getAllCommentsByPostId = async (
  userData: JwtPayload,
  postId: string,
  query: Record<string, unknown>,
) => {
  const currentLoggedInUser = await User.findOne({ email: userData.email });
  if (!currentLoggedInUser) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  // Fetch the post by its ID
  const post = await Post.findById(postId);
  if (!post) {
    throw new AppError(httpStatus.NOT_FOUND, "Post not found");
  }

  const commentQuery = new QueryBuilder(
    Comment.find({ post: post._id })
      .populate({
        path: "user",
        select: "fullName email profilePicture", // Select only specific user fields
      })
      .populate({
        path: "post",
        select: "title category slug", // Select specific post fields
      }),
    query,
  )
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await commentQuery.modelQuery;
  const meta = await commentQuery.countTotal();

  return { result, meta };
};

export const postService = {
  create,
  getAll,
  getLoggedInUserPosts,
  getPremiumSinglePost,
  getPostByProperty,
  upvotePost,
  downvotePost,
  commentOnPost,
  getAllCommentsByPostId,
};
