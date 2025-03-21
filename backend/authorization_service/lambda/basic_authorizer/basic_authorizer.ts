import { APIGatewayAuthorizerResult, APIGatewayTokenAuthorizerEvent, StatementEffect } from 'aws-lambda';

export const handler = async (event: APIGatewayTokenAuthorizerEvent): Promise<APIGatewayAuthorizerResult> => {
  console.log('Event: ', event);

  if (!event.authorizationToken) {
    return generatePolicy('anonymous', 'Deny', event);
  }

  try {
    const authToken = event.authorizationToken.split(' ')[1];
    const buffer = Buffer.from(authToken, 'base64');
    const credentials = buffer.toString('utf-8');
    const [username, password] = credentials.split(':');
    const storedUsername = process.env.USERNAME || '';
    const storedPassword = process.env.PASSWORD || '';
    const effect = (username === storedUsername && password === storedPassword) ? 'Allow' : 'Deny';

    if (effect === 'Deny') {
      throw new Error('Forbidden'); // Return 403
    }

    return generatePolicy(username, effect, event);
  } catch (error) {
    console.error('Error: ', error);
    return generatePolicy('anonymous', 'Deny', event);
  }
};

const generatePolicy = (username: string, effect: StatementEffect, event: APIGatewayTokenAuthorizerEvent ): APIGatewayAuthorizerResult => {
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
}
