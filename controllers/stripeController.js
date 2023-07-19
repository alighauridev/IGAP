import mongoose from "mongoose";
import stripeImport from "stripe";
const stripe = stripeImport(process.env.STRIPE_SECRET_KEY);
import cron from "node-cron";

//import models
import UserStripe from "../models/stripe.js";
import User from "../models/user.js";
import Job from "../models/job.js";
import Transaction from "../models/transaction.js";

//import errors
import BadRequest from "../errors/badRequest.js";
import Charge from "../models/charge.js";

//running cron job every hour to check which payments to release
cron.schedule("0 * * * *", async () => {
  console.log("running cron job every hour");
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // today date to compare that if exactly 3 days or more has passed since updateAt
    const today = new Date();
    today.setDate(today.getDate() - 3);
    const jobs = await Job.find({
      status: "completed",
      updatedAt: { $lte: today },
    })
      .lean()
      .exec();
    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];
      const transaction = await Transaction.findOne({ job: job._id }).exec();
      if (!transaction) throw new BadRequest("Transaction not found");
      if (transaction.status === "completed") continue;
      else if (transaction.status === "cancelled")
        throw new BadRequest("Transaction cancelled");
      //TODO: check if the transfer is successfull or not using transfer objects source_transaction property
      const transafer = await stripe.transfers.create({
        amount: (transaction.amount - transaction.platformCharge) * 100,
        currency: "usd",
        destination: transaction.freelancer,
        transfer_group: transaction.job,
      });
      if (!transafer) throw new BadRequest("Transfer failed");
      transaction.status = "completed";
      transaction.transferId = transafer.id;
      await transaction.save();

      await session.commitTransaction();
    }
  } catch (err) {
    await session.abortTransaction();
    console.log(err);
  } finally {
    session.endSession();
  }
});

/**
 *
 * * This Function creates a stripe account for a user if there is none and returns the account object
 * @param {String} userId
 * @returns {Object} stripe account object
 *
 */
const findOrCreateConnectedAccount = async (userId) => {
  try {
    const userStripe = await UserStripe.findOne({ user: userId })
      .populate("user", "name email")
      .lean()
      .exec();
    if (userStripe) {
      return {
        name: userStripe.user.name,
        email: userStripe.user.email,
        accountId: userStripe.accountId,

      };
    }

    const user = await User.findById(userId).select("name email").lean().exec();

    if (!user) throw new BadRequest("User not found");

    const account = await stripe.accounts.create({
      type: "express",
    });

    const newStripe = new UserStripe({
      user: userId,
      accountId: account.id,
    });

    await newStripe.save();

    return {
      name: user.name,
      email: user.email,
      accountId: account.id,
    };
  } catch (err) {
    return next(err);
  }
};

// TODO: CHeck completion of onboardign through details_submitted field
const createAccountLink = async (req, res, next) => {
  try {
    const { _id } = req.user;

    let accountInfo = await findOrCreateConnectedAccount(_id);

    const accountLink = await stripe.accountLinks.create({
      account: accountInfo.accountId,
      refresh_url: process.env.STRIPE_REFRESH_URL,
      return_url: process.env.STRIPE_RETURN_URL,
      type: "account_onboarding",
    });

    res.status(200).json({
      status: "OK",
      data: accountLink,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 *
 * * This method is for transfering money from buyer to the platform then to the freelancer
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns
 */

const paymentIntent = async (req, res, next) => {
  try {
    const { amount, currency, transferTo } = req.body;

    const freelancerAccountInfo = await UserStripe.findOne({ user: transferTo })
      .lean()
      .exec();

    if (!freelancerAccountInfo) throw new BadRequest("Freelancer not found");

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
      application_fee_amount: 0,
      transfer_data: {
        destination: freelancerAccountInfo.accountId,
      },
    });

    res.status(200).json({
      status: "OK",
      data: { client_secret: paymentIntent.client_secret },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 *
 * * This method is for transfering money from buyer to the platform for the JOb
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns
 *
 */
const paymentIntentForJob = async (req, res, next) => {
  try {
    const { amount, currency, jobId } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency || "usd",
      automatic_payment_methods: {
        enabled: true,
      },
      transfer_group: jobId,
    });

    const transaction = await Transaction.findOne({ job: jobId }).exec();
    transaction.paymentIntentId = paymentIntent.id;
    await transaction.save();

    res.status(200).json({
      status: "OK",
      data: { client_secret: paymentIntent.client_secret },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 *
 * * This method is for the Admin to send money to the freelancer
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns
 *
 */
const transferToFreelancer = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    let { jobId } = req.body;
    let amount = 0;
    let currency = "usd";
    let platformCharge = 0;

    const charge = await Charge.findOne({}).lean().exec();

    if (!charge) throw new BadRequest("No charge found");

    const jobData = await Job.findOne({ _id: jobId })
      .select("freelancer budget status")
      .lean()
      .exec();

    if (!jobData) throw new BadRequest("Job not found");

    if (jobData.status !== "completed")
      throw new BadRequest("Job not completed");

    //freelancers account Data
    const accountData = await findOrCreateConnectedAccount(jobData.freelancer);

    platformCharge = (jobData.budget * charge.platformCharge) / 100;
    amount = jobData.budget - charge;

    const transfer = await stripe.transfers.create({
      amount: amount,
      currency: currency,
      destination: accountData.accountId,
      transfer_group: jobId,
    });

    if (!transfer) throw new BadRequest("Transfer failed");

    await session.commitTransaction();

    res.status(200).json({
      status: "OK",
      data: transfer,
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
 * * This method is for the Admin to retrieve the total amount of money in the platform
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns
 */
const payout = async (req, res, next) => {
  try {
    const { amount, currency } = req.body;
    const payout = await stripe.payouts.create({
      amount,
      currency,
    });

    res.status(200).json({
      status: "OK",
      data: payout,
    });
  } catch (err) {
    return next(err);
  }
};

const accountStatus = async (req, res, next) => {
  try {
    const { accountId = "acct_1N9aVCE1ITTDe3g9" } = req.body;
    const account = await stripe.accounts.retrieve(accountId);

    res.status(200).json({
      status: "OK",
      data: account,
    });
  } catch (err) {
    return next(err);
  }
};


/**
 * 
 * This method is for freelancers to see their balance and pending balance
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns
 * 
  */
 const balance = async (req, res, next) => {
  try{

    const {_id} = req.user._id;
    let released = 0;
    let clearence = 0;
    const userStripe = await UserStripe.findOne({ user: _id }).lean().exec();
    
    if(!userStripe) throw new BadRequest("User's data not found")

    const {accountId, pendingBalance} = userStripe;

    const data = await stripe.balance.retrieve({
      stripeAccount: accountId
    });

    if(!data) throw new BadRequest("No data found")

    const {available, pending} = data;

    available.forEach((item) => {
      released += item.amount;
    });

    //Pending balance from stripe side not the application so should this be counted as released ?
    pending.forEach((item) => {
      released += item.amount;
    });

    //Pending balance from application side
    clearence = pendingBalance;

    res.status(200).json({
      status: "OK",
      data: {
        released,
        clearence
      }
    });

  }catch(err){
    return next(err)
  }
 }






export default {
  createAccountLink,
  paymentIntent,
  paymentIntentForJob,
  payout,
  accountStatus,
  balance,
};
