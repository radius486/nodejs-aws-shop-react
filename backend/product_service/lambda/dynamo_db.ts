import {
  DynamoDBClient,
  ScanCommand,
  GetItemCommand,
  QueryCommand
} from "@aws-sdk/client-dynamodb";
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

// Example Lambda handler for getting all products
// export const getProductsHandler = async () => {
//   try {
//     const products = await getAllProducts();

//     return {
//       statusCode: 200,
//       headers: {
//         'Content-Type': 'application/json'
//       },
//       body: JSON.stringify(products)
//     };
//   } catch (error) {
//     return {
//       statusCode: 500,
//       headers: {
//         'Content-Type': 'application/json'
//       },
//       body: JSON.stringify({ message: 'Internal server error' })
//     };
//   }
// };

// Example Lambda handler for getting a single product
// export const getProductByIdHandler = async (event: any) => {
//   try {
//     const productId = event.pathParameters?.productId;

//     if (!productId) {
//       return {
//         statusCode: 400,
//         headers: {
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({ message: 'Product ID is required' })
//       };
//     }

//     const product = await getProductById(productId);

//     return {
//       statusCode: 200,
//       headers: {
//         'Content-Type': 'application/json'
//       },
//       body: JSON.stringify(product)
//     };
//   } catch (error: any) {
//     if (error.message === 'Product not found') {
//       return {
//         statusCode: 404,
//         headers: {
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({ message: 'Product not found' })
//       };
//     }

//     return {
//       statusCode: 500,
//       headers: {
//         'Content-Type': 'application/json'
//       },
//       body: JSON.stringify({ message: 'Internal server error' })
//     };
//   }
// };

// If you need to handle pagination
// const getAllProductsWithPagination = async (limit: number = 20, lastEvaluatedKey?: any) => {
//   try {
//     const productsParams = {
//       TableName: "products",
//       Limit: limit,
//       ...(lastEvaluatedKey && { ExclusiveStartKey: lastEvaluatedKey })
//     };

//     const productsCommand = new ScanCommand(productsParams);
//     const productsResponse = await client.send(productsCommand);

//     // Get stock information for this batch of products
//     const productIds = productsResponse.Items?.map(item => unmarshall(item).id);

//     const stocksParams = {
//       TableName: "stocks",
//       FilterExpression: "product_id IN (" + productIds.map((_, i) => `:id${i}`).join(", ") + ")",
//       ExpressionAttributeValues: productIds.reduce((acc, id, i) => ({
//         ...acc,
//         [`:id${i}`]: { S: id }
//       }), {})
//     };

//     const stocksCommand = new ScanCommand(stocksParams);
//     const stocksResponse = await client.send(stocksCommand);

//     // Create stocks map and combine with products
//     const stocksMap = stocksResponse.Items?.reduce((acc, stock) => {
//       const { product_id, count } = unmarshall(stock);
//       acc[product_id] = count;
//       return acc;
//     }, {});

//     const products = productsResponse.Items?.map(item => {
//       const product = unmarshall(item);
//       return {
//         ...product,
//         count: stocksMap[product.id] || 0
//       };
//     });

//     return {
//       products,
//       lastEvaluatedKey: productsResponse.LastEvaluatedKey
//     };
//   } catch (error) {
//     console.error("Error fetching products:", error);
//     throw error;
//   }
// };
