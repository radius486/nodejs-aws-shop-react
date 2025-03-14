import { S3Event } from 'aws-lambda';
import { S3Client, GetObjectCommand, CopyObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { Readable } from 'stream';
import csvParser = require('csv-parser');

const REGION = process.env.AWS_REGION || 'eu-west-1';
const PARSED_FOLDER = process.env.PARSED_FOLDER || 'parsed';
const UPLOAD_FOLDER = process.env.UPLOAD_FOLDER || 'uploaded';
const QUEUE_URL = process.env.QUEUE_URL;

const s3Client = new S3Client({
  region: REGION
});

const sqsClient = new SQSClient({
  region: REGION
});

export const handler = async (event: S3Event): Promise<any> => {
  try {
    console.log('Parsing process:', { event });

    for (const record of event.Records) {
      const bucket = record.s3.bucket.name;
      const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

      // Skip if the file is already in the parsed folder
      if (key.includes(PARSED_FOLDER)) {
        console.log(`Skipping already parsed file: ${key}`);
        continue;
      }

      // Get the object from S3
      const getObjectCommand = new GetObjectCommand({
        Bucket: bucket,
        Key: key
      });

      const response = await s3Client.send(getObjectCommand);

      if (!response.Body) {
        throw new Error('No body in S3 object');
      }

      // Parse CSV
      const results: any[] = [];
      await new Promise((resolve, reject) => {
        const stream = response.Body as Readable;
        stream
          .pipe(csvParser())
          .on('data', (data: any) => {
            results.push(data);
          })
          .on('error', (error: any) => {
            reject(error);
          })
          .on('end', async () => {
            console.log(`Parsed ${results.length} rows from ${key}`);

            // Send each item to SQS
            for (const item of results) {
              try {
                const command = new SendMessageCommand({
                  QueueUrl: QUEUE_URL,
                  MessageBody: JSON.stringify(item),
                });

                await sqsClient.send(command);
                console.log('Successfully sent message to SQS:', item);
              } catch (error) {
                console.error('Error sending message to SQS:', error);
                // Continue processing other items even if one fails
              }
            }

            resolve(results);
          });
      });

      // Move file to parsed folder
      const newKey = key.replace(UPLOAD_FOLDER, PARSED_FOLDER);

      // Copy to new location
      await s3Client.send(new CopyObjectCommand({
        Bucket: bucket,
        CopySource: `${bucket}/${key}`,
        Key: newKey
      }));

      // Delete from old location
      await s3Client.send(new DeleteObjectCommand({
        Bucket: bucket,
        Key: key
      }));

      console.log(`Moved ${key} to ${newKey}`);
    }

    console.log('Parsing completed');
    return {
      statusCode: 200,
      body: JSON.stringify('Parsing completed'),
    };
  } catch (error: any) {
    console.error('Error processing CSV:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error processing CSV',
        error: error.message
      }),
    };
  }
};
