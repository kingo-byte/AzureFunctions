const { app } = require("@azure/functions");
const { TableClient } = require("@azure/data-tables");
const { randomUUID } = require("crypto");

app.storageQueue("Az204QueueFuncTest-1", {
  queueName: "queue-orders",
  connection: "AzureWebJobsStorage",
  handler: async (queueItem, context) => {
    const order =
      typeof queueItem === "string" ? JSON.parse(queueItem) : queueItem;

    const client = TableClient.fromConnectionString(
      process.env.AzureWebJobsStorage,
      "tblAz204Orders",
    );

    await client.createEntity({
      partitionKey: "orders",
      rowKey: randomUUID(),
      orderId: order.orderId,
      customerName: order.customerName,
      amount: order.amount,
      timestamp: new Date().toISOString(),
    });

    context.log("Order written to tblAz204Orders");
  },
});
