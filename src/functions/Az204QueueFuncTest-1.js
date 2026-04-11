const { app } = require('@azure/functions');

app.storageQueue('Az204QueueFuncTest-1', {
    queueName: 'js-queue-items',
    connection: '',
    handler: (queueItem, context) => {
        context.log('Storage queue function processed work item:', queueItem);
    }
});
