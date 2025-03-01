import {
  DynamoDBClient,
  ScanCommand,
} from "@aws-sdk/client-dynamodb";

import { logger } from './logger';
import { unmarshall } from "@aws-sdk/util-dynamodb";

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
    logger.error(`Error fetching products: ${error}`);
    throw error;
  }
};
