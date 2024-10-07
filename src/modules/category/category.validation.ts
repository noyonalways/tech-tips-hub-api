import { z } from "zod";

const create = z.object({
  body: z
    .object({
      name: z
        .string({
          required_error: "Name is required",
          invalid_type_error: "Name must be a string",
        })
        .min(1, "Category name must be at least one character"),
      description: z
        .string({
          required_error: "Description is required",
          invalid_type_error: "Description must be a string",
        })
        .min(1, "Description must be at least one character")
        .optional(),
    })
    .strict(),
});

const update = z.object({
  body: z
    .object({
      name: z
        .string({
          required_error: "Name is required",
          invalid_type_error: "Name must be a string",
        })
        .min(1, "Category name must be at least one character")
        .optional(),
      description: z
        .string({
          required_error: "Description is required",
          invalid_type_error: "Description must be a string",
        })
        .min(1, "Description must be at least one character")
        .optional(),
    })
    .strict(),
});

export const categoryValidationSchema = {
  create,
  update,
};
