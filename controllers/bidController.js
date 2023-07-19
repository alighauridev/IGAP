import mongoose from "mongoose";

//error imports
import NotFound from "../errors/notFound.js";
import BadRequest from "../errors/badRequest.js";

//importing models
import Job from "../models/job.js";
import Bid from "../models/bid.js";
import Transaction from "../models/transaction.js";
import Charge from "../models/charge.js";
import { pagination } from "../utils/reusable.js";

/**
 *
 * * This method is used to get all the bids for a job
 * ? Should be paginated or not?
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns
 *
 */
const getBids = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const bids = await Bid.find({ job: jobId })
      .populate("job", "title description")
      .populate("freelancer", "name email avatar")
      .lean()
      .exec();
    res.status(200).setHeader("Content-Type", "application/json").json({
      status: "OK",
      data: bids,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 *
 * * This method is used to get my bids
 * ? Should be paginated or not?
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns
 *
 *
 */

const getMyBids = async (req, res, next) => {
  try {
    const { _id } = req.user;
    let paginationFilter = pagination(req.query);
    const bids = await Bid.find({ freelancer: _id, ...paginationFilter.cursor })
      .sort({createdAt:-1})
      .limit(paginationFilter.limit +1 )
      .populate("freelancer", "name email avatar")
      .populate("job", "title description")
      .lean()
      .exec();

    let hasNextPage = false;
    if (bids.length > paginationFilter.limit) {
      hasNextPage = true;
      bids.pop();
    }

    res.status(200).setHeader("Content-Type", "application/json").json({
      status: "OK",
      data: {
        hasNextPage,
        bids,
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 *
 * * This method is used to create a bid by freelancer
 *
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns
 *
 */

const createBid = async (req, res, next) => {
  try {
    const { _id, role } = req.user;
    const { jobId } = req.params;
    const { budget, days, description } = req.body;

    const found = await Bid.findOne({ job: jobId, freelancer: _id });

    if (found) {
      throw new BadRequest("You have already bid on this job");
    }

    if (role !== "Freelancer") {
      throw new BadRequest("Only Freelancers can bid on a job");
    }
    const bid = await Bid.create({
      job: jobId,
      freelancer: _id,
      description: description,
      budget: budget,
      days: days,
    });
    res.status(200).setHeader("Content-Type", "application/json").json({
      status: "OK",
      data: bid,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 *
 * * This method is used to delete a bid by freelancer
 * ? Is deleting a bid allowed?
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns
 *
 */

const deleteBid = async (req, res, next) => {
  try {
    const { _id } = req.user;
    const { bidId } = req.params;

    const bid = await Bid.findById(bidId).lean().exec();

    if (!bid) {
      throw new NotFound("Bid not found");
    }

    if (bid.freelancer.toString() !== _id.toString()) {
      throw new BadRequest("You are not authorized to delete this bid");
    }

    if (bid.status === "accepted") {
      throw new BadRequest("You cannot delete an accepted bid");
    }

    const response = await Bid.findByIdAndDelete(bidId).lean().exec();

    if (!response) {
      throw new BadRequest("Bid not deleted");
    }

    res.status(200).setHeader("Content-Type", "application/json").json({
      status: "OK",
      data: "Bid Successfully Deleted",
    });
  } catch (err) {
    return next(err);
  }
};

/**
 *
 * * This method is used to accept a bid by buyer
 *
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns
 *
 */
const updateBidStatus = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { _id } = req.user._id;
    const { bidId } = req.params;
    const { status } = req.body;

    const bid = await Bid
      .findById(bidId)
      .populate("job", "budget")
      .exec();
    const charge = await Charge.findOne({}).lean().exec();
    if (!bid) {
      throw new NotFound("Bid not found");
    }

    if (bid.status !== "pending") {
      throw new BadRequest("This bid is already accepted or rejected");
    }



    // if the bid is accepted then start the transaction that will complete once the payment is trasfered to the freelancer at the end of order
    if (status === "accepted") {
      await Bid.updateMany({ _id: {$ne:bidId }}, { status: "rejected"})
      let transaction = new Transaction({
        buyer: _id,
        freelancer: bid.freelancer,
        job: bid.job._id,
        amount: bid.budget,
        platformCharge: bid.budget - (bid.budget * charge.platformCharge) / 100,
        freelancer:bid.freelancer
      });

      await transaction.save();

      await Job.findByIdAndUpdate(
        bid.job,
        {
          status: "inprogress",
          freelancer: bid.freelancer,
          budget: bid.budget,
          days: bid.days,
        },
      ).exec();
    }

    bid.status = status;
    const response = await bid.save();

    if (!response) {
      throw new BadRequest("Bid not updated");
    }

    await Bid.populate( response ,{path:"freelancer", select:"name email avatar"})
    await Bid.populate( response ,{path:"job", select:"title description"})

    await session.commitTransaction();

    res.status(200).setHeader("Content-Type", "application/json").json({
      status: "OK",
      data: bid,
    });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};

export default {
  getBids,
  getMyBids,
  createBid,
  deleteBid,
  updateBidStatus,
};
