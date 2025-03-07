import { getProductById } from "./dynamo_db";
import { logger } from '/opt/nodejs/logger';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
  'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'
}

export const handler = async (event: any): Promise<any> => {
  try {
    if (!event.pathParameters?.productId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Product ID is required' }),
      };
    }

    const product = await getProductById(event.pathParameters.productId)

    if (!product) {
      logger.info(`Product not found: ${event.pathParameters.productId}`);

      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ message: 'Product not found' }),
      };
    }

    logger.info(`Get product: ${event.pathParameters.productId}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(product),
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
