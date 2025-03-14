import mongoose from "mongoose";

const connectMongoDB = async () => {

    try {

        const conn = await mongoose.connect(process.env.MONGO_URI)
        console.log(`connection host : ${conn.connection.host}`);
        
        
    } catch (error) {
        console.error(`Error from connecting Mongo DB : ${error}`)
    }

}

export default connectMongoDB