const { app, output } = require("@azure/functions");

const queueOutput = output.storageQueue({
  queueName: "user-registration-queue",
  connection: "AzureWebJobsStorage",
});

app.http("UserRegistrationHttp", {
  methods: ["POST"],
  authLevel: "anonymous",
  extraOutputs: [queueOutput],
  handler: async (request, context) => {
    const body = await request.json();

    //added the new user to the queue for processing
    context.extraOutputs.set(queueOutput, JSON.stringify(body));

    context.log(`User registration received for: ${body.email}`);

    return { status: 201, body: "Registration received!" };
  },
});
