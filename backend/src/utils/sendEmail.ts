import nodemailer from "nodemailer"
import logger from "./logger";

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com", 
    port: 587,
    secure: false,
    auth: {
        user: process.env.FROM_EMAIL,
        pass: process.env.FROM_PASSWORD,
    },
});

const sendMail = async (to: string, subject: string, html: string) => {
    
    try {
        await transporter.sendMail({
            from: process.env.FROM_EMAIL,
            to: to, 
            subject: subject,
            html: html,
        });
    } catch (error) {
        logger.error({ type: "Email Error", error })
    }
}

export default sendMail;