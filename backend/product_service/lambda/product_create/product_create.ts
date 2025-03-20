import { createProductWithStock } from "./dynamo_db";

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
  'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'
}

export const handler = async (event: any): Promise<any> => {
  try {

    if (!event.body) {
      const message = 'Product data is required';
      console.error(message);

      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message }),
      };
    }

    const errors = [];
    const product = JSON.parse(event.body);
    const { title, description, price, count } = product;

    if (!title) {
      errors.push('Title is required');
    }

    if (typeof title !== 'string') {
      errors.push('Title must be a string');
    }

    if (!description) {
      errors.push('Description is required');
    }

    if (typeof description !== 'string') {
      errors.push('Description must be a string');
    }

    if (!price) {
      errors.push('Price is required');
    }

    if (price < 0) {
      errors.push('Price must be non-negative');
    }

    if (typeof price !== 'number') {
      errors.push('Price must be a number');
    }

    if (!count) {
      errors.push('Count is required');
    }

    if (count <= 0) {
      errors.push('Count must be positive');
    }

    if (typeof count !== 'number') {
      errors.push('Count must be a number');
    }

    if (errors.length) {
      console.error(`Product data is invalid: ${errors.join(', ')}`);
      console.error(`Product data: ${JSON.stringify(product)}`);

      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: errors }),
      };
    }

    const productId = await createProductWithStock(product);

    console.log(`Product created: ${productId}`);

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        id: productId,
        ...product,
      })
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
