import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";


export const getUserProfile = async (req, res) => {
    try {
        const {username} = req.params;
        const user = await User
            .findOne({ username: username })
            .select("-password")
        if (user) {
            return res.status(200).json(user);
        }
        else { 
            return res.status(404).json({ error: "User not found" });
        }
    }
    catch (error) {
        console.log(`Error from getUserProfile : ${error}`);
        return res.status(500).json({ error: "Internal server error" });
    }
}
export const followUnfollowUser = async (req, res) => {
    try {

        const { id } = req.params;

        const user = await User.findById(req.user._id);
        const userToFollow  = await User.findById(id);
        
        if(req.user._id.toString() === id) {
            return res.status(400).json({ error: "You can't follow/unfollow yourself" });
        }

        if(!user){
            return res.status(404).json({error : "User not found"})
        }

        if(!userToFollow){
            return res.status(404).json({error : "User to follow not found"})
        }

        const isFollowing = user.following.includes(id);

        if(isFollowing){
            await User.findByIdAndUpdate(req.user._id, { $pull: { following: id } });
            await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } });
            res.status(200).json({ message: "User Unfollowed successfully" });
        }
        else{
            await User.findByIdAndUpdate(req.user._id, { $push: { following: id } });
            await User.findByIdAndUpdate(id, { $push: { followers: req.user._id } });

            const notification = await new Notification({
                from : req.user._id,
                to :   userToFollow._id,
                type : "follow",
                read : false
            });

            await notification.save();

            res.status(200).json({ message: "User Followed successfully" });
        }

    }
    catch (error) {
        console.log(`Error from followUnfollowUser : ${error}`);
        return res.status(500).json({ error: "Internal server error" });
    }
}
export const getSuggestedProfile = async (req, res) => {
    try {

        const userId = req.user._id;

        const usersFollowedByMe = await User.findById(userId).select("following");


        const user = await User.findById(req.user._id);

        const users = await User.aggregate([
            { $match: { 
                _id: { $ne: userId } 
            } },
            { $sample: { size: 10 } }
        ]);

        const filteredUsers = users.filter((user) => {
            return !usersFollowedByMe.following.includes(user._id);
        });

        const suggestedUsers = filteredUsers.slice(0, 4);

        suggestedUsers.forEach((user) => {
            user.password = null;
        });

        res.status(200).json(suggestedUsers);
    }
    catch (error) {
        console.log(`Error from getSuggestedProfile : ${error}`);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export const userProfileUpdate = async (req, res) => {
    try {
        const {fullname, email, username, currentPassword, newPassword, bio, link} = req.body;
        let {profileImag, coverImg} = req.body;

        const userId = req.user._id;

        const user = await User.findById(userId);

        if(!user){
            return res.status(404).json({error : "User not found"})
        }

        if((currentPassword && !newPassword) || (!currentPassword && newPassword)){
            return res.status(400).json({error : "Please provide both current and new password"})
        }

        if(currentPassword && newPassword){

            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if(!isMatch){
                return res.status(400).json({error : "current Password is invalid"})
            }
            if(newPassword.length < 6){
                return res.status(400).json({error : "New Password must be atleast 6 characters long"})
            }

            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
        } 

        if(profileImag){
            if(user.profileImg){
                const publicId = user.profileImg.split("/").pop().split(".")[0];
                await cloudinary.uploader.destroy(publicId);
            }
            const uploadedResponse = await cloudinary.uploader.upload(profileImag);
            profileImag = uploadedResponse.secure_url;
        }
        if(coverImg){
            if(user.coverImg){
                const publicId = user.coverImg.split("/").pop().split(".")[0];
                await cloudinary.uploader.destroy(publicId);
            }
            const uploadedResponse = await cloudinary.uploader.upload(coverImg);
            coverImg = uploadedResponse.secure_url;
        }

        user.fullname = fullname || user.fullname;
        user.email = email || user.email;
        user.username = username || user.username;
        user.bio = bio || user.bio;
        user.link = link || user.link;
        user.profileImg = profileImag || user.profileImg;
        user.coverImg = coverImg || user.coverImg;

        await user.save();

        user.password = null;

        res.status(200).json({user : user});
        
    }
    catch (error) {
        console.log(`Error from userProfileUpdate : ${error}`);
        return res.status(500).json({ error: "Internal server error" });
    }
}