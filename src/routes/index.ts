import { Router } from "express";
import userRouter from "../modules/user/user.routes";

const router: Router = Router();

const moduleRoutes = [
  {
    path: "/users",
    routes: userRouter,
  },
];

moduleRoutes.forEach(({ path, routes }) => {
  router.use(path, routes);
});

export default router;
