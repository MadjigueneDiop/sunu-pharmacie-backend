import nodemailer from "nodemailer";

export const sendEmail = async (to, subject, text) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
   auth: {
  user: "madjiguened835@gmail.com",
  pass: "mbse glxf vwgj gkll"
}
  });

  await transporter.sendMail({
from: "SunuPharmacie <madjiguened835@gmail.com>",
    to,
    subject,
    text
  });
};