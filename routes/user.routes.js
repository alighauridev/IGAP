import { Router } from "express";
const router = Router();

//controllers import
import Controller from "../controllers/userController.js";

//utils import
import auth from "../utils/auth.js";

router.route("/profile").get(auth.verifyUser, Controller.getProfile);

router.route("/profile/update").put(auth.verifyUser, Controller.updateProfile);


// router
//   .route("/stats")
//   .get(auth.verifyUser, auth.verifyAdmin, Controller.getStats);

export default router;
