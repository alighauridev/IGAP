

//errors import
import NotFound from "../errors/notFound.js";
import BadRequest from "../errors/badRequest.js";

//models import
import Job from "../models/job.js";
import Transaction from "../models/transaction.js";
import User from "../models/user.js";




/**
 * 
 * * This method returns all the stats of the website
 * @param {Request} req 
 * @param {Response} res 
 * @param {NextFunction} next 
 * @returns 
 */
const getStats = async (req,res,next)=>{
    try{
        
        const jobStats = await Job.aggregate([
            {
                $group:{
                    _id:null,
                    totalJobs:{$sum:1},
                    completedJobs:{$sum:{$cond:[{$eq:["$status","completed"]},1,0]}},
                    cancelledJobs:{$sum:{$cond:[{$eq:["$status","cancelled"]},1,0]}},
                    disputedJobs:{$sum:{$cond:[{$eq:["$status","disputed"]},1,0]}},
                }
            }
        ]);

        const paymentStats = await Transaction.aggregate([
            {
                $group:{
                    _id:null,
                    totalEarnings:{$sum:"$platformCharge"},
                    totalTransactions:{$sum:"$amount"},
                }
            }
        ]);

        const userStats = await User.aggregate([
            {
                $group:{
                    _id:null,
                    totalUsers:{$sum:1},
                    totalFreelancers:{$sum:{$cond:[{$eq:["$role","Freelancer"]},1,0]}},
                    totalBuyers:{$sum:{$cond:[{$eq:["$role","Buyer"]},1,0]}},
                }
            }
        ]);

        const stats = {
            ...jobStats[0],
            ...paymentStats[0],
            ...userStats[0],
        };

        res.status(200).json({
            status:"OK",
            data:stats,
        });


    }catch(err){
        return next(err);
    }
}




export default {
    getStats,

}