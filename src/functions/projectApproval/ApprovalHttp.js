const { app } = require("@azure/functions");
const df = require("durable-functions");

app.http("ApprovalHttp", {
  methods: ["POST"],
  authLevel: "anonymous",
  extraInputs: [df.input.durableClient()],
  handler: async (request, context) => {
    const body = await request.json();

    if (!body.projectName || !body.employeeEmail || !body.managerEmail) {
      return {
        status: 400,
        body: "Missing required fields",
      };
    }

    const client = df.getClient(context);
    const instanceId = await client.startNew("ApprovalOrchestrator", {
      input: {
        projectName: body.projectName,
        employeeEmail: body.employeeEmail,
        managerEmail: body.managerEmail,
        ownerEmail: body.ownerEmail,
        description: body.description,
      },
    });

    return {
      status: 202,
      body: JSON.stringify({
        message: "Project proposal submitted successfully!",
        instanceId: instanceId,
      }),
    };
  },
});
