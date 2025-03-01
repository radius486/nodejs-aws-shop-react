import {
  DynamoDBClient,
  PutItemCommand,
  TransactWriteItem,
  TransactWriteItemsCommand,
  TransactWriteItemsCommandInput
} from "@aws-sdk/client-dynamodb";

import { v4 as uuidv4 } from 'uuid';

type ProductInput = {
  title: string;
  description: string;
  price: number;
  count: number;
}

const client = new DynamoDBClient({});

export const createMultipleProductsWithStock = async (products: ProductInput[]) => {
  if (products.length > 25) {
    throw new Error("Cannot create more than 25 products in a single transaction");
  }

  const transactItems = products.flatMap(product => {
    const productId = uuidv4();
    return [
      {
        Put: {
          TableName: "products",
          Item: {
            id: { S: productId },
            title: { S: product.title },
            description: { S: product.description || "" },
            price: { N: product.price.toString() }
          }
        }
      },
      {
        Put: {
          TableName: "stocks",
          Item: {
            product_id: { S: productId },
            count: { N: product.count.toString() }
          }
        }
      }
    ];
  });

  const params: any = {
    TransactItems: transactItems
  };

  try {
    const command = new TransactWriteItemsCommand(params);
    await client.send(command);
    console.log("All products and stocks created successfully");
  } catch (error) {
    console.error("Error in batch transaction:", error);
    throw error;
  }
};
