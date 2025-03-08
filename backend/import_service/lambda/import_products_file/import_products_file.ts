import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
  'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'
}

const BUCKET_NAME = process.env.BUCKET_NAME;
const UPLOAD_FOLDER = process.env.UPLOAD_FOLDER || 'uploaded';
const REGION = process.env.AWS_REGION || 'eu-west-1';
const client = new S3Client({ region: REGION });

export const handler = async (event: any): Promise<any> => {
  try {
    const filename = event.queryStringParameters?.name;

    if (!filename) {
      console.error('Filename is required');

      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: filename }),
      };
    }

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      ContentType: "text/csv",
      Key: `${UPLOAD_FOLDER}/${filename}`,
    });

    const signedUrl = await getSignedUrl(client, command, { expiresIn: 3000 });
    console.log(`Generated signed URL: ${signedUrl}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(signedUrl),
    };
  } catch (error: any) {
    console.error('Error generating signed URL: ', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Error generating signed URL' }),
    };
  }
};
