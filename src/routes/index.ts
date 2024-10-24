import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";
import categoryRoutes from "../modules/category/category.routes";
import paymentsRoutes from "../modules/payment/payment.routes";
import postRoutes from "../modules/post/post.routes";
import subscriptionRoutes from "../modules/subscription/subscription.routes";
import userRoutes from "../modules/user/user.routes";

const router: Router = Router();

const moduleRoutes = [
  {
    path: "/auth",
    routes: authRoutes,
  },
  {
    path: "/users",
    routes: userRoutes,
  },
  {
    path: "/categories",
    routes: categoryRoutes,
  },
  {
    path: "/posts",
    routes: postRoutes,
  },
  {
    path: "/subscriptions",
    routes: subscriptionRoutes,
  },
  {
    path: "/payments",
    routes: paymentsRoutes,
  },
];

moduleRoutes.forEach(({ path, routes }) => {
  router.use(path, routes);
});

export default router;
