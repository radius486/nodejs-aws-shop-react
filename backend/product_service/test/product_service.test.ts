import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, GetCommand, ScanCommand, PutCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { handler as catalogBatchProcess } from '../lambda/catalog_batch_process/catalog_batch_process';

// Mock DynamoDB and SNS clients
const ddbMock = mockClient(DynamoDBDocumentClient);
const snsMock = mockClient(SNSClient);

describe('Product Service Lambda Functions', () => {
  beforeEach(() => {
    ddbMock.reset();
    snsMock.reset();
    // Mock console methods to keep test output clean
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('catalogBatchProcess Lambda', () => {
    it('should process SQS batch and create products', async () => {
      // Arrange
      const sqsEvent = {
        Records: [
          {
            body: JSON.stringify({
              title: 'SQS Product 1',
              description: 'Description 1',
              price: 100,
              count: 10,
              image: "https://random-image-pepebigotes.vercel.app/api/random-image",
            })
          },
          {
            body: JSON.stringify({
              title: 'SQS Product 2',
              description: 'Description 2',
              price: 200,
              count: 20,
              image: "https://random-image-pepebigotes.vercel.app/api/random-image",
            })
          }
        ]
      };

      ddbMock.on(BatchWriteCommand).resolves({});
      snsMock.on(PublishCommand).resolves({});

      // Act
      await catalogBatchProcess(sqsEvent);

      // Assert
      expect(snsMock.calls()).toHaveLength(2); // One call per product
      const snsCall = snsMock.calls()[0].args[0];
      expect(snsCall.input).toMatchObject({
        Subject: 'New Product Created'
      });
    });

    it('should handle invalid product data in batch', async () => {
      // Arrange
      const sqsEvent = {
        Records: [
          {
            body: 'invalid-json'
          }
        ]
      };

      // Act & Assert
      await expect(catalogBatchProcess(sqsEvent)).rejects.toThrow();
      expect(snsMock.calls()).toHaveLength(1);
      const snsCall = snsMock.calls()[0].args[0];
      expect(snsCall.input).toMatchObject({
        Subject: 'Error Creating Products'
      });
    });

    it('should handle empty batch', async () => {
      // Arrange
      const sqsEvent = {
        Records: []
      };

      // Act
      await catalogBatchProcess(sqsEvent);

      // Assert
      expect(ddbMock.calls()).toHaveLength(0);
      expect(snsMock.calls()).toHaveLength(0);
    });
  });
});
