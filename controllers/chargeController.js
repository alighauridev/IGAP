//models import 
import Charge from "../models/charge.js";



/**
 * 
 * 
 * * This method is used to update the charge
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns
 * 
*/
const updateCharge = async (req,res,next)=>{
    try{

        let {charge} = req.body;
        const response = await Charge.findOneAndUpdate({},{platformCharge:charge},{new:true,upsert:true}).exec();
        if(!response) throw new Error("Something went wrong");
        res.status(200).setHeader("Content-Type","application/json").json({
            status:"OK",
            data:response
        });

    }catch(err){
        return next(err);
    }
}


export default {updateCharge};