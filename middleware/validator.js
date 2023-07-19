import {body, check, matchedData, validationResult} from "express-validator";


//some common validators
const commonValaidators = {
    name: body("name").isString().withMessage("Name should be a string").bail().isLength({min: 3}).withMessage("Name must be at least 3 characters long").bail().notEmpty().withMessage("Name is required"),
    email: body("email").isEmail().withMessage("Email is not valid").bail().notEmpty().withMessage("Email is required"),
    password: body("password").isString().withMessage("Password should be a string").bail().isLength({min: 8}).withMessage("Password must be at least 8 characters long").notEmpty().withMessage("Password is required"),
    newPassword: body("newPassword").isString().withMessage("Password should be a string").bail().isLength({min: 8}).withMessage("Password must be at least 8 characters long").notEmpty().withMessage("Password is required"),
    phoneNumber: body("phoneNo").isString().withMessage("Phone number should be a String").bail().notEmpty().withMessage("Phone number is required"),
    avatar:body('avatar').isString().withMessage("avatar name should be a string").bail().notEmpty().withMessage("avatar name cannot be empty"),

}

const paginationValidator = ()=>{
    return [
        body('cursor').optional().isString().withMessage("cursor should be an _id string").bail().notEmpty().withMessage("cursor cannot be empty"),
        body('limit').optional().isNumeric().withMessage("limit should be a number"),
        body('filter').optional().isObject({strict:true}),
        body('filter.name').optional().isString().withMessage("Name can only be string").bail().notEmpty().withMessage("name field cannot be empty")
    ]
}

const userIdValidatior = ()=>{
    return [
        body('userId').isString().withMessage("Should be an _id string").bail().notEmpty().withMessage("userId cannot be empty")
    ]
}






//--------------------auth Route validators--------------------

//validators for signup
const signupValidators = ()=>{
    return [
        commonValaidators.name,
        commonValaidators.email,
        commonValaidators.password,
        commonValaidators.phoneNumber,
        // body("interests").isArray({min:1}).withMessage("Interests should be an array").bail().notEmpty().withMessage("Interests cannot be empty"),
        // body("role").isString().withMessage("Role should be a string").bail().notEmpty().withMessage("Role cannot be empty").isIn(["Buyer","Freelancer"]).withMessage("Role should be either Buyer or Freelancer"),
        // body("companyName").optional().isString().withMessage("Company name should be a string").bail().notEmpty().withMessage("Company name cannot be empty"),
        // body("designation").optional().isString().withMessage("Designation should be a string").bail().notEmpty().withMessage("Designation cannot be empty"),
        // body("avatar").optional().isString().withMessage("avatar name should be a string").bail().notEmpty().withMessage("avatar name cannot be empty"),
        
    ]
}

//validators for login
const loginValidators = ()=>{
    return [
        commonValaidators.email,
        commonValaidators.password
    ]
}

//validator for refresh token
const refreshTokenValidators = ()=>{
    return [
        body("refreshToken").isString().withMessage("Refresh token should be a string").bail().notEmpty().withMessage("Refresh token is required")
    ]
}

//onboarding validator
const onBoardingValidator = ()=>{
    return [
        body("role").isString().withMessage("Role should be a string").bail().notEmpty().withMessage("Role cannot be empty").isIn(["Buyer","Freelancer"]).withMessage("Role should be either Buyer or Freelancer"),
        body("companyName").optional().isString().withMessage("Company name should be a string").bail().notEmpty().withMessage("Company name cannot be empty"),
        body("designation").optional().isString().withMessage("Designation should be a string").bail().notEmpty().withMessage("Designation cannot be empty"),
        check('interests').if(body('role').equals('Buyer')).isArray({min:1}).withMessage("Interests should be an array").bail().notEmpty().withMessage("Interests cannot be empty"),
        check('skills').if(body('role').equals('Freelancer')).isArray({min:1}).withMessage("Skills should be an array").bail().notEmpty().withMessage("Skills cannot be empty"),
        body("avatar").optional().isString().withMessage("avatar name should be a string").bail().notEmpty().withMessage("avatar name cannot be empty"),
        body("bio").isString().withMessage("Bio should be a string").bail().notEmpty().withMessage("Bio cannot be empty"),
        body('title').isString().withMessage("Title should be a string").bail().notEmpty().withMessage("Title cannot be empty"),
        body('background').isString().withMessage("Background should be a string").bail().notEmpty().withMessage("Background cannot be empty"),
        body('location').optional().isString().withMessage("Location should be a string").bail().notEmpty().withMessage("Location cannot be empty"),
    ]
}

//---------------------- job Route validators ------------------
const createJob = ()=>{
    return[
        body("title").isString().withMessage("Title should be a string").bail().notEmpty().withMessage("Title cannot be empty"),
        body("description").isString().withMessage("Description should be a string").bail().notEmpty().withMessage("Description cannot be empty"),
        body("requestedDays").isNumeric().withMessage("Days should be a number").bail().notEmpty().withMessage("Days cannot be empty"),
        body("requestedBudget").isNumeric().withMessage("Price should be a number").bail().notEmpty().withMessage("Price cannot be empty"),
        body("category").isString().withMessage("Category should be a string").bail().notEmpty().withMessage("Category cannot be empty"),
        body("subCategory").isString().withMessage("Category should be a string").bail().notEmpty().withMessage("Category cannot be empty"),
        body("files").optional().isArray().withMessage("Files should be an array").bail().notEmpty().withMessage("Files cannot be empty"),
        check("files.*.name").if(body("files").exists()).isString().withMessage("File name should be a string").bail().notEmpty().withMessage("File name cannot be empty"),
        check("files.*.format").if(body("files").exists()).isString().withMessage("File format should be a name in string").bail().notEmpty().withMessage("File format cannot be empty"),
        check("files.*.size").if(body("files").exists()).isNumeric().withMessage("File size should be in numbers").bail().notEmpty().withMessage("File size cannot be empty")

    ]
}


