import nodemailer from "nodemailer";

export const sendEmail = async (to, subject, text) => {
  console.log("📧 Tentative email vers :", to);

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "madjiguened835@gmail.com",
        pass: "mbse glxf vwgj gkll",
      },
    });

    console.log("✅ Transporter créé");

    const info = await transporter.sendMail({
      from: "SunuPharmacie <madjiguened835@gmail.com>",
      to,
      subject,
      text,
    });

    console.log("✅ EMAIL ENVOYÉ :", info);

  } catch (err) {
    console.log("❌ EMAIL ERROR :", err);
  }
};