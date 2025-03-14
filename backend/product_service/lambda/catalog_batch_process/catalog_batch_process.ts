import { logger } from '/opt/nodejs/logger';
import { SQSHandler, SQSEvent } from 'aws-lambda';

export const handler: SQSHandler = async (event: SQSEvent): Promise<void> => {
  try {
    if (!event.Records || event.Records.length === 0) {
      logger.error('No messages in the SQS event');
      return;
    }

    for (const record of event.Records) {
      // Process each message in the batch
      const messageBody = JSON.parse(record.body);
      logger.info( messageBody);
      // Your processing logic here
    }
  } catch (error) {
    logger.error(`Error processing SQS messages: ${error}`);
    throw error;
  }
};
