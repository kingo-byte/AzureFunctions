const df = require("durable-functions");
const util = require("util");

if (!util.isDate) {
  util.isDate = (obj) => obj instanceof Date;
}

df.app.orchestration("ApprovalOrchestrator", function* (context) {
  context.log("createTimer type:", typeof context.df.createTimer);
  context.log("df keys:", Object.keys(context.df).join(", "));

  const input = context.df.getInput();

  // Step 1: Notify manager
  yield context.df.callActivity("SendManagerEmail", {
    to: input.managerEmail,
    projectName: input.projectName,
    employeeEmail: input.employeeEmail,
    description: input.description,
    instanceId: context.df.instanceId,
  });

  // Step 2: Wait for manager response with timeout
  const firstDeadline = context.df.createTimer(
    new Date(context.df.currentUtcDateTime.valueOf() + 30 * 1000),
  );

  const firstApprovalEvent = context.df.waitForExternalEvent("ManagerResponse");

  const firstResult = yield context.df.Task.any([
    firstApprovalEvent,
    firstDeadline,
  ]);

  // Step 3: If timeout send reminder
  if (firstResult === firstDeadline) {
    context.log("Manager did not respond - sending reminder");

    yield context.df.callActivity("SendReminderEmail", {
      to: input.managerEmail,
      projectName: input.projectName,
      instanceId: context.df.instanceId,
    });

    // Step 4: Wait again after reminder
    const secondDeadline = context.df.createTimer(
      new Date(context.df.currentUtcDateTime.valueOf() + 30 * 1000),
    );

    const secondApprovalEvent =
      context.df.waitForExternalEvent("ManagerResponse");

    const secondResult = yield context.df.Task.any([
      secondApprovalEvent,
      secondDeadline,
    ]);

    // Step 5: If still no response forward to business owner
    if (secondResult === secondDeadline) {
      context.log("Manager still did not respond - forwarding to owner");

      yield context.df.callActivity("SendOwnerEmail", {
        to: input.ownerEmail,
        projectName: input.projectName,
        employeeEmail: input.employeeEmail,
        description: input.description,
        instanceId: context.df.instanceId,
      });

      // Step 6: Wait for owner response
      const ownerResponse =
        yield context.df.waitForExternalEvent("OwnerResponse");

      // Step 7: Notify employee with owner decision
      yield context.df.callActivity("NotifyEmployee", {
        to: input.employeeEmail,
        projectName: input.projectName,
        decision: ownerResponse.decision,
        decidedBy: "Business Owner",
      });

      return;
    }

    // Manager responded after reminder
    const managerDecisionAfterReminder = secondApprovalEvent.result;
    yield context.df.callActivity("NotifyEmployee", {
      to: input.employeeEmail,
      projectName: input.projectName,
      decision: managerDecisionAfterReminder.decision,
      decidedBy: "Manager",
    });

    return;
  }

  // Step 8: Manager responded on time
  const managerDecision = firstApprovalEvent.result;
  yield context.df.callActivity("NotifyEmployee", {
    to: input.employeeEmail,
    projectName: input.projectName,
    decision: managerDecision.decision,
    decidedBy: "Manager",
  });
});
