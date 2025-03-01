import { createProductWithStock } from "./dynamo_db";
import { logger } from "./logger";

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
  'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'
}

export const handler = async (event: any): Promise<any> => {
  try {
    if (!event.body) {
      logger.error('Product data is required');

      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Product data is required' }),
      };
    }

    const product = JSON.parse(event.body);
    const { title, description, price, count } = product;

    if (!title) {
      logger.error('Title is required');

      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Title is required' }),
      };
    }

    if (!description) {
      logger.error('Description is required');

      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Description is required' }),
      };
    }

    if (price < 0) {
      logger.error('Price must be non-negative');

      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Price must be non-negative' }),
      };
    }

    if (count <= 0) {
      logger.error('Count must be non-negative');

      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Count must be non-negative' }),
      };
    }

    const productId = await createProductWithStock(product);

    logger.info(`Product created: ${productId}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        id: productId,
        ...product,
      })
    };
  } catch (error: any) {
    logger.error(error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};
