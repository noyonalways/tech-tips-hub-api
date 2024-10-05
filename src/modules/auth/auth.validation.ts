import { z } from "zod";

const register = z.object({
  body: z
    .object({
      fullName: z.string({
        required_error: "Full Name is required",
        invalid_type_error: "Full Name must be string",
      }),
      username: z.string({
        required_error: "Username is required",
        invalid_type_error: "Username must be string",
      }),
      email: z.string({
        required_error: "Email is required",
        invalid_type_error: "Email must be string",
      }),
      password: z.string({
        required_error: "Password is required",
        invalid_type_error: "Password must be string",
      }),
      profilePicture: z
        .string({
          required_error: "Profile picture is required",
          invalid_type_error: "Profile Picture must be string",
        })
        .optional(),
    })
    .strict(),
});

const login = z.object({
  body: z
    .object({
      email: z.string({
        required_error: "Email is required",
        invalid_type_error: "Email must be string",
      }),
      password: z.string({
        required_error: "Password is required",
        invalid_type_error: "Password must be string",
      }),
    })
    .strict(),
});

const changePassword = z.object({
  body: z
    .object({
      oldPassword: z.string({
        invalid_type_error: "Old password must be a string",
        required_error: "Old password is required",
      }),
      newPassword: z
        .string({
          invalid_type_error: "New password must be a string",
          required_error: "New password is required",
        })
        .min(6, "New password must be at least 8 characters"),
    })
    .strict(),
});

export const authValidationSchema = {
  register,
  login,
  changePassword
};
