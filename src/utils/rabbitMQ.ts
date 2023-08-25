import amqplib, { ConsumeMessage } from "amqplib";
import { MSG_QUEUE_URL, EXCHANGE_NAME, APPOINTMENT_SERVICE } from "../config";
import { subscribeEvents } from "./messageBroker_events";

export let channel: amqplib.Channel | null;

export const createMessageChannel = async () => {
  try {
    const connection = await amqplib.connect(MSG_QUEUE_URL);
    channel = await connection.createChannel();

    return channel;
  } catch (err) {
    throw err;
  }
};

export const publishMessage = async (
  channel: amqplib.Channel,
  service: string,
  msg: any
) => {
  await channel.assertExchange(EXCHANGE_NAME, "direct", { durable: true });
  channel.publish(EXCHANGE_NAME, service, Buffer.from(msg));
  console.log("Sent: ", msg);
};

export const subscribeMessage = async (channel: amqplib.Channel) => {
  try {
    await channel.assertExchange(EXCHANGE_NAME, "direct", { durable: true });
    const q = await channel.assertQueue("", { exclusive: true });
    console.log(` Waiting for messages in queue: ${q.queue}`);

    channel.bindQueue(q.queue, EXCHANGE_NAME, APPOINTMENT_SERVICE);

    await channel.consume(
      q.queue,
      (msg: ConsumeMessage | null) => {
        if (msg) {
          console.log("routingKey--->", msg.fields.routingKey);
          console.log("the message is:", msg.content.toString());
          subscribeEvents(msg.content.toString());
        }
      },
      {
        noAck: false,
      }
    );
  } catch (error) {
    console.log(error);
  }
};
