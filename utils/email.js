const nodemailer = require("nodemailer");
const sendEmail =async options =>{
    //1) Create a transporter
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth:{
            user:process.env.EMAIL_USER,
            pass:process.env.EMAIL_PASS
        }
    });
    //2)Define the mail options
    const mailOptions ={
        from:"Aman jain <aman29j2001@gmail.com>",
        to:options.email,
        subject:options.subject,
        text:options.message
    }
    //)actually send the email
    await transporter.sendMail(mailOptions);
}
module.exports= sendEmail;