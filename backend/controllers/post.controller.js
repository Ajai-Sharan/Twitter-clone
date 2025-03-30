import Post from '../models/post.model.js';
import User from '../models/user.model.js';
import Notification from '../models/notification.model.js';
import { v2 as cloudinary } from 'cloudinary';


export const createPost = async (req, res) => {
    try {
        const { text } = req.body;
        let { img } = req.body;

        if(!text && !img){
            return res.status(400).json({error : "Please provide text or image"})
        }

        const userId = req.user._id.toString();

        const user = await User.findById(userId);

        if(!user){
            return res.status(404).json({error : "User not found"})
        }

        if(img){
            const uploadResponse = await cloudinary.uploader.upload(img);
            img = uploadResponse.secure_url;
        }

        user.password = null;

        const post = new Post({
            user: user,
            text,
            img,
        });

        await post.save();
        res.status(201).json(post);
    }
    catch (error) {
        console.log(`Error from createPost : ${error}`);
        return res.status(500).json({ error: "Internal server error" });
    }
}   

export const deletePost = async (req, res) => {
    try {
        const postId = req.params.id.toString();
        const post = await Post.findById(postId);

        if(!post){
            return res.status(404).json({error : "Post not found"})
        }

        if(post.user._id.toString() !== req.user._id.toString()){
            return res.status(401).json({error : "You are not authorized to delete this post"})
        }

        if(post.img){
            const publicId = post.img.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy(publicId);
        }

        await Post.findByIdAndDelete(postId);
        res.status(200).json({message : "Post deleted successfully"})
    }
    catch (error) {
        console.log(`Error from deletePost : ${error}`);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export const commentOnPost = async (req, res) => {
    try {
        const { text } = req.body;
        const postId = req.params.id;

        if(!text){
            return res.status(400).json({error : "Please provide text"})
        }

        const post = await Post.findById(postId);

        if(!post){
            return res.status(404).json({error : "Post not found"})
        }

        const comment = {
            text,
            user: req.user._id,
        }

        post.comments.push(comment);
        await post.save();
        res.status(201).json(post);
    }
    catch (error) {
        console.log(`Error from commentOnPost : ${error}`);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export const likeUnlikePost = async (req, res) => {
    try {
        const postId = req.params.id;
        const post = await Post.findById(postId);

        if(!post){
            return res.status(404).json({error : "Post not found"})
        }

        const isLiked = post.likes.includes(req.user._id);

        if(isLiked){
            await Post.findByIdAndUpdate(postId, { $pull: { likes: req.user._id } });
            await User.findByIdAndUpdate(req.user._id, { $pull: { likedPosts : postId } });
            res.status(200).json({ message: "Post unliked successfully" });
        }
        else{
            await Post.findByIdAndUpdate(postId, { $push: { likes: req.user._id } });
            await User.findByIdAndUpdate(req.user._id, { $push: { likedPosts : postId } });

            const notification = new Notification({
                from : req.user._id,
                to : post.user._id,
                type : "like",
                read : false
            });

            await notification.save();
            res.status(200).json({ message: "Post liked successfully" });
        }
    }
    catch (error) {
        console.log(`Error from likeUnlikePost : ${error}`);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export const getPosts = async (req, res) => {
    try {

        const posts = await Post.find().sort({createdAt : -1})
        .populate({
            path : "user",
            select : "-password"
        })
        .populate({
            path : "comments.user",
            select : "-password"
        });

        
        if(posts.length === 0){
            return res.status(200).json([]);
        }

        res.status(200).json(posts);
    }
    catch (error) {
        console.log(`Error from getPosts : ${error}`);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export const getLikedPosts = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId);

        if(!user){
            return res.status(404).json({error : "User not found"})
        }

        const likedPosts = await Post.find({ _id : { $in : user.likedPosts } })
        .populate({
            path : "user",
            select : "-password"
        })
        .populate({
            path : "comments.user",
            select : "-password"
        });
        
        // if(likedPosts.length === 0){
        //     return res.status(200).json([]);
        // }

        res.status(200).json(likedPosts);
    }

    catch (error) {
        console.log(`Error from getLikedPosts : ${error}`);
        return res.status(500).json({ error: "Internal server error" });
    }

}


export const getFollowingPosts = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if(!user){
            return res.status(404).json({error : "User not found"})
        }

        const followingPosts = await Post.find({ user : { $in : user.following } })
        .sort({createdAt : -1})
        .populate({
            path : "user",
            select : "-password"
        })
        .populate({
            path : "comments.user",
            select : "-password"
        });

        if(followingPosts.length === 0){
            return res.status(200).json([]);
        }

        res.status(200).json(followingPosts);
    }
    catch (error) {
        console.log(`Error from getFollowingPosts : ${error}`);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export const getUserPosts = async (req, res) => {

    try {
        const username = req.params.username;

        const user = await User.find({ username: username });

        if(!user){
            return res.status(404).json({error : "User not found"})
        }

        const posts = await Post.find({ user : user[0]._id })
        .sort({createdAt : -1})
        .populate({
            path : "user",
            select : "-password"
        })
        .populate({
            path : "comments.user",
            select : "-password"
        });

        if(posts.length === 0){
            return res.status(200).json([]);
        }

        res.status(200).json(posts);

    } catch (error) {
        console.log(`Error from getUserPosts : ${error}`);
        return res.status(500).json({ error: "Internal server error" });
        
    }

}
