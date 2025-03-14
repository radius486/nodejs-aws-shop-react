import { logger } from '/opt/nodejs/logger';
import { SQSHandler, SQSEvent } from 'aws-lambda';
import { createProductWithStock } from "./dynamo_db";

export const handler: SQSHandler = async (event: SQSEvent): Promise<void> => {
  try {
    if (!event.Records || event.Records.length === 0) {
      logger.error('No messages in the SQS event');
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
      }

      const { title, description, price, count } = formattedProduct;
      logger.info( product);

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
        logger.error(`Product data is invalid: ${errors.join(', ')}`);
        logger.error(`Product data: ${JSON.stringify(formattedProduct)}`);

        throw new Error(`${errors}`);
      }

      const productId = await createProductWithStock(formattedProduct);

      logger.info(`Product created: ${productId}`);
    }
  } catch (error) {
    logger.error(`Error processing SQS messages: ${error}`);
    throw error;
  }
};
