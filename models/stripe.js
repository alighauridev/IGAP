import mongoose from "mongoose";


const stripeSchema = new mongoose.Schema({
    user:{
        type:mongoose.Types.ObjectId,
        required:true,
        unique:true,
    },
    customerId:{
        type:String,
    },
    accountId:{
        type:String,
    },
    balance:{
        type:Number,
        default:0,
    },
    pendingBalance:{
        type:Number,
        default:0,
    }
},{
    timestamps:true,
});

const Stripe = mongoose.model('Stripe',stripeSchema);

export default Stripe;

