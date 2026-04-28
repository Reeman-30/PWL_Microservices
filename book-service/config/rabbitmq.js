require("dotenv").config();
const amqp = require("amqplib");

class RabbitMQService {
  constructor() {
    this.connection = null;
    this.channel = null;
  }

  async connect() {
    try {
      this.connection = await amqp.connect(
        process.env.RABBITMQ_URL || "amqp://localhost",
      );

      this.channel = await this.connection.createChannel();
      console.log("Connected to RabbitMQ");
      return true;
    } catch (error) {
      console.error("Failed to connect to RabbitMQ:", error);
      return false;
    }
  }

  async sendToQueue(queueName, message) {
    try {
      if (!this.channel) {
        await this.connect();
      }

      await this.channel.assertQueue(queueName, { durable: true });

      this.channel.sendToQueue(
        queueName,
        Buffer.from(JSON.stringify(message)),
        {
          persistent: true,
        },
      );

      console.log(`Message sent to queue ${queueName}:`, message);
    } catch (error) {
      console.error("Failed to send message to:", error);
      return false;
    }
  }

  async close() {
    try {
      if (this.channel) {
        await this.channel.close();
      }

      if (this.connection) {
        await this.connection.close();
      }

      console.log("RabbitMQ connection closed");
    } catch (error) {
      console.error("Error closing RabbitMQ connection:", error);
    }
  }
}

module.exports = new RabbitMQService();
