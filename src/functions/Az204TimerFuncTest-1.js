const { app } = require("@azure/functions");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

app.timer("Az204TimerFuncTest-1", {
  schedule: "0 0 5 * * *",
  handler: async (myTimer, context) => {
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: process.env.GMAIL_RECEIVER,
      subject: "Azure Reminder!",
      text: "Remember to stay focused and keep working towards your goals!",
    };

    await transporter.sendMail(mailOptions);
    context.log("Email sent successfully");
  },
});
