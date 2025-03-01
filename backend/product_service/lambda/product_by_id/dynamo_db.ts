import {
  DynamoDBClient,
  GetItemCommand,
} from "@aws-sdk/client-dynamodb";

import { logger } from './logger';
import { unmarshall } from "@aws-sdk/util-dynamodb";

const client = new DynamoDBClient({});

// Get a single product by ID with its stock
export const getProductById = async (productId: string) => {
  try {
    const productParams = {
      TableName: "products",
      Key: {
        id: { S: productId }
      }
    };

    const productCommand = new GetItemCommand(productParams);
    const productResponse = await client.send(productCommand);

    if (!productResponse.Item) {
      return false;
    }

    const stockParams = {
      TableName: "stocks",
      Key: {
        product_id: { S: productId }
      }
    };

    const stockCommand = new GetItemCommand(stockParams);
    const stockResponse = await client.send(stockCommand);

    // Combine product with stock information
    const product = unmarshall(productResponse.Item);
    const stock = stockResponse.Item ? unmarshall(stockResponse.Item) : { count: 0 };

    return {
      ...product,
      count: stock.count
    };
  } catch (error) {
    logger.error(`Error fetching products: ${error}`);
    throw error;
  }
};
