
import { Router } from "express";
import Controller from "../controllers/statController.js";
import auth from "../utils/auth.js";

const router = Router();


router.use(auth.verifyUser)

router.route('/')
    .get(auth.verifyAdmin,Controller.getStats)



export default router;
