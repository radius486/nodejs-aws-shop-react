import {
  DynamoDBClient,
  ScanCommand,
} from "@aws-sdk/client-dynamodb";

import { unmarshall } from "@aws-sdk/util-dynamodb";

const client = new DynamoDBClient({});

export const getAllProducts = async () => {
  try {
    const productsParams = {
      TableName: "products",
    };

    const productsCommand = new ScanCommand(productsParams);
    const productsResponse = await client.send(productsCommand);

    const stocksParams = {
      TableName: "stocks",
    };

    const stocksCommand = new ScanCommand(stocksParams);
    const stocksResponse = await client.send(stocksCommand);

    const stocksMap = stocksResponse.Items?.reduce((acc, stock) => {
      const { product_id, count } = unmarshall(stock);
      acc[product_id] = count;
      return acc;
    }, {});

    const products = productsResponse.Items?.map(item => {
      const product = unmarshall(item);
      return {
        ...product,
        count: stocksMap ? stocksMap[product.id] : 0
      };
    });

    return products;
  } catch (error) {
    console.error(`Error fetching products: ${error}`);
    throw error;
  }
};
