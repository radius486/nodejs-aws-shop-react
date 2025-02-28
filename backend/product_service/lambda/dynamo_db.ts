import {
  DynamoDBClient,
  ScanCommand,
  GetItemCommand,
  TransactWriteItemsCommand,
  TransactWriteItemsCommandInput
} from "@aws-sdk/client-dynamodb";

import { v4 as uuidv4 } from 'uuid';
import { unmarshall } from "@aws-sdk/util-dynamodb";

type ProductInput = {
  title: string;
  description: string;
  price: number;
  count: number;
}

const client = new DynamoDBClient({});

// Get all products with their stock information
export const getAllProducts = async () => {
  try {
    // First, get all products
    const productsParams = {
      TableName: "products",
    };

    const productsCommand = new ScanCommand(productsParams);
    const productsResponse = await client.send(productsCommand);

    // Then get all stocks
    const stocksParams = {
      TableName: "stocks",
    };

    const stocksCommand = new ScanCommand(stocksParams);
    const stocksResponse = await client.send(stocksCommand);

    // Create a map of product_id -> stock count
    const stocksMap = stocksResponse.Items?.reduce((acc, stock) => {
      const { product_id, count } = unmarshall(stock);
      acc[product_id] = count;
      return acc;
    }, {});

    // Combine products with their stock information
    const products = productsResponse.Items?.map(item => {
      const product = unmarshall(item);
      return {
        ...product,
        count: stocksMap ? stocksMap[product.id] : 0
      };
    });

    return products;
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
};

// Get a single product by ID with its stock
export const getProductById = async (productId: string) => {
  try {
    // Get product
    const productParams = {
      TableName: "products",
      Key: {
        id: { S: productId }
      }
    };

    const productCommand = new GetItemCommand(productParams);
    const productResponse = await client.send(productCommand);

    if (!productResponse.Item) {
      throw new Error("Product not found");
    }

    // Get stock
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
    console.error("Error fetching product:", error);
    throw error;
  }
};

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
