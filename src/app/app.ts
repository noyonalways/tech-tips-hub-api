import "colors";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

// local imports
import applicationRoutes from "./routes";

const app = express();

// middlewares
app.use(morgan("dev"));
app.use(helmet());
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://192.168.0.116:3000",
      "https://tech-tips-hub.vercel.app",
      "https://tech-tips-hub.noyonrahman.xyz",
      "https://tech-tips-hub-reset-password.vercel.app",
      "https://tech-tips-hub-reset-password.noyonrahman.xyz",
    ],
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  }),
);
app.use(express.json());
app.use(cookieParser());

// application routes
app.use(applicationRoutes);

export default app;
