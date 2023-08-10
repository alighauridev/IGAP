import * as dotenv from "dotenv";
dotenv.config();
import express from "express";
import morgan from "morgan";
import mongoose from "mongoose";
import helmet from "helmet";
import errorHandler from "./middleware/globalErrorHandler.js";
import NOTFOUND from "./errors/notFound.js";
import passport from "passport";
import compression from "compression";
import Session from "express-session";
import { corsAll, corsWithOptions } from "./utils/cors.js";

const PORT = process.env.PORT || 5000;
const development = process.env.NODE_ENV === "development";

//import routes
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import jobRouter from "./routes/job.routes.js";
import bidRouter from "./routes/bid.routes.js";
import uploadRouter from "./routes/upload.routes.js";
import stripeRouter from "./routes/stripe.routes.js";
import categoryRouter from "./routes/category.routes.js";
import chargeRouter from "./routes/charge.routes.js";
import freelancerRouter from "./routes/seller.routes.js";
import statRouter from "./routes/stat.routes.js";
import servicesRouter from "./routes/services.routes.js";

//connect to mongoose
mongoose.set("strictQuery", true);

mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    development && console.log("Successfully connected to the Database");
  })
  .catch((err) => development && console.log(err));

//app
const app = express();

//middleware support for compression
const shouldCompress = (req, res) => {
  //Don't compress responses with this request header
  if (req.headers["x-no-compression"]) return false;
  //Resort to standard filter function
  return compression.filter(req, res);
};

//middleware
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//compress responses that allowed by shouldCompress function
app.use(compression({ filter: shouldCompress }));
app.use(
  Session({
    name: "google-oauth-session",
    secret: "mndkjndl-hd8iwy-leh-wefiwuehrwrwe-rwe-fsf",
    resave: true,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

//cors
app.use(corsAll);

// routes
app.get("/", (req, res) => {
  res.send("Hello World");
});
app.use("/auth", authRouter);
app.use("/jobs", jobRouter);
app.use("/bids", bidRouter);
app.use("/upload", uploadRouter);
app.use("/stripe", stripeRouter);
app.use("/categories", categoryRouter);
app.use("/charges", chargeRouter);
app.use("/user", userRouter);
app.use("/freelancer", freelancerRouter);
app.use("/stats", statRouter);
app.use("/services", servicesRouter);

//404 when invalid route is given
app.use((req, res, next) => {
  next(new NOTFOUND("Resource not found"));
});

//error handler
app.use(errorHandler);

//listener
app.listen(PORT, () => {
  development && console.log("successfully connected to the Server");
});
