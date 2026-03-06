import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const sendOTPEmail = async (email, name, otp) => {
    const mailOptions = {
        from:
            process.env.EMAIL_FROM ||
            "Smart Trip Planner <noreply@smarttrip.com>",
        to: email,
        subject: "Verify your email - Smart Trip Planner",
        html: `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><title>Email Verification</title></head>
    <body style="font-family: Arial, sans-serif; background:#f4f4f4; padding:30px;">
      <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
        <h2 style="color:#6366f1;text-align:center;">✈️ Smart Trip Planner</h2>
        <h3 style="color:#1f2937;text-align:center;">Verify Your Email</h3>
        <p style="color:#4b5563;">Hi ${name},</p>
        <p style="color:#4b5563;">Use the OTP below to verify your email. It expires in 10 minutes.</p>
        <div style="text-align:center;margin:24px 0;">
          <span style="background:#6366f1;color:#fff;font-size:32px;font-weight:bold;letter-spacing:8px;padding:16px 32px;border-radius:8px;display:inline-block;">${otp}</span>
        </div>
        <p style="color:#9ca3af;font-size:13px;text-align:center;">If you didn't request this, please ignore this email.</p>
      </div>
    </body>
    </html>
    `,
    };
    await transporter.sendMail(mailOptions);
};

export const sendTripInviteEmail = async (
    email,
    inviterName,
    tripTitle,
    inviteCode
) => {
    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: `${inviterName} invited you to "${tripTitle}"`,
        html: `
    <div style="font-family: Arial, sans-serif; max-width:480px;margin:0 auto;padding:32px;">
      <h2 style="color:#6366f1;">You're invited! ✈️</h2>
      <p><strong>${inviterName}</strong> invited you to join the trip: <strong>${tripTitle}</strong></p>
      <p>Use invite code: <strong style="font-size:20px;letter-spacing:4px;">${inviteCode}</strong></p>
      <a href="${process.env.CLIENT_URL}/join?code=${inviteCode}"
         style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px;">
        Join Trip
      </a>
    </div>
    `,
    };
    await transporter.sendMail(mailOptions);
};
