import { Router } from "express";

//controller import
import Controller from "../controllers/bidController.js";
import auth from "../utils/auth.js";
import { createBid, updateBidStatus, validate } from "../middleware/validator.js";

const router = Router();

router.use(auth.verifyUser)

router.route("/job/:jobId")
    .get(auth.verifyBuyer ,Controller.getBids)
    .post(auth.verifyFreelancer, createBid(), validate, Controller.createBid);

router.route("/bid/:bidId")
    .put(auth.verifyBuyer, updateBidStatus(),validate, Controller.updateBidStatus)
    .delete(auth.verifyFreelancer,Controller.deleteBid);


router.route("/myBids")
    .get(auth.verifyFreelancer,Controller.getMyBids);


export default router;