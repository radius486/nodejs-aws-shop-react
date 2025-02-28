import { getAllProducts } from "./dynamo_db";

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
}

export const handler = async (event: any): Promise<any> => {
  try {
    const products = await getAllProducts()

    if (!products) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ message: 'Products not found' }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(products),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};
