export const products = [
  {
    id: 'product_1',
    title: 'Product 1',
    description: 'This is the first product',
    price: 100,
  },
  {
    id: 'product_2',
    title: 'Product 2',
    description: 'This is the second product',
    price: 200,
  },
  {
    id: 'product_3',
    title: 'Product 3',
    description: 'This is the third product',
    price: 300,
  },
];

exports.handler = async (event: any) => {
  const id = event.pathParameters?.productId;
  const product = products.find((p) => p.id === id);

  if (!product) {
    return {
      statusCode: 404,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: 'Product not found' }),
    };
  }

  return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product),
  };
};
