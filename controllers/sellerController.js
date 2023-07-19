import User from "../models/user.js";
import Job from "../models/job.js";

//error imports
import BadRequest from "../errors/badRequest.js";
import NotFound from "../errors/notFound.js";
import mongoose from "mongoose";
import { pagination } from "../utils/reusable.js";

/**
 *
 * * This method returns all freelancers and their some stats mainly for buyer
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 *
 *
 */
const getFreelanceers = async (req, res, next) => {
  try {
    let { role, _id } = req.user;
    let paginationFilter = pagination(req.query);
    let cursorFilter = [];
    if (paginationFilter.cursor) {
      cursorFilter = [
        {
          $match: paginationFilter.cursor,
        },
      ];
    }
    let releveance = 0;
    let sort = {
      avgRating: -1,
    };

    // if the one who is requesting is a buyer then sort the freelancers according to the buyer's interests
    if (role === "Buyer") {
      let buyerInterests = await User.findById(_id).select("interests").lean();
      releveance = {
        $size: {
          $ifNull: [
            { $setIntersection: ["$skills.name", buyerInterests.interests] },
            [],
          ],
        },
      };
    }

    // get all the freelancers with their avg rating
    let freelancers = await User.aggregate([
      {
        $match: {
          role: "Freelancer",
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      ...cursorFilter,
      {
        $limit: parseInt(paginationFilter.limit+1),
      },
      {
        $lookup: {
          from: "jobs",
          localField: "_id",
          foreignField: "freelancer",
          as: "jobs",
        },
      },
      {
        $addFields: {
          avgRating: {
            $avg: "$jobs.review.rating",
          },
          intersectionSize: releveance,
        },
      },
      {
        $sort: { ...sort, intersectionSize: -1 },
      },
      {
        $project: {
          name: 1,
          email: 1,
          avatar: 1,
          bio: 1,
          title: 1,
          background: 1,
          avgRating: {
            $avg: "$jobs.review.rating",
          },
        },
      },
    ]);

    let hasNextPage = false;
    if (freelancers.length > paginationFilter.limit) {
      hasNextPage = true;
      console.log("BEFORE: ",freelancers.length);
      freelancers.pop();
      console.log("AFTER: ",freelancers.length);
    }

    console.log("HAS NEXT PAGE: ",hasNextPage);
    console.log("FREELANCERS: ",freelancers);

    return res.status(200).json({
      status: "OK",
      data: {freelancers,hasNextPage},
    });
  } catch (err) {
    return next(err);
  }
};

/**
 *
 * * This method gets the profile of a freelancer
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 *
 */
const getFreelancerProfile = async (req, res, next) => {
  try {
    let { freelancerId } = req.params;

    //convert the id to mongoose object id
    freelancerId = new mongoose.Types.ObjectId(freelancerId);

    const freelancer = await User.aggregate([
      {
        $match: {
          _id: freelancerId,
        },
      },
      {
        $lookup: {
          from: "jobs",
          let: { freelancerId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$freelancer", "$$freelancerId"] },
                    { $eq: ["$status", "completed"] },
                  ],
                },
              },
            },
            {
              $group: {
                _id: "$freelancer",
                jobs: { $push: "$$ROOT" },
              },
            },
          ],
          as: "jobs",
        },
      },
      {
        $project: {
          name: 1,
          email: 1,
          avatar: 1,
          designation: 1,
          companyName: 1,
          skills: 1,
          bio: 1,
          background: 1,
          title: 1,
          jobs: {
            $cond: {
              if: { $isArray: "$jobs" },
              then: { $arrayElemAt: ["$jobs.jobs", 0] },
              else: [],
            },
          },
          bio: 1,
          createdAt: 1,
          reviews: [],
          title: 1,
        },
      },
      {
        $project: {
          name: 1,
          email: 1,
          avatar: 1,
          designation: 1,
          companyName: 1,
          background: 1,
          skills: 1,
          avgRating: { $avg: "$jobs.review.rating" },
          completedJobs: {
            $cond: {
              if: { $isArray: "$jobs" },
              then: { $size: "$jobs" },
              else: 0,
            },
          },
          createdAt: 1,
          reviews: [],
          bio: 1,
          title: 1,
        },
      },
    ]);
    if (freelancer.length === 0) {
      throw new NotFound("Freelancer not found");
    }
    return res.status(200).json({
      status: "OK",
      data: freelancer[0],
    });
  } catch (err) {
    return next(err);
  }
};

/**
 *
 * This method allows a Freelancer to update his profile
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 *
 */
const updateFreelancerProfile = async (req, res, next) => {
  try {
    let { _id } = req.user;

    let freelancer = await User.findByIdAndUpdate(
      _id,
      {
        ...req.body,
      },
      {
        new: true,
      }
    )
      .select("-password -__v -emailVerified -authType -isDeleted -role")
      .lean();

    return res.status(200).json({
      status: "OK",
      data: freelancer,
    });
  } catch (err) {
    return next(err);
  }
};

export default {
  getFreelanceers,
  getFreelancerProfile,
  updateFreelancerProfile,
};
