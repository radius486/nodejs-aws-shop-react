import { products } from './mocks'

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
}

exports.handler = async (event: any) => {
  return {
      statusCode: 200,
      headers,
      body: JSON.stringify(products),
  };
};

export const handler = async (event: any): Promise<any> => {
  try {
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
