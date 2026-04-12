const { app } = require("@azure/functions");
const { CosmosClient } = require("@azure/cosmos");
const { randomUUID } = require("crypto");

const client = new CosmosClient(process.env.CosmosDB);
const container = client.database("az204-db").container("az204-container");

app.storageQueue("UserRegistrationQueue", {
  queueName: "user-registration-queue",
  connection: "AzureWebJobsStorage",
  handler: async (queueItem, context) => {
    console.log("received the following users to be registered:", queueItem);

    const user = queueItem;

    context.log(`Processing user: ${user.email}`);

    const newUser = {
      id: randomUUID(),
      name: user.name,
      email: user.email,
      age: user.age,
      registeredAt: new Date().toISOString(),
      isGreeted: false,
    };

    await container.items.create(newUser);

    context.log(`Finished proccessing user: ${user.email}`);
  },
});