const deliverJob = ()=>{
    return [
        body("files").isArray().withMessage("Files should be an array").bail().notEmpty().withMessage("Files cannot be empty"),
        check("files.*.name").if(body("files").exists()).isString().withMessage("File name should be a string").bail().notEmpty().withMessage("File name cannot be empty"),
        check("files.*.format").if(body("files").exists()).isString().withMessage("File format should be a name in string").bail().notEmpty().withMessage("File format cannot be empty"),
        body("note").isString().withMessage("Note should be a string").bail().notEmpty().withMessage("Note cannot be empty"),
    ]
}

const reviewJob = ()=>{
    return [
        body("rating").isInt({min:1,max:5}).withMessage("Rating should be a number between 1 and 5").bail().notEmpty().withMessage("Rating cannot be empty"),
        body("comment").optional().isString().withMessage("Review should be a string").bail().notEmpty().withMessage("Review cannot be empty"),
    ]
}

const updateJobStatus = ()=>{
    return[
        body("status").isString().withMessage("Status should be a string").bail().notEmpty().withMessage("Status cannot be empty").isIn(["cancelled","completed","disputed","inprogress"]).withMessage("Status should be either cancelled, completed or disputed"),
        check("disputeDescription").if(body("status").equals("disputed")).isString().withMessage("Dispute description should be a string").bail().notEmpty().withMessage("Dispute description cannot be empty"),

    ]
}



//---------------------- freelancer Route validators ------------------
const updateFreelancerProfile = ()=>{
    return [
        body("designation").optional().isString().withMessage("designation should be a string").bail().notEmpty().withMessage("designation cannot be empty"),
        body("companyName").optional().isString().withMessage("companyName should be a string").bail().notEmpty().withMessage("companyName cannot be empty"),
        body("skills").optional().isArray({min:1}).withMessage("skills should be an array").bail().notEmpty().withMessage("skills cannot be empty"),
        body("avatar").optional().isString().withMessage("avatar name should be a string").bail().notEmpty().withMessage("avatar name cannot be empty"),
    ]
}

//---------------------- user Route validators ------------------
const updateUserProfile = ()=>{
    return [
        body("interests").optional().isArray({min:1}).withMessage("interests should be an array").bail().notEmpty().withMessage("interests cannot be empty"),
        body("skills").optional().isArray({min:1}).withMessage("skills should be an array").bail().notEmpty().withMessage("skills cannot be empty"),
        body("avatar").optional().isString().withMessage("avatar name should be a string").bail().notEmpty().withMessage("avatar name cannot be empty"),
        body("name").optional().isString().withMessage("name name should be a string").bail().notEmpty().withMessage("name name cannot be empty"),
        body("bio").optional().isString().withMessage("bio name should be a string").bail().notEmpty().withMessage("bio name cannot be empty"),
        body("title").optional().isString().withMessage("title name should be a string").bail().notEmpty().withMessage("title name cannot be empty"),
        body("background").optional().isString().withMessage("background name should be a string").bail().notEmpty().withMessage("background name cannot be empty"),
        body("location").optional().isString().withMessage("location name should be a string").bail().notEmpty().withMessage("location name cannot be empty"),
        body("companyName").optional().isString().withMessage("companyName name should be a string").bail().notEmpty().withMessage("companyName name cannot be empty"),
        body("designation").optional().isString().withMessage("designation name should be a string").bail().notEmpty().withMessage("designation name cannot be empty"),
    ]
}






//---------------------- bid Route validators ------------------
const updateBidStatus = ()=>{
    return [
        body("status").isString().withMessage("Status should be a string").bail().notEmpty().withMessage("Status cannot be empty").isIn(["accepted","rejected"]).withMessage("Status should be either accepted, rejected or pending")
    ]
}

const createBid = ()=>{
    return[
        body("description").optional().isString().withMessage("description should be a string").notEmpty().withMessage("description cannot be empty"),
        body("budget").isInt().withMessage("budget should be a number").bail().notEmpty().withMessage("budget should not be empty"),
        body("days").isInt().withMessage("days should be a number").bail().notEmpty().withMessage("days should not be empty")
    ]
}




const validate = (req,res,next)=>{
    const errors = validationResult(req);
    if(errors.isEmpty()){
        //only add data that is validated so no unexpected data will be passed to the api through body
        req.body = matchedData(req); 
        return next();
    }
    const extractedErrors = [];
    errors.array().map(err => extractedErrors.push({[err.param]: err.msg}));
    return res.status(422).json({
        status:"ERROR",
        errors: extractedErrors,
    });
};


export {
    signupValidators,
    loginValidators,
    refreshTokenValidators,
    createJob,
    updateJobStatus,
    updateBidStatus,
    createBid,
    deliverJob,
    reviewJob,
    updateFreelancerProfile,
    updateUserProfile,
    onBoardingValidator,
    validate,
}
