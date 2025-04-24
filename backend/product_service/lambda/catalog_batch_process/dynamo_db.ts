import {
  DynamoDBClient,
  TransactWriteItemsCommand,
  TransactWriteItemsCommandInput
} from "@aws-sdk/client-dynamodb";

import { v4 as uuidv4 } from 'uuid';

export type ProductInput = {
  title: string;
  description: string;
  price: number;
  count: number;
  image?: string;
}

const client = new DynamoDBClient({});

export const createProductWithStock = async (product: ProductInput): Promise<ProductInput> => {
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
            price: { N: price.toString() },
            image: { S: product.image || "" }
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
    console.log(`Product and stock created successfully with ID: ${productId}`);
    return product;
  } catch (error) {
    console.error(`Error in transaction: ${error}`);
    throw error;
  }
};
