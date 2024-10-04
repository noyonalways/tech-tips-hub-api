import { Router } from "express";

const userRouter: Router = Router();

userRouter.route("/").get(() => {});

export default userRouter;
