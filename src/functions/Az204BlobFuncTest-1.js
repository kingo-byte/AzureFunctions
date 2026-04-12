const { app } = require("@azure/functions");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

app.storageBlob("Az204BlobFuncTest-1", {
  path: "az204-blob/{name}",
  connection: "AzureWebJobsStorage",
  handler: async (blob, context) => {
    const fileName = context.triggerMetadata.name;
    const fileSize = blob.length;

    context.log(`Blob detected: "${fileName}", Size: ${fileSize} bytes`);

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: process.env.GMAIL_USER,
      subject: "New File Uploaded!",
      text: `A new file has been uploaded.\n\nFile Name: ${fileName}\nFile Size: ${fileSize} bytes`,
      attachments: [
        {
          filename: fileName,
          content: Buffer.from(blob),
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    context.log("Email sent successfully");
  },
});
