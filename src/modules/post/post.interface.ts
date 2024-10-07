import { Document, Types } from "mongoose";

export type TContentType = "html" | "markdown" | "text";

export interface IPost extends Document {
  author: Types.ObjectId;
  title: string;
  slug: string;
  contentType: TContentType;
  content: string;
  coverImage: string;
  images: string[];
  category: Types.ObjectId;
  tags: string[];
  isPremium: boolean;
  upVotes: number;
  downVotes: number;
  upvotedBy: Types.ObjectId[];
  downvotedBy: Types.ObjectId[];
  views: number;
  viewedBy: Types.ObjectId[];
  totalComments: number;
  isDeleted: boolean;
}
