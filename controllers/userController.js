import NotFound from "../errors/notFound.js";
import User from "../models/user.js";
import Job from "../models/job.js";

/**
 *
 * * This function is used to get the profile of the user
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns
 */
const getProfile = async (req, res, next) => {
  try {
    const { _id } = req.user;
    const user = await User.findById(_id).select(
      "-password -isDleted -createdAt -updatedAt -__v"
    );
    if (!user) {
      throw new NotFound("User not found");
    }
    return res.status(200).json({
      status: "OK",
      data: user,
    });
  } catch (err) {
    return next(err);
  }
};

// ///get total numberof jobs and total number of users
// const getStats = async (req, res, next) => {
//   try {
//     const totalJobs = await Job.countDocuments({
//       status: { $nin: ["draft", "cancelled"] },
//     });
//     const totalUsers = await User.countDocuments();
//     return res.status(200).json({
//       status: "OK",
//       data: {
//         totalJobs,
//         totalUsers,
//       },
//     });
//   } catch (err) {
//     return next(err);
//   }
// };

const updateProfile = async (req, res, next) => {
  try {
    let { _id } = req.user;

    let user = await User.findByIdAndUpdate(
      _id,
      {
        ...req.body,
      },
      {
        new: true,
      }
    ).select("-password -__v").lean()

    return res.status(200).json({
      status: "OK",
      data: user,
    });
  } catch (err) {
    return next(err);
  }
};




export default {
  getProfile,
  // getStats,
  updateProfile,
};
