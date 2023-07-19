import { Router } from "express";
import Controller from "../controllers/chargeController.js";
const router = Router();


router.route("/set")
    .post(Controller.updateCharge);



export default router;