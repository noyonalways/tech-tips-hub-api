import nodemailer from "nodemailer";
import config from "../config";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: config.NODE_ENV === "production",
  auth: {
    user: config.smtp_auth_user,
    pass: config.smtp_auth_password,
  },
});

type TSendEmail = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

const sendEmail = async ({ to, subject, text, html }: TSendEmail) => {
  try {
    // send mail with defined transport object
    await transporter.sendMail({
      from: config.nodemailer_email_from,
      to, // list of receivers
      subject,
      text,
      html,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error);
  }
};

export default sendEmail;
