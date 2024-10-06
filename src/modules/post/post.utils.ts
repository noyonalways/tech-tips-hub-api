import slugify from "slugify";
import Post from "./post.model";

// Function to generate slug with potential suffix
export const generateUniqueSlug = async (title: string, username: string) => {
  const baseSlug = slugify(`${title}-${username}`, {
    lower: true,
    trim: true,
    remove: /[*+~.()'"!:@#$%^&\\]/g,
    replacement: "-",
  });

  let slug = baseSlug;
  let suffix = 1;

  // Check for slug existence and generate a unique one
  while (await Post.findOne({ slug })) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
};
