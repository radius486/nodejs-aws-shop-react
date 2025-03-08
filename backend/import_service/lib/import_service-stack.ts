import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

const BUCKET_NAME = process.env.BUCKET_NAME || 'my-aws-import-service-bucket';
const REGION = process.env.AWS_REGION || 'eu-west-1';
const UPLOAD_FOLDER = process.env.UPLOAD_FOLDER || 'uploaded';
const PARSED_FOLDER = process.env.PARSED_FOLDER || 'parsed';

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

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
      },
    });

    bucket.grantReadWrite(importProductsFileFunction);
    bucket.grantRead(importFileParserFunction);

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
    importResource.addMethod('GET', new apigateway.LambdaIntegration(importProductsFileFunction));

    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(importFileParserFunction),
      { prefix: 'uploaded/' }
    );
  }
}

