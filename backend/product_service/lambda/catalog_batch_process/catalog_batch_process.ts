import { createProductWithStock } from "./dynamo_db";
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;
const snsClient = new SNSClient({ region: process.env.AWS_REGION });

export const handler: any = async (event: any): Promise<void> => {
  try {
    if (!event.Records || event.Records.length === 0) {
      console.error('No messages in the SQS event');
      return;
    }

    for (const record of event.Records) {
      const errors = [];
      const product = JSON.parse(record.body);

      const formattedProduct = {
        title: product.title,
        description: product.description,
        price: Number(product.price),
        count: Number(product.count),
        image: product.image,
      }

      const { title, description, price, count } = formattedProduct;
      console.log( product);

      if (!title) {
        errors.push('Title is required');
      }

      if (typeof title !== 'string') {
        errors.push('Title must be a string');
      }

      if (!description) {
        errors.push('Description is required');
      }

      if (typeof description !== 'string') {
        errors.push('Description must be a string');
      }

      if (!price) {
        errors.push('Price is required');
      }

      if (price < 0) {
        errors.push('Price must be non-negative');
      }

      if (typeof price !== 'number') {
        errors.push('Price must be a number');
      }

      if (!count) {
        errors.push('Count is required');
      }

      if (count <= 0) {
        errors.push('Count must be positive');
      }

      if (typeof count !== 'number') {
        errors.push('Count must be a number');
      }

      if (errors.length) {
        console.error(`Product data is invalid: ${errors.join(', ')}`);
        console.error(`Product data: ${JSON.stringify(formattedProduct)}`);

        throw new Error(`${errors}`);
      }

      const createdProduct = await createProductWithStock(formattedProduct);

      await snsClient.send(new PublishCommand({
        TopicArn: SNS_TOPIC_ARN,
        Subject: 'New Product Created',
        Message: JSON.stringify(createdProduct, null, 2),
        MessageAttributes: {
          price: {
            DataType: 'Number',
            StringValue: createdProduct.price.toString()
          }
        }
      }));

      console.log(`Product created: ${JSON.stringify(createdProduct)}`);
    }
  } catch (error: any) {
    console.error(`Error processing SQS messages: ${error}`);

    await snsClient.send(new PublishCommand({
      TopicArn: SNS_TOPIC_ARN,
      Subject: 'Error Creating Products',
      Message: JSON.stringify({
        error: error.message,
        timestamp: new Date().toISOString()
      }, null, 2),
    }));

    throw error;
  }
};
