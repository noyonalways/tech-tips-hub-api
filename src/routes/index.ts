import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";
import userRouter from "../modules/user/user.routes";

const router: Router = Router();

const moduleRoutes = [
  {
    path: "/auth",
    routes: authRoutes,
  },
  {
    path: "/users",
    routes: userRouter,
  },
];

moduleRoutes.forEach(({ path, routes }) => {
  router.use(path, routes);
});

export default router;
