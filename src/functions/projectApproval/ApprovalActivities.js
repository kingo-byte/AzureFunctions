const df = require("durable-functions");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// ─────────────────────────────────────────
// Activity 1: Send email to Manager
// ─────────────────────────────────────────
df.app.activity("SendManagerEmail", {
  handler: async (input) => {
    const approveUrl = `${process.env.FUNCTION_BASE_URL}/api/ApprovalHttpAction?instanceId=${input.instanceId}&decision=approved&role=manager`;
    const rejectUrl = `${process.env.FUNCTION_BASE_URL}/api/ApprovalHttpAction?instanceId=${input.instanceId}&decision=rejected&role=manager`;

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: input.to,
      subject: `Project Approval Required: ${input.projectName}`,
      html: `
        <h2>Project Proposal Requires Your Approval</h2>
        <p><strong>Project:</strong> ${input.projectName}</p>
        <p><strong>Submitted by:</strong> ${input.employeeEmail}</p>
        <p><strong>Description:</strong> ${input.description}</p>
        <br/>
        <a href="${approveUrl}" style="background:green;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">
          ✅ Approve
        </a>
        &nbsp;&nbsp;
        <a href="${rejectUrl}" style="background:red;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">
          ❌ Reject
        </a>
      `,
    });

    return `Manager email sent to ${input.to}`;
  },
});

// ─────────────────────────────────────────
// Activity 2: Send Reminder to Manager
// ─────────────────────────────────────────
df.app.activity("SendReminderEmail", {
  handler: async (input) => {
    const approveUrl = `${process.env.FUNCTION_BASE_URL}/api/ApprovalHttpAction?instanceId=${input.instanceId}&decision=approved&role=manager`;
    const rejectUrl = `${process.env.FUNCTION_BASE_URL}/api/ApprovalHttpAction?instanceId=${input.instanceId}&decision=rejected&role=manager`;

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: input.to,
      subject: `REMINDER: Project Approval Required: ${input.projectName}`,
      html: `
        <h2>⚠️ Reminder: Project Proposal Still Awaiting Your Response</h2>
        <p><strong>Project:</strong> ${input.projectName}</p>
        <p>This proposal will be escalated to the Business Owner if not responded to.</p>
        <br/>
        <a href="${approveUrl}" style="background:green;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">
          ✅ Approve
        </a>
        &nbsp;&nbsp;
        <a href="${rejectUrl}" style="background:red;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">
          ❌ Reject
        </a>
      `,
    });

    return `Reminder email sent to ${input.to}`;
  },
});

// ─────────────────────────────────────────
// Activity 3: Forward to Business Owner
// ─────────────────────────────────────────
df.app.activity("SendOwnerEmail", {
  handler: async (input) => {
    const approveUrl = `${process.env.FUNCTION_BASE_URL}/api/ApprovalHttpAction?instanceId=${input.instanceId}&decision=approved&role=owner`;
    const rejectUrl = `${process.env.FUNCTION_BASE_URL}/api/ApprovalHttpAction?instanceId=${input.instanceId}&decision=rejected&role=owner`;

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: input.to,
      subject: `ESCALATED: Project Approval Required: ${input.projectName}`,
      html: `
        <h2>🚨 Escalated Project Proposal</h2>
        <p>This proposal was escalated because the manager did not respond in time.</p>
        <p><strong>Project:</strong> ${input.projectName}</p>
        <p><strong>Submitted by:</strong> ${input.employeeEmail}</p>
        <p><strong>Description:</strong> ${input.description}</p>
        <br/>
        <a href="${approveUrl}" style="background:green;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">
          ✅ Approve
        </a>
        &nbsp;&nbsp;
        <a href="${rejectUrl}" style="background:red;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">
          ❌ Reject
        </a>
      `,
    });

    return `Owner email sent to ${input.to}`;
  },
});

// ─────────────────────────────────────────
// Activity 4: Notify Employee of Decision
// ─────────────────────────────────────────
df.app.activity("NotifyEmployee", {
  handler: async (input) => {
    const isApproved = input.decision === "approved";

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: input.to,
      subject: `Project ${isApproved ? "Approved ✅" : "Rejected ❌"}: ${input.projectName}`,
      html: `
        <h2>Project Proposal Decision</h2>
        <p><strong>Project:</strong> ${input.projectName}</p>
        <p><strong>Decision:</strong> ${isApproved ? "✅ Approved" : "❌ Rejected"}</p>
        <p><strong>Decided by:</strong> ${input.decidedBy}</p>
        ${
          isApproved
            ? "<p>Congratulations! Your project has been approved. You may proceed.</p>"
            : "<p>Unfortunately your project proposal was not approved at this time.</p>"
        }
      `,
    });

    return `Employee notified with decision: ${input.decision}`;
  },
});
