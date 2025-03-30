import express from "express"
import dotenv from "dotenv"
import connectMongoDB from "./db/connectMongoDB.js"
import cookieParser from "cookie-parser"

import userRoutes from "./routes/user.route.js"
import postRoutes from "./routes/post.route.js"
import authRoutes from "./routes/auth.route.js"
import notificationRoutes from "./routes/notification.route.js"

import {v2 as cloudinary} from "cloudinary"


dotenv.config();

cloudinary.config({
    cloud_name : process.env.COULDINARY_CLOUD_NAME,
    api_key : process.env.CLOUDINARY_API_KEY,
    api_secret : process.env.CLOUDINARY_API_SECRET
})

const app = express();
const PORT = process.env.PORT || 8000

app.use(express.json())
app.use(express.urlencoded({extended : true})) // to read the urlendcoded section of the request
app.use(cookieParser())

app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/posts", postRoutes)
app.use("/api/notification" , notificationRoutes)


app.listen(PORT, () => {
    console.log(`server is running in http://localhost:${PORT}`);  
    connectMongoDB();
})