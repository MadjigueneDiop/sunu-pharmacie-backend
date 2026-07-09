// import { Resend } from "resend";

// export const sendEmail = async (to, subject, text) => {
//   try {
//     if (!process.env.RESEND_API_KEY) {
//       throw new Error("RESEND_API_KEY manquante");
//     }

//     const resend = new Resend(process.env.RESEND_API_KEY);

//     const data = await resend.emails.send({
//       from: "SunuPharmacie <onboarding@resend.dev>",
//       to,
//       subject,
//       text,
//     });

//     console.log("📧 EMAIL SENT OK");
//     return data;

//   } catch (err) {
//     console.log("❌ EMAIL ERROR:", err.message);
//   }
// };

import dotenv from "dotenv";
dotenv.config();

import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendEmail = async (to, subject, text) => {
  try {
    await transporter.sendMail({
      from: `"SunuPharmacie" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    });

    console.log("Email envoyé");
  } catch (err) {
    console.error(err);
  }
};