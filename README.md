[![Youtube][youtube-shield]][youtube-url]
[![Facebook][facebook-shield]][facebook-url]
[![Facebook Page][facebook-shield]][facebook-group-url]
[![Instagram][instagram-shield]][instagram-url]
[![LinkedIn][linkedin-shield]][linkedin-url]
[![VS Code Theme][vscode-shield]][vscode-theme-url]

<!-- PROJECT LOGO -->
<br />
<p align="center">
    <img src="https://i.ibb.co.com/8dwgWQk/tech-tips-hub-logo.png" alt="Logo" width="80" height="80" />
    <h3 align="center">
        <a href="https://techtipshub-api.noyonrahman.xyz" target="_blank" >
            Tech Tips Hub API
        </a>
    </h3>
</p>

## Description:

**Tech Tips Hub** is an advanced blogging platform tailored for tech enthusiasts to read and write blogs. Users can access both free and premium blogs, with a monthly subscription offering exclusive content. The platform supports features like user registration, email verification, JWT-based authentication, upvoting/downvoting blogs, commenting with replies, and following/unfollowing users. It tracks important user interactions such as views, followers, and following, enhancing the social experience.

---

### **User Features:**

- **User Registration & Login:** Secure registration and login using JWT-based authentication.
- **Email Verification:** Users must verify their email after registration to access full platform features.
- **Read & Write Blogs:** Users can publish their own blogs or read both free and premium content.
- **Upvote/Downvote Blogs:** Users can upvote or downvote blogs to show their preference.
- **Commenting & Replies:** Users can comment on blogs and reply to comments, fostering engagement.
- **Follow/Unfollow Users:** Users can follow or unfollow others, with tracking of followers and following counts.
- **Premium Content Subscription:** Access premium blogs with a monthly subscription.
- **View Tracking:** Track unique blog views while excluding the author’s views.

---

### **Admin Features:**

- **User Management:** Admins can manage user accounts, including viewing, editing, or suspending users.
- **Content Moderation:** Admins can monitor, approve, or delete blogs and comments to ensure community guidelines are followed.
- **Subscription Management:** Admins can manage user subscriptions, view active and expired subscriptions, and handle billing issues.
- **Analytics & Reporting:** Track platform engagement metrics like total views, user growth, upvotes/downvotes, and content performance.

---

### Authentication Routes:

- `/api/v1/auth/register` - **POST** - Register a new user
- `/api/v1/auth/login` - **POST** - Login and receive access/refresh tokens
- `/api/v1/auth/refresh-token` - **POST** - Generate new access token using refresh token
- `/api/v1/auth/forget-password` - **POST** - Send password reset link to email
- `/api/v1/auth/reset-password` - **POST** - Reset password using the reset token
- `/api/v1/auth/me` - **GET** - Get the current logged-in user's details (Requires Auth)
- `/api/v1/auth/change-password` - **PUT** - Change the user's password (Requires Auth)

### User Routes:

- `/api/v1/users` - **GET** - Get all users (admin only)
- `/api/v1/users/:username` - **GET** - Get a single user by username
- `/api/v1/users/update-profile` - **PATCH** - Update logged-in user profile
- `/api/v1/users/profile/update-social-links` - **PUT** - Update user profile social links
- `/api/v1/users/:id/block` - **PATCH** - Block a user (admin only)
- `/api/v1/users/:id/unblock` - **PATCH** - Unblock a user (admin only)
- `/api/v1/users/:id/follow` - **PUT** - Follow a user (Requires Auth)
- `/api/v1/users/:id/unfollow` - **DELETE** - Unfollow a user (Requires Auth)
- `/api/v1/users/my-followers` - **GET** - Get current logged-in user's followers
- `/api/v1/users/my-following` - **GET** - Get current logged-in user's following
- `/api/v1/users/:id/followers` - **GET** - Get all followers by user ID
- `/api/v1/users/:id/following` - **GET** - Get all following by user ID

### Category Routes:

