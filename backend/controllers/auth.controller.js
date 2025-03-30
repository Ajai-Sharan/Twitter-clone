import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import generateTokenAndSetCookie from "../lib/util/generateTokenAndSetCookie.js";


export const signupController = async (req, res) => {

    try {

        const {fullname, username, email, password} = req.body;

        const emailRegex = /\S+@\S+\.\S+/;

        if (!emailRegex.test(email)) {
            return res.status(400).json({error : "Invalid email"})
        }

        const existingUser = await User.findOne({username:username});

        if (existingUser) {
            return res.status(400).json({error : "Username already exists"})
        }

        const existingEmail = await User.findOne({email:email});

        if(existingEmail){
            return res.status(400).json({error : "Email already exists"})
        }

        if(password.length < 6){
            return res.status(400).json({error : "Password must be atleast 6 characters long"})
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            fullname : fullname,
            username : username,
            email : email,
            password : hashedPassword,
        });

        if(newUser){

            generateTokenAndSetCookie(newUser._id, res);
            await newUser.save();

            return res.status(201).json({
                _id : newUser._id,
                fullname : newUser.fullname,
                username : newUser.username,
                email : newUser.email,
                followers : newUser.followers,
                following : newUser.following,
                profileImg : newUser.profileImg,
                coverImg : newUser.coverImg,
            })
        }   
        else{
            return res.status(400).json({error : "Invalid data"})
        }

    } catch (error) {
        console.log(`Error from signupController : ${error}`);
        return res.status(500).json({error : "Internal server error"})
    }

}

export const loginController = async (req, res) => {
    
    try {

        const {username , password} = req.body;

        const user = await User.findOne({username:username});
    
        if(user){
    
            const isPasswordValid = await bcrypt.compare(password, user.password);
    
            if(isPasswordValid){
    
                generateTokenAndSetCookie(user._id, res);
    
                return res.status(200).json({
                    _id : user._id,
                    fullname : user.fullname,
                    username : user.username,
                    email : user.email,
                    followers : user.followers,
                    following : user.following,
                    profileImg : user.profileImg,
                    coverImg : user.coverImg,
                })
            }
            else{
                console.log( `password : ${password} invalid password` );
                return res.status(400).json({error : "Invalid credentials"})
            }
        }
        else{
            console.log( `username : ${username} invalid username`);
            return res.status(400).json({error : "Invalid credentials"})
        }
        
    } catch (error) {
        console.log(`Error from loginController : ${error}`);
        return res.status(500).json({error : "Internal server error"})
        
    }
}

export const logoutController = (req, res) => {
    try {
        res.cookie("jwt", "", {maxAge : 0});
        res.status(200).json({message : "Logged out successfully"})
    } catch (error) {
        console.log(`Error from logoutController : ${error}`);
        return res.status(500).json({error : "Internal server error"})
    }
}

export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password");
        return res.status(200).json(user)
    } catch (error) {
        console.log(`Error from getMe : ${error}`);
        return res.status(500).json({error : "Internal server error"})
    }
}