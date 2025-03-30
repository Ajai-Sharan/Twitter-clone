import jwt from 'jsonwebtoken';

const generateTokenAndSetCookie = (user_id, res) => {
    
    const token = jwt.sign({user_id}, process.env.JWT_SECRET, {
        expiresIn : "15d"
    });

    const options = {
        expires : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        httpOnly : true,
        sameSite: "Strict",
        secure: process.env.NODE_ENV === "production"
    }

    res.cookie("jwt", token, options);
}

export default generateTokenAndSetCookie;