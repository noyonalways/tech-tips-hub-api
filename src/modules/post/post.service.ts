import httpStatus from "http-status";
import { JwtPayload } from "jsonwebtoken";
import mongoose from "mongoose";
import { QueryBuilder } from "../../builder";
import { AppError } from "../../errors";
import Category from "../category/category.model";
import { IComment } from "../comment/comment.interface";
import Comment from "../comment/comment.model";
import User from "../user/user.model";
import View from "../view/view.model";
import Vote from "../vote/vote.model";
import { postSearchableFields } from "./post.constant";
import { IPost } from "./post.interface";
import Post from "./post.model";
import { generateUniqueSlug, isPremiumSubscriptionActive } from "./post.utils";

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

    return (
      await newPost[0].populate({
        path: "author",
        select: "fullName email profilePicture",
      })
    ).populate({
      path: "category",
      select: "name description postCount",
    });
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
const getPremiumSinglePost = async (userData: JwtPayload, postId: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Get the current logged-in user
    const currentLoggedInUser = await User.findOne({
      email: userData.email,
    }).session(session);

    if (!currentLoggedInUser) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    // Fetch the post by its ID
    const post = await Post.findById(postId)
      .populate({
        path: "author",
        select: "fullName email profilePicture",
      })
      .populate({
        path: "category",
        select: "name description postCount",
      })
      .session(session);

    if (!post) {
      throw new AppError(httpStatus.NOT_FOUND, "Post not found");
    }

    // Allow access if the current user is the post author
    if (post.author._id.equals(currentLoggedInUser._id)) {
      await session.commitTransaction();
      session.endSession();
      return post; // No need to record views for the author
    }

    // Check if the user is a premium user
    const isPremiumUser = currentLoggedInUser.isPremiumUser;
    if (!isPremiumUser) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "Premium content access is for premium members only",
      );
    }

    // Verify if the user's subscription is active
    const subscriptionActive = await isPremiumSubscriptionActive(
      currentLoggedInUser._id,
    );

    if (!subscriptionActive) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "Your subscription is inactive or expired. Please renew to access premium content.",
      );
    }

    // Ensure the user has not already viewed the post
    const existingView = await View.findOne({
      post: post._id,
      user: currentLoggedInUser._id,
    }).session(session);

    if (!existingView) {
      // Record the view if it's a new view by the user (excluding the author)
      await View.create([{ post: post._id, user: currentLoggedInUser._id }], {
        session,
      });

      // Increment the view count in the post
      post.totalViews += 1;
      await post.save({ session });
    }

    // Commit transaction and return the post
    await session.commitTransaction();
    session.endSession();

    return post;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

// vote on post
const voteOnPost = async (
  userData: JwtPayload,
  postId: string,
  voteType: "upvote" | "downvote",
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Validate the voteType
    if (!["upvote", "downvote"].includes(voteType)) {
      throw new AppError(httpStatus.BAD_REQUEST, "Invalid vote type");
    }

    // Get the current logged-in user
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

    // Ensure the user is not the author of the post (skip author's votes if necessary)
    if (post.author.equals(currentLoggedInUser._id)) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "Author cannot vote on their own post",
      );
    }

    // Find if the user has already voted on this post
    const existingVote = await Vote.findOne({
      post: post._id,
      user: currentLoggedInUser._id,
    }).session(session);

    if (existingVote) {
      if (existingVote.type === voteType) {
        // If the user clicks the same vote type (toggle functionality)
        await existingVote.deleteOne({ session });

        if (voteType === "upvote") {
          post.upVotes -= 1;
        } else {
          post.downVotes -= 1;
        }
      } else {
        // If the user is switching their vote (from upvote to downvote or vice versa)
        existingVote.type = voteType;
        await existingVote.save({ session });

        if (voteType === "upvote") {
          post.upVotes += 1;
          post.downVotes -= 1;
        } else {
          post.downVotes += 1;
          post.upVotes -= 1;
        }
      }
    } else {
      // If no existing vote, create a new vote
      await Vote.create(
        [
          {
            user: currentLoggedInUser._id,
            post: post._id,
            type: voteType,
          },
        ],
        { session },
      );

      // Increment upvotes or downvotes on the post
      if (voteType === "upvote") {
        post.upVotes += 1;
      } else {
        post.downVotes += 1;
      }
    }

    // Save the post after updating votes
    await post.save({ session });

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    return post; // Return the updated post with vote counts
  } catch (error) {
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
  voteOnPost,
  commentOnPost,
  getAllCommentsByPostId,
};
