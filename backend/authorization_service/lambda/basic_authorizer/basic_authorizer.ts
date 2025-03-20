import { APIGatewayAuthorizerResult, APIGatewayTokenAuthorizerEvent } from 'aws-lambda';

export const handler = async (event: APIGatewayTokenAuthorizerEvent): Promise<APIGatewayAuthorizerResult> => {
  console.log('Event: ', event);

  if (!event.authorizationToken) {
    throw new Error('Unauthorized'); // Return 401
  }

  try {
    const authToken = event.authorizationToken.split(' ')[1];
    const buffer = Buffer.from(authToken, 'base64');
    const credentials = buffer.toString('utf-8');
    const [username, password] = credentials.split('=');

    const storedCredentials = process.env.AUTH_TOKEN || '';
    const [storedUsername, storedPassword] = storedCredentials.split('=');

    const effect = (username === storedUsername && password === storedPassword) ? 'Allow' : 'Deny';

    if (effect === 'Deny') {
      throw new Error('Forbidden'); // Return 403
    }

    return {
      principalId: username,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: effect,
            Resource: event.methodArn
          }
        ]
      }
    };
  } catch (error) {
    console.error('Error: ', error);
    throw error;
  }
};
