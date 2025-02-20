import { products } from './mocks'

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
}

exports.handler = async (event: any) => {
  const id = event.pathParameters?.productId;
  const product = products.find((p) => p.id === id);

  if (!product) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Product not found' }),
    };
  }

  return {
      statusCode: 200,
      headers,
      body: JSON.stringify(product),
  };
};
