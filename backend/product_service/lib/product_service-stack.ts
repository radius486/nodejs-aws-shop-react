import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

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

    const productListFunction = new lambda.Function(this, 'ProductListFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('dist/lambda'),
      handler: 'product_list.handler',
    });

    const productByIdFunction = new lambda.Function(this, 'ProductByIdFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('dist/lambda'),
      handler: 'product_by_id.handler',
    });

    productsTable.grantReadData(productListFunction);
    stocksTable.grantReadData(productListFunction);
    productsTable.grantReadData(productByIdFunction);
    stocksTable.grantReadData(productByIdFunction);
    // productsTable.grantWriteData(productCreateFunction);
    // stocksTable.grantWriteData(productCreateFunction);

    const productApi = new apigateway.LambdaRestApi(this, 'ProductApi', {
      handler: productListFunction,
      proxy: false,
    });

    const productListResource = productApi.root.addResource('products');
    const productByIdResource = productListResource.addResource('{productId}');
    productListResource.addMethod('GET', new apigateway.LambdaIntegration(productListFunction));
    productByIdResource.addMethod('GET', new apigateway.LambdaIntegration(productByIdFunction));
  }
}
