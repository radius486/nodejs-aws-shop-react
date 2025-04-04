import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as dotenv from 'dotenv'
dotenv.config()

const BUCKET_NAME = process.env.BUCKET_NAME || '';
const REGION = process.env.AWS_REGION || 'eu-west-1';
const UPLOAD_FOLDER = process.env.UPLOAD_FOLDER || 'uploaded';
const PARSED_FOLDER = process.env.PARSED_FOLDER || 'parsed';
const QUEUE_URL = process.env.QUEUE_URL || '';
const ACCOUNT_ID = process.env.ACCOUNT_ID || '';
const SQS_ARN = process.env.SQS_ARN || '';
const AUTH_ARN = process.env.AUTH_ARN || '';

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const layer = new lambda.LayerVersion(
      this,
      "Layer",
      {
        code: lambda.Code.fromAsset( "lib/layers/"),
        compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
        layerVersionName: "NodeJsLayer",
      }
    );

    const bucket = new s3.Bucket(this, 'MyAwsImportServiceBucket', {
      bucketName: BUCKET_NAME,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT],
          allowedOrigins: ["*"],
          allowedHeaders: ["*"],
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const catalogItemsQueue = sqs.Queue.fromQueueArn(
      this,
      'CatalogItemsQueue',
      SQS_ARN,
    );

    const importProductsFileFunction = new lambda.Function(this, 'ImportProductsFileFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('dist/lambda/import_products_file'),
      handler: 'import_products_file.handler',
      environment: {
        BUCKET_NAME: BUCKET_NAME,
        REGION: REGION,
        UPLOAD_FOLDER: UPLOAD_FOLDER,
      },
    });

    const importFileParserFunction = new lambda.Function(this, 'ImportFileParserFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('dist/lambda/import_file_parser'),
      handler: 'import_file_parser.handler',
      environment: {
        BUCKET_NAME: BUCKET_NAME,
        REGION: REGION,
        UPLOAD_FOLDER: UPLOAD_FOLDER,
        PARSED_FOLDER: PARSED_FOLDER,
        QUEUE_URL: QUEUE_URL,
      },
      layers: [
        layer,
      ],
    });

    importFileParserFunction.addToRolePolicy(new iam.PolicyStatement({
      actions: ['sqs:SendMessage'],
      resources: [catalogItemsQueue.queueArn]
    }));

    bucket.grantReadWrite(importProductsFileFunction);
    bucket.grantReadWrite(importFileParserFunction);

    // Reference the existing authorizer Lambda by ARN
    const basicAuthorizerFn = lambda.Function.fromFunctionArn(
      this,
      'BasicAuthorizer',
      AUTH_ARN,
    );

    // Create the authorizer using the existing Lambda
    const authorizer = new apigateway.TokenAuthorizer(this, 'ImportApiAuthorizer', {
      handler: basicAuthorizerFn,
      identitySource: apigateway.IdentitySource.header('Authorization'),
      resultsCacheTtl: cdk.Duration.seconds(0), // disable caching
    });

    const importApi = new apigateway.LambdaRestApi(this, 'ImportApi', {
      handler: importProductsFileFunction,
      proxy: false,
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: ["OPTIONS", "GET", "PUT"],
        allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
      },
    });

    const importResource = importApi.root.addResource('import');

    // Add the method with the existing authorizer
    importResource.addMethod('GET',
      new apigateway.LambdaIntegration(importProductsFileFunction),
      {
        authorizer: authorizer,
        authorizationType: apigateway.AuthorizationType.CUSTOM,
      }
    );

    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(importFileParserFunction),
      { prefix: 'uploaded/' }
    );
  }
}

