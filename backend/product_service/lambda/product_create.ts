import { createProductWithStock } from "./dynamo_db";

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
}

export const handler = async (event: any): Promise<any> => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Product data is required' }),
      };
    }

    const product = JSON.parse(event.body);
    const { title, description, price, count } = product;

    if (!title) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Title is required' }),
      };
    }

    if (!description) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Description is required' }),
      };
    }

    if (price < 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Price must be non-negative' }),
      };
    }

    if (count <= 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Count must be non-negative' }),
      };
    }

    const productId = await createProductWithStock(product);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        id: productId,
        ...product,
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};
