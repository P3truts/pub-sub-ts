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
    const queue = await channel.assertQueue(queueName, { durable: isDurable, autoDelete: !isDurable, exclusive: !isDurable });
    channel.bindQueue(queueName, exchange, key);

    return [channel, queue];
}


export enum SimpleQueueType {
    Durable,
    Transient,
}
