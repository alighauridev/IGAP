import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({

    buyer:{
        type:mongoose.Types.ObjectId,
        required:true,
        ref:'User',
    },
    freelancer:{
        type:mongoose.Types.ObjectId,
        required:true,
        ref:'User',
    },
    job:{
        type:mongoose.Types.ObjectId,
        required:true,
        ref:'JOB',
    },
    amount:{
        type:Number,
        required:true,
    },
    platformCharge:{
        type:Number,
        required:true,
    },
    status:{
        type:String,
        enum:["inprocess","completed","failed"],
        default:"inprocess"
    },
    transferId:{
        type:String,
    },
    paymentIntentId:{
        type:String,
    }


},{
    timestamps:true,
});

const Transaction = mongoose.model("Transaction",transactionSchema);

export default Transaction;