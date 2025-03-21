import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

export class AuthorizationServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create the Lambda authorizer
    const basicAuthorizerFunction = new lambda.Function(this, 'BasicAuthorizer', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'basic_authorizer.handler',
      code: lambda.Code.fromAsset('dist/lambda/basic_authorizer'),
      environment: {
        AUTH_TOKEN: process.env.AUTH_TOKEN || '',
      },
    });


     // Grant invoke permissions to the authorizer Lambda
     basicAuthorizerFunction.grantInvoke(new iam.ServicePrincipal('apigateway.amazonaws.com'));
  }
}
