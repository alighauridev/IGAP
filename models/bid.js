import mongoose from "mongoose";

const bidSchema = new mongoose.Schema({
    job:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"JOB",
        required:true
    },
    freelancer:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    status:{
        type:String,
        enum:["accepted","rejected","pending"],
        default:"pending"
    },
    description:{
        type:String,
    },
    budget:{
        type:Number,
        required:true
    },
    days:{
        type:Number,
        required:true,
    }
},{
    timestamps:true
});

const Bid = mongoose.model("Bid",bidSchema);

export default Bid;