import httpStatus from "http-status";
import { catchAsync, sendResponse } from "../../utils";
import { postService } from "./post.service";

const create = catchAsync(async (req, res) => {
  const result = await postService.create(req.user, req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Post created successfully",
    data: result,
  });
});

const getAll = catchAsync(async (req, res) => {
  const { meta, result } = await postService.getAll(req.query);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Posts retrieved successfully",
    meta,
    data: result,
  });
});

const getLoggedInUserPosts = catchAsync(async (req, res) => {
  const { meta, result } = await postService.getLoggedInUserPosts(
    req.user,
    req.query,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Posts retrieved successfully",
    meta,
    data: result,
  });
});

// get access free blog post if premium then pass to next controller / middleware
const getFreeSinglePost = catchAsync(async (req, res, next) => {
  const { slug } = req.params;
  const post = await postService.getPostByProperty("slug", slug);

  if (!post.isPremium) {
    return sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Post retrieved successfully",
      data: post,
    });
  }

  next();
});

const getPremiumSinglePost = catchAsync(async (req, res) => {
  const { slug } = req.params;
  const result = await postService.getPremiumSinglePost(req.user, slug);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Post retrieved successfully",
    data: result,
  });
});

// upvote a post
// const upvotePost = catchAsync(async (req, res) => {
//   const { id } = req.params;
//   await postService.upvotePost(req.user, id);

//   sendResponse(res, {
//     success: true,
//     statusCode: httpStatus.OK,
//     message: "message",
//     data: "post",
//   });
// });

// downvote a post
// const downvotePost = catchAsync(async (req, res) => {
//   const { id } = req.params;
//   const { message, post } = await postService.downvotePost(req.user, id);

//   sendResponse(res, {
//     success: true,
//     statusCode: httpStatus.OK,
//     message: message,
//     data: post,
//   });
// });

// vote
const voteOnPost = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { voteType } = req.query;

  const result = await postService.voteOnPost(
    req.user,
    id,
    voteType as "upvote" | "downvote",
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Vote on post successfully updated",
    data: result,
  });
});

// comment on post
const commentOnPost = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await postService.commentOnPost(req.user, id, req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Add comment successfully",
    data: result,
  });
});

// get all comments by post id
const getAllCommentsByPostId = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { result, meta } = await postService.getAllCommentsByPostId(
    req.user,
    id,
    req.query,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Comments retrieved successfully",
    meta,
    data: result,
  });
});

// get all posts by user id
const getAllPostsByUserId = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { result, meta } = await postService.getAllPostsByUserId(
    userId,
    req.query,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Posts retrieved successfully",
    meta,
    data: result,
  });
});

export const postController = {
  create,
  getAll,
  getLoggedInUserPosts,
  getFreeSinglePost,
  getPremiumSinglePost,
  voteOnPost,
  commentOnPost,
  getAllCommentsByPostId,
  getAllPostsByUserId,
};
