import nodemailer from "nodemailer";

export const sendEmail = async (to, subject, text) => {
  console.log("📧 Tentative email vers :", to);

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // STARTTLS
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false, // 🔥 important sur Render
      },
    });

    console.log("✅ Transporter créé");

    const info = await transporter.sendMail({
      from: `"SunuPharmacie" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    });

    console.log("✅ EMAIL ENVOYÉ :", info.messageId);

    return info;

  } catch (err) {
    console.log("❌ EMAIL ERROR :", err);

    // 🔥 utile pour debug Render
    if (err.code) console.log("CODE:", err.code);
    if (err.command) console.log("COMMAND:", err.command);
  }
};