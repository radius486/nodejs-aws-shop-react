import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { Duration } from 'aws-cdk-lib';

export class ProductServiceStack extends cdk.Stack {
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

    const productsTable = dynamodb.Table.fromTableName(
      this,
      'ProductsTable',
      'products'
    );

    const stocksTable = dynamodb.Table.fromTableName(
      this,
      'StocksTable',
      'stocks'
    );

    const catalogItemsQueue = new sqs.Queue(this, 'CatalogItemsQueue', {
      queueName: 'catalogItemsQueue',
      visibilityTimeout: Duration.seconds(300),
    });

    const eventSource = new SqsEventSource(catalogItemsQueue, {
      batchSize: 5,
      enabled: true,
    });

    const productListFunction = new lambda.Function(this, 'ProductListFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('dist/lambda/product_list'),
      handler: 'product_list.handler',
      layers: [
        layer,
      ],
    });

    const productByIdFunction = new lambda.Function(this, 'ProductByIdFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('dist/lambda/product_by_id'),
      handler: 'product_by_id.handler',
      layers: [
        layer,
      ],
    });

    const productCreateFunction = new lambda.Function(this, 'ProductCreateFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('dist/lambda/product_create'),
      handler: 'product_create.handler',
      layers: [
        layer,
      ],
    });

    const catalogBatchProcessFunction = new lambda.Function(this, 'CatalogBatchProcessFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('dist/lambda/catalog_batch_process'),
      handler: 'catalog_batch_process.handler',
      layers: [
        layer,
      ],
    });

    catalogBatchProcessFunction.addEventSource(eventSource);

    productsTable.grantReadData(productListFunction);
    stocksTable.grantReadData(productListFunction);
    productsTable.grantReadData(productByIdFunction);
    stocksTable.grantReadData(productByIdFunction);
    productsTable.grantWriteData(productCreateFunction);
    stocksTable.grantWriteData(productCreateFunction);
    productsTable.grantWriteData(catalogBatchProcessFunction);
    stocksTable.grantWriteData(catalogBatchProcessFunction);
    catalogItemsQueue.grantConsumeMessages(catalogBatchProcessFunction);

    const productApi = new apigateway.LambdaRestApi(this, 'ProductApi', {
      handler: productListFunction,
      proxy: false,
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key'],
        allowCredentials: true,
      },
    });

    const productListResource = productApi.root.addResource('products');
    const productByIdResource = productListResource.addResource('{productId}');
    productListResource.addMethod('GET', new apigateway.LambdaIntegration(productListFunction));
    productListResource.addMethod('POST', new apigateway.LambdaIntegration(productCreateFunction));
    productByIdResource.addMethod('GET', new apigateway.LambdaIntegration(productByIdFunction));
  }
}
