import mongoose from "mongoose";

const chargeSchema = new mongoose.Schema({

    platformCharge:{
        type:Number,
        default:0
    }

});

const Charge = mongoose.model("Charge",chargeSchema);

export default Charge;