import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const productListFunction = new lambda.Function(this, 'ProductListFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'product_list.handler',
    });

    const productByIdFunction = new lambda.Function(this, 'ProductByIdFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'product_by_id.handler',
    });

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
