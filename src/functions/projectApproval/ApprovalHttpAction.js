const { app } = require("@azure/functions");
const df = require("durable-functions");

app.http("ApprovalHttpAction", {
  methods: ["GET"],
  authLevel: "anonymous",
  extraInputs: [df.input.durableClient()],
  handler: async (request, context) => {
    // Get parameters from URL
    const instanceId = request.query.get("instanceId");
    const decision = request.query.get("decision");
    const role = request.query.get("role");

    // Validate parameters
    if (!instanceId || !decision || !role) {
      return {
        status: 400,
        body: "Missing required parameters: instanceId, decision, role",
      };
    }

    if (decision !== "approved" && decision !== "rejected") {
      return {
        status: 400,
        body: "Decision must be either 'approved' or 'rejected'",
      };
    }

    // Get durable client
    const client = df.getClient(context);

    // Check if orchestration is still running
    const status = await client.getStatus(instanceId);

    if (!status) {
      return {
        status: 404,
        body: "Workflow not found. It may have already been completed.",
      };
    }

    if (
      status.runtimeStatus !== "Running" &&
      status.runtimeStatus !== "Pending"
    ) {
      return {
        status: 400,
        body: `Workflow is already ${status.runtimeStatus}. No action needed.`,
      };
    }

    // Send the external event to the orchestrator
    const eventName = role === "manager" ? "ManagerResponse" : "OwnerResponse";

    await client.raiseEvent(instanceId, eventName, {
      decision: decision,
      decidedBy: role,
      decidedAt: new Date().toISOString(),
    });

    context.log(`${role} ${decision} project. Instance: ${instanceId}`);

    // Return a nice HTML response
    const isApproved = decision === "approved";
    return {
      status: 200,
      headers: { "Content-Type": "text/html" },
      body: `
        <html>
          <body style="font-family:Arial;text-align:center;padding:50px;">
            <h1>${isApproved ? "✅ Approved!" : "❌ Rejected!"}</h1>
            <p>You have <strong>${decision}</strong> the project.</p>
            <p>The employee will be notified shortly.</p>
            <p style="color:gray;font-size:12px;">Decision recorded at: ${new Date().toISOString()}</p>
          </body>
        </html>
      `,
    };
  },
});
