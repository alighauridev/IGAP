import stripeImport from "stripe";
const stripe = stripeImport(process.env.STRIPE_SECRET_KEY);

//error imports
import NotFound from "../errors/notFound.js";
import BadRequest from "../errors/badRequest.js";
import UnAuthorized from "../errors/unAuthorized.js";

//importing models
import Job from "../models/job.js";
import Bid from "../models/bid.js";
import UserStripe from "../models/stripe.js";
import Charge from "../models/charge.js";
import Transaction from "../models/transaction.js";
import mongoose from "mongoose";
import { pagination } from "../utils/reusable.js";
import User from "../models/user.js";

/**
 *
 * * This method is used to get all the jobs for all users
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns
 *
 */
const getJobs = async (req, res, next) => {
  try {
    const { _id, role } = req.user;

    let paginationFilter = pagination(req.query);

    let filter = { status: "created" };

    // filtering based on ids based on role of the user
    if (role === "Buyer") {
      filter = { buyer: _id };
    } else if (role === "Admin") {
      filter = { status: { $ne: "draft" } };
    }

    const jobs = await Job.find({ ...filter, ...paginationFilter.cursor })
      .sort({ createdAt: -1 })
      .populate(
        role === "Freelancer"
          ? "buyer"
          : role === "Buyer"
          ? "freelancer"
          : "freelancer buyer",
        "name email"
      )
      .limit(paginationFilter.limit + 1)
      .lean()
      .exec();

    let hasNextPage = false;
    if (jobs.length > paginationFilter.limit) {
      hasNextPage = true;
      jobs.pop();
    }

    return res.status(200).setHeader("Content-Type", "application/json").json({
      status: "OK",
      data: {
        hasNextPage,
        jobs,
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 *
 * * This method is used to get my jobs for freelancer
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns
 *
 */
const getMyJobs = async (req, res, next) => {
  try {
    const { _id } = req.user;
    const paginationFilter = pagination(req.query);
    const jobs = await Job.find({ freelancer: _id ,...paginationFilter.cursor})
      .sort({ createdAt: -1 })
      .limit(paginationFilter.limit + 1)
      .populate("buyer", "name email")
      .lean()
      .exec();

    const completedJobs = await Job.find({status:"completed",freelancer:_id}).countDocuments().exec();
    const inProgressJobs = await Job.find({status:"inprogress",freelancer:_id}).countDocuments().exec();
    const deliveredJobs = await Job.find({status:"delivered",freelancer:_id}).countDocuments().exec();

    let hasNextPage = false;
    if (jobs.length > paginationFilter.limit) {
      hasNextPage = true;
      jobs.pop();
    }

    res.status(200).setHeader("Content-Type", "application/json").json({
      status: "OK",
      data: {
        jobs,
        hasNextPage,
        completedJobs,
        inProgressJobs,
        deliveredJobs
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 *
 * * This method is used to get a job by id
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns
 *
 */
const getJobById = async (req, res, next) => {
  try {
    const { _id, role } = req.user;
    const { jobId } = req.params;

    let filter = { _id: jobId };
    // filtering based on ids based on role of the user
    if (role === "Buyer") {
      filter = { ...filter, buyer: _id };
    } else if (role === "Freelancer") {
      filter = { ...filter, status: { $ne: "draft" } };
    } else {
      filter = { ...filter, status: { $ne: "draft" } };
    }

    const job = await Job.findOne({ ...filter })
      .populate(
        role === "Freelancer"
          ? "buyer"
          : role === "Buyer"
          ? "freelancer"
          : "freelancer buyer",
        "name email avatar"
      )
      .lean()
      .exec();

    // * Bids count for displaying on job details
    const bids = await Bid.find({ job: jobId }).countDocuments().exec();


    let buyerId = new mongoose.Types.ObjectId(
      role === "Freelancer" || role === "Admin" ? job.buyer._id : job.buyer
    );

    //* Buyer/Client Info and Stats for displaying on side of job details
    const buyerDetails = await User.aggregate([
      {
        $match: {
          _id: buyerId,
        },
      },
      {
        $lookup: {
          from: "jobs",
          localField: "_id",
          foreignField: "buyer",
          as: "jobs",
        },
      },
      {
        $unwind: {
          path:"$jobs"
        }
      },
      {
        $group: {
          _id: "$_id",
          active: {
            $sum: {
              $cond: [{ $eq: ["$jobs.status", "inprogress"] }, 1, 0],
            },
          },
          totalJobs:{
            $sum:1
          },
          hires: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ["$jobs.status", "completed"] },
                    { $eq: ["$jobs.status", "delivered"] },
                    { $eq: ["$jobs.status", "inprogress"] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          totalSpent: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ["$jobs.status", "completed"] },
                    { $eq: ["$jobs.status", "delivered"] },
                  ],
                },
                "$jobs.budget",
                0,
              ],
            },
          },
          name: {
            $first: "$name",
          },
          avatar: {
            $first: "$avatar",
          },
          location:{
            $first:"$location"
          },
          createdAt:{
            $first:"$createdAt"
          }
        }
      }
    ]);

    if (!job) {
      throw new NotFound("Job not found");
    }

    return res
      .status(200)
      .setHeader("Content-Type", "application/json")
      .json({
        status: "OK",
        data: {
          job:{...job,bids},
          buyerDetails: buyerDetails[0],
        },
      });
  } catch (err) {
    return next(err);
  }
};

/**
 *
 * * This method is used to leave a review after the job is completed
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns
 *
 */
const createReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const { jobId } = req.params;
    const { _id } = req.user;

    const job = await Job.findOne({ _id: jobId, status: "completed" }).exec();

    if (!job) {
      throw new BadRequest("Job is not completed yet or there is no such job");
    }

    if (job.buyer.toString() !== _id.toString()) {
      throw new UnAuthorized(
        "You are not authorized to leave a review for this job"
      );
    }

    job.review = {
      rating: rating,
      comment: comment,
    };

    const response = await job.save();

    if (!response) {
      throw new BadRequest("Review could not be created");
    }

    return res.status(200).setHeader("Content-Type", "application/json").json({
      status: "OK",
      data: response,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 *
 * * This method is used to create a job by buyer
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns
 */
const createJob = async (req, res, next) => {
  try {
    const { _id } = req.user;

    const job = await Job.create({
      buyer: _id,
      ...req.body,
    });

    if (!job) {
      throw new BadRequest("Job could not be created");
    }

    return res.status(200).setHeader("Content-Type", "application/json").json({
      status: "OK",
      data: job,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 *
 * * This method is used to deliver a job by freelancer
 * TODO: Merge this Method with Stripe Payment Method
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns
 *
 */
const deliverJob = async (req, res, next) => {
  try {
    const { _id } = req.user;
    const { jobId } = req.params;
    const { files, note } = req.body;

    const job = await Job.findById(jobId).exec();

    if (!job) {
      throw new NotFound("Job not found");
    }

    if (job.freelancer.toString() !== _id.toString()) {
      throw new UnAuthorized("You are not authorized to deliver this job");
    }

    if (
      job.status === "completed" ||
      job.status === "delivered" ||
      job.status === "cancelled" ||
      job.status === "disputed"
    ) {
      throw new BadRequest("This job cannot be delivered check status");
    }

    job.status = "delivered";
    job.delivery = {
      files: files,
      note: note,
      deliveredAt: Date.now(),
    };
    let response = await job.save();

    await Job.populate(response, {
      path: "buyer",
      select: "name email avatar",
    });

    // * Bids count for displaying on job details
    const bids = await Bid.find({ job: jobId }).countDocuments().exec();


    if (!response) {
      throw new BadRequest("Job could not be delivered");
    }

    //make response a simple object
    response = response.toObject();

    return res.status(200).setHeader("Content-Type", "application/json").json({
      status: "OK",
      data: {
        job:{...response,bids},
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 *
 * * This method is used to accept a job delivery by buyer
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns
 *
 */
const updateJobStatus = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { _id, role } = req.user;
    const { jobId } = req.params;
    const { status } = req.body;

    const job = await Job.findById(jobId).exec();

    if (!job) {
      throw new NotFound("Job not found");
    }

    if (job.buyer.toString() !== _id.toString() && role !== "Admin") {
      throw new UnAuthorized("You are not authorized to accept this job");
    }

    if (
      (job.status === "completed" || job.status === "cancelled") &&
      status === "completed"
    ) {
      throw new BadRequest("This job can not be completed check status");
    }

    // * status = completed case
    if (status === "completed") {
      //TODO: when want to turn on payments pls uncomment this code
      // let userStripe = await UserStripe.findOne({ user: job.buyer }).exec();
      const charge = await Charge.findOne({}).lean().exec();
      //   if (!userStripe) {
      //     throw new BadRequest("User stripe account not found");
      //   }
      //   userStripe.pendingBalance =
      //     job.budget - (job.budget * charge.platformCharge) / 100;
      //   await userStripe.save();
    }
    // * status = cancelled case
    else if (status === "cancelled") {
      if (role !== "Admin") {
        throw new UnAuthorized("You are not authorized to cancel this job");
      }
      //TODO: when want to turn on payments pls uncomment this code
      // const transaction = await Transaction.findOne({ job: jobId })
      //   .lean()
      //   .exec();
      // if (!transaction) {
      //   throw new BadRequest("Transaction not found");
      // }

      // const refund = await stripe.refunds.create({
      //   payment_intent: transaction.paymentIntentId,
      //   amount: transaction.amount - transaction.platformCharge,
      // });
      // if (!refund) {
      //   throw new BadRequest("Refund could not be processed");
      // }
    }
    // * status = disputed case
    else if (status === "disputed") {
      if (role !== "Buyer" || role !== "Freelancer") {
        throw new UnAuthorized("You are not authorized to dispute this job");
      }
      if (!req.body.disputeDescription) {
        throw new BadRequest("Dispute description is required");
      }
      job.disputeDescription = req.body.disputeDescription;
    }

    job.status = status;
    const response = await job.save();

    if (!response) {
      throw new BadRequest("Job status could not be updated");
    }

    await Job.populate(
      response,
      role === "Freelancer"
        ? { path: "buyer", select: "name email avatar" }
        : role === "Buyer"
        ? { path: "freelancer", select: "name email avatar" }
        : { path: "freelancer buyer", select: "name email avatar" }
    );

    await session.commitTransaction();

    res.status(200).setHeader("Content-Type", "application/json").json({
      status: "OK",
      data: response,
    });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};

/**
 *
 * * This method is used to create a dispute by buyer or freelancer
 *
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns
 *
 */
const createDispute = async (req, res, next) => {
  try {
    const { _id } = req.user;
    const { jobId } = req.params;
    const { disputeDescription } = req.body;

    if (!disputeDescription) {
      throw new BadRequest("Dispute description is required");
    }

    const job = await Job.findById(jobId).exec();

    if (!job) {
      throw new NotFound("Job not found");
    }

    if (
      job.buyer.toString() !== _id.toString() &&
      job.freelancer.toString() !== _id.toString()
    ) {
      throw new UnAuthorized(
        "You are not authorized to create a dispute for this job"
      );
    }

    if (job.status === "disputed") {
      throw new BadRequest("This job is already disputed");
    }

    job.status = "disputed";
    job.disputeDescription = disputeDescription;

    let response = await job.save();


    // * Bids count for displaying on job details
    const bids = await Bid.find({ job: jobId }).countDocuments().exec();



    if (!response) {
      throw new BadRequest("Dispute could not be created");
    }

    await Job.populate(response, {
      path: "buyer",
      select: "name email avatar",
    })

    //make response a simple object
    response = response.toObject();


    return res.status(200).setHeader("Content-Type", "application/json").json({
      status: "OK",
      data: {...response,bids},
    });
  } catch (err) {
    return next(err);
  }
};

export default {
  getJobs,
  getJobById,
  createJob,
  deliverJob,
  updateJobStatus,
  createDispute,
  createReview,
  getMyJobs,
};
