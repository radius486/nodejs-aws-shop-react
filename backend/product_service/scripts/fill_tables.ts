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

export const createProductWithStock = async (product: ProductInput) => {
  const { title, description, price, count } = product

  if (!title) {
    throw new Error("Title is required");
  }

  if (price < 0) {
    throw new Error("Price must be non-negative");
  }

  if (count < 0) {
    throw new Error("Count must be non-negative");
  }

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
          // Optional: Ensure the stock entry doesn't already exist
          ConditionExpression: "attribute_not_exists(product_id)"
        }
      }
    ]
  };

  try {
    const command = new TransactWriteItemsCommand(params);
    await client.send(command);
    console.log(`Product and stock created successfully with ID: ${productId}`);
    return productId;
  } catch (error) {
    console.error("Error in transaction:", error);
    throw error;
  }
};

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

// Example usage
// const createProduct = async () => {
//   try {
//     const productId = await createProductWithStock(
//       "Example Product",
//       "This is a description",
//       100,  // price
//       10    // count
//     );
//     console.log(`Created product with ID: ${productId}`);
//   } catch (error) {
//     console.error("Failed to create product:", error);
//   }
// };

