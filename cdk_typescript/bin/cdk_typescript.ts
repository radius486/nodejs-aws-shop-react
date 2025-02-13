#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkTypescriptStack } from '../lib/cdk_typescript-stack';

const app = new cdk.App();
new CdkTypescriptStack(app, 'CdkTypescriptStack');
app.synth();
