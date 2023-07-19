import { Router } from "express";

//controller import
import Controller from "../controllers/stripeController.js";
import auth from "../utils/auth.js";


const router = Router();

router.use(auth.verifyUser);

router.route("/create-account-link").get(auth.verifyFreelancer, Controller.createAccountLink);

router.route("/create-payment-intent").post(Controller.paymentIntent);

router.route("/create-charge").post(auth.verifyBuyer,Controller.paymentIntentForJob);

router.route("/payout").post(auth.verifyAdmin,Controller.payout);

router.route("/account-status").post(Controller.accountStatus);

router.route("/balance").post(auth.verifyFreelancer,Controller.balance);



export default router;