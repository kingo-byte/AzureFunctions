const { app } = require("@azure/functions");
const nodemailer = require("nodemailer");
const { CosmosClient } = require("@azure/cosmos");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const dbName = "az204-db";
const containerName = "az204-container";

const client = new CosmosClient(process.env.CosmosDB);
const container = client.database(dbName).container(containerName);

app.cosmosDB("UserRegistrationCosmos", {
  connectionStringSetting: "CosmosDB",
  databaseName: dbName,
  containerName: containerName,
  createLeaseContainerIfNotExists: true,
  handler: async (documents, context) => {
    const newUsers = documents.filter((user) => !user.isGreeted);

    if (newUsers.length === 0) {
      context.log("No new users to greet");
      return;
    }

    await Promise.all(
      newUsers.map(async (user) => {
        const mailOptions = {
          from: process.env.GMAIL_USER,
          to: user.email,
          subject: "Welcome!",
          text: `Hi ${user.name}, welcome! Your registration was successful.`,
        };

        await transporter.sendMail(mailOptions);

        await container
          .item(user.id, user.id)
          .patch([{ op: "add", path: "/isGreeted", value: true }]);

        context.log(`User ${user.email} greeted and flagged`);
      }),
    );
  },
});
