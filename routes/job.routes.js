import { Router } from "express";
const router = Router();

//controllers import
import Controller from "../controllers/jobController.js";
import auth from "../utils/auth.js";

import {
  createJob,
  deliverJob,
  reviewJob,
  updateJobStatus,
  validate,
} from "../middleware/validator.js";

router
  .route("/")
  .get(auth.verifyUser, Controller.getJobs)
  .post(
    auth.verifyUser,
    auth.verifyBuyer,
    createJob(),
    validate,
    Controller.createJob
  );

router
  .route("/job/:jobId")
  .get(auth.verifyUser, Controller.getJobById)
  .put(
    auth.verifyUser,
    auth.verifyFreelancer,
    deliverJob(),
    validate,
    Controller.deliverJob
  );

router
  .route("/:jobId/update/status")
  .put(
    auth.verifyUser,
    updateJobStatus(),
    validate,
    Controller.updateJobStatus
  );

router.route("/:jobId/dispute").put(auth.verifyUser, Controller.createDispute);

router
  .route("/job/:jobId/review")
  .put(
    auth.verifyUser,
    auth.verifyBuyer,
    reviewJob(),
    validate,
    Controller.createReview
  );

router
  .route("/myJobs")
  .get(auth.verifyUser, auth.verifyFreelancer, Controller.getMyJobs);

export default router;
