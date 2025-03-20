import { getAllProducts } from "./dynamo_db";

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
  'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'
}

export const handler = async (event: any): Promise<any> => {
  try {
    const products = await getAllProducts()

    if (!products) {
      console.log('Products not found');

      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ message: 'Products not found' }),
      };
    }

    console.log('Get product list');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(products),
    };
  } catch (error: any) {
    console.error(error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};
