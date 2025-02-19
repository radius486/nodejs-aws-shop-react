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

    const productListApi = new apigateway.LambdaRestApi(this, 'ProductListApi', {
      handler: productListFunction,
      proxy: false,
    });

    const productListResource = productListApi.root.addResource('products');
    productListResource.addMethod('GET');
  }
}
