import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({

    name:{
        type:String,
        required:true,
        unique:true
    },
    subCategories:{
        type:[String],
        required:true
    }
},{
    timestamps:true
});

const CATEGORY = mongoose.model("CATEGORY",categorySchema);

export default CATEGORY;