const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
}

export const handler = async (event: any): Promise<any> => {
  try {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify('Hello world'),
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
