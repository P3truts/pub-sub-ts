import type { Channel, ConfirmChannel } from "amqplib";
import amqp from "amqplib";


export async function publishJSON<T>(
    ch: ConfirmChannel,
    exchange: string,
    routingKey: string,
    value: T,
): Promise<void> {
    const json = JSON.stringify(value);
    const buffer = Buffer.from(json);
    ch.publish(exchange, routingKey, buffer, { "contentType": "application/json" });
}

export async function declareAndBind(
    conn: amqp.ChannelModel,
    exchange: string,
    queueName: string,
    key: string,
    queueType: SimpleQueueType,
): Promise<[Channel, amqp.Replies.AssertQueue]> {
    const channel = await conn.createChannel();
    const isDurable = queueType === SimpleQueueType.Durable ? true : false;
    const queue = await channel.assertQueue(queueName, { durable: isDurable, autoDelete: !isDurable, exclusive: !isDurable, arguments: { "x-dead-letter-exchange": "peril_dlx" } });
    channel.bindQueue(queueName, exchange, key);

    return [channel, queue];
}

export async function subscribeJSON<T>(
    conn: amqp.ChannelModel,
    exchange: string,
    queueName: string,
    key: string,
    queueType: SimpleQueueType,
    handler: (data: T, cc: ConfirmChannel) => Promise<AckType> | AckType,
): Promise<void> {
    //console.log("subscribing to queue...", queueName);
    const [channel, queue] = await declareAndBind(conn, exchange, queueName, key, queueType);
    await channel.consume(queue.queue, async (msg) => {
        if (msg === null) {
            console.log("null message");
            return;
        }

        //console.log("received message", msg);
        const parsedMsg = JSON.parse(msg.content.toString());
        console.log("parsed message:");
        console.log(parsedMsg);
        console.log("end of parsed message");
        const confirmChann = await conn.createConfirmChannel()
        const ackType: AckType = await handler(parsedMsg, confirmChann);
        if (ackType === AckType.Ack) {
            console.log("Ack");
            channel.ack(msg);
        } else if (ackType === AckType.NackRequeue) {
            console.log("NackRequeue");
            channel.nack(msg, false, true);
        } else {
            console.log("NackDiscard");
            channel.nack(msg, false, false);
        }
    })
}

export enum SimpleQueueType {
    Durable,
    Transient,
}

export enum AckType {
    Ack,
    NackRequeue,
    NackDiscard
}
