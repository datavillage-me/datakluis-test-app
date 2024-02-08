const { EmailClient } = require("@azure/communication-email");

// This code retrieves your connection string from an environment variable.
const connectionString = process.env['COMMUNICATION_SERVICES_CONNECTION_STRING'];
console.log(`Email using connect string: ${connectionString}`);

export async function sendEmail(recipient: string) {
    if (connectionString) {
        const client = new EmailClient(connectionString);

        const emailMessage = {
            senderAddress: "DoNotReply@a6ab5fd6-f8f2-4614-9a83-d94ba58df8c6.azurecomm.net",
            content: {
                subject: "Datakluis notification",
                plainText: "Hello world via email.",
            },
            recipients: {
                to: [{ address: recipient }],
            },
        };

        const poller = await client.beginSend(emailMessage);
        const result = await poller.pollUntilDone();

        console.log(`Email sent: ${result}`);
    }
}