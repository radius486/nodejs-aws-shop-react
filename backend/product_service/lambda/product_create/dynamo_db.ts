import {
  DynamoDBClient,
  TransactWriteItemsCommand,
  TransactWriteItemsCommandInput
} from "@aws-sdk/client-dynamodb";

import { logger } from '/opt/nodejs/logger';

import { v4 as uuidv4 } from 'uuid';

type ProductInput = {
  title: string;
  description: string;
  price: number;
  count: number;
}

const client = new DynamoDBClient({});

export const createProductWithStock = async (product: ProductInput) => {
  const { title, description, price, count } = product

  const productId = uuidv4();

  const params: TransactWriteItemsCommandInput = {
    TransactItems: [
      {
        Put: {
          TableName: "products",
          Item: {
            id: { S: productId },
            title: { S: title },
            description: { S: description || "" },
            price: { N: price.toString() }
          },
          // Optional: Ensure the product doesn't already exist
          ConditionExpression: "attribute_not_exists(id)"
        }
      },
      {
        Put: {
          TableName: "stocks",
          Item: {
            product_id: { S: productId },
            count: { N: count.toString() }
          },
          ConditionExpression: "attribute_not_exists(product_id)"
        }
      }
    ]
  };

  try {
    const command = new TransactWriteItemsCommand(params);
    await client.send(command);
    logger.info(`Product and stock created successfully with ID: ${productId}`);
    return productId;
  } catch (error) {
    logger.error(`Error in transaction: ${error}`);
    throw error;
  }
};
