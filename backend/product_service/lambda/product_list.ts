import { products } from './mocks'

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
}

exports.handler = async (event: any) => {
  return {
      statusCode: 200,
      headers,
      body: JSON.stringify(products),
  };
};
