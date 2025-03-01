import { handler as getProductById } from '../lambda/product_by_id';
import { handler as getProductsList } from '../lambda/product_list';
import { products } from '../lambda/mocks';

describe('getProductById Lambda', () => {
  it('should return product when valid ID is provided', async () => {
    const event = {
      pathParameters: {
        productId: products[0].id
      }
    };

    const response = await getProductById(event);

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual(products[0]);
  });

  it('should return 404 when product is not found', async () => {
    const event = {
      pathParameters: {
        productId: 'non-existent-id'
      }
    };

    const response = await getProductById(event);

    expect(response.statusCode).toBe(404);
    expect(JSON.parse(response.body)).toEqual({ message: 'Product not found' });
  });

  it('should return 400 when productId is not provided', async () => {
    const event = {
      pathParameters: null
    };

    const response = await getProductById(event);

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body)).toEqual({ message: 'Product ID is required' });
  });
});

describe('getProductsList Lambda', () => {
  it('should return all products', async () => {
    const event = {};

    const response = await getProductsList(event);

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual(products);
  });

  it('should return proper headers', async () => {
    const event = {};

    const response = await getProductsList(event);

    expect(response.headers).toEqual({
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    });
  });
});