- `/api/v1/categories` - **GET** - Get all categories
- `/api/v1/categories` - **POST** - Create a new category (admin only)
- `/api/v1/categories/:id` - **GET** - Get a single category by ID
- `/api/v1/categories/:id` - **DELETE** - Delete a single category by ID (admin only)

## Post Routes

- `/api/v1/posts` - **POST** - Create a new post (requires user authentication)
- `/api/v1/posts` - **GET** - Get all posts (public access)
- `/api/v1/posts/my-posts` - **GET** - Get all posts by the current logged-in user (requires user authentication)
- `/api/v1/posts/:slug` - **GET** - Get a single post by slug (access depends on the post type)
- `/api/v1/posts/:id/vote` - **PUT** - Vote on a post (requires user authentication)
- `/api/v1/posts/:id/comments` - **POST** - Comment on a post (requires user authentication)
- `/api/v1/posts/:id/comments` - **GET** - Get all comments by post ID (requires user authentication)
- `/api/v1/posts/users/:userId` - **GET** - Get all posts by user ID (public access)

### Subscriptions Routes:

- `/api/v1/subscriptions/subscribe` - **POST** - Subscribe to a premium plan (requires user authentication)

### Payments Routes:

- `/api/v1/payments/confirmation` - **POST** - Check payment confirmation
- `/api/v1/payments/failed` - **POST** - Handle payment failure
- `/api/v1/payments/canceled` - **GET** - Handle payment cancellation

Here’s the updated list with TypeScript included:

### Tech Stack

<div align="center">

![Node.js](https://img.shields.io/static/v1?label=&message=Node.js&color=339933&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/static/v1?label=&message=Express&color=404D59)
![TypeScript](https://img.shields.io/static/v1?label=&message=TypeScript&color=007ACC&logo=typescript&logoColor=white)
![MongoDB](https://img.shields.io/static/v1?label=&message=MongoDB&color=47A248&logo=mongodb&logoColor=white)
![Bcrypt](https://img.shields.io/static/v1?label=&message=Bcrypt&color=EFCA00)
![Zod](https://img.shields.io/static/v1?label=&message=Zod&color=2D3748)
![Nodemailer](https://img.shields.io/static/v1?label=&message=Nodemailer&color=005571&logo=npm&logoColor=white)
![Multer](https://img.shields.io/static/v1?label=&message=Multer&color=34B7F1)
![Cloudinary](https://img.shields.io/static/v1?label=&message=Cloudinary&color=3A8E4D)
![Axios](https://img.shields.io/static/v1?label=&message=Axios&color=5A29E3&logo=axios&logoColor=white)
![JWT](https://img.shields.io/static/v1?label=&message=JWT&color=000000&logo=json-web-tokens&logoColor=white)

</div>

## Contact

- Email: [noyonrahman2003@gmail.com](mailto:noyonrahman2003@gmail.com)
- LinkedIn: [Noyon Rahman](https://linkedin.com/in/noyonalways)

<!-- MARKDOWN LINKS & IMAGES -->

[youtube-shield]: https://img.shields.io/badge/-Youtube-black.svg?style=round-square&logo=youtube&color=555&logoColor=white
[youtube-url]: https://youtube.com/@deskofnoyon
[facebook-shield]: https://img.shields.io/badge/-Facebook-black.svg?style=round-square&logo=facebook&color=555&logoColor=white
[facebook-url]: https://facebook.com/noyonalways
[facebook-group-url]: https://facebook.com/webbronoyon
[instagram-shield]: https://img.shields.io/badge/-Instagram-black.svg?style=round-square&logo=instagram&color=555&logoColor=white
[instagram-url]: https://instagram.com/noyonalways
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=round-square&logo=linkedin&colorB=555
[linkedin-url]: https://linkedin.com/in/noyonalways
[vscode-shield]: https://img.shields.io/badge/-VS%20Code%20Theme-black.svg?style=round-square&logo=visualstudiocode&colorB=555
[vscode-theme-url]: https://marketplace.visualstudio.com/items?itemName=noyonalways.codevibe-themes
