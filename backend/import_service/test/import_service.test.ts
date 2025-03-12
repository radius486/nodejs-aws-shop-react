import { handler as importProductFile } from '../lambda/import_products_file/import_products_file';
import { handler as importFileParser} from '../lambda/import_file_parser/import_file_parser';
import { S3Client, GetObjectCommand, CopyObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://fake-signed-url.com')
}));

describe('import_products_file lambda', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    process.env.BUCKET_NAME = 'XXXXXXXXXXX';
    process.env.UPLOAD_FOLDER = 'uploaded';
  });

  afterEach(() => {
    process.env = OLD_ENV;
    jest.clearAllMocks();
  });

  it('should return signed URL when filename is provided', async () => {
    const event = {
      queryStringParameters: {
        name: 'test.csv'
      }
    };

    const response = await importProductFile(event);

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toBe('https://fake-signed-url.com');
  });

  it('should return 400 when filename is not provided', async () => {
    const event = {
      queryStringParameters: {}
    };

    const response = await importProductFile(event);

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body)).toEqual({
      message: 'Filename is required'
    });
  });
});

describe('import_file_parser lambda', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    process.env.BUCKET_NAME = 'XXXXXXXXXXX';
    process.env.PARSED_FOLDER = 'parsed';
  });

  afterEach(() => {
    process.env = OLD_ENV;
    jest.clearAllMocks();
  });

  it('should skip files that are already in parsed folder', async () => {
    const event = {
      Records: [
        {
          s3: {
            bucket: {
              name: 'test-bucket'
            },
            object: {
              key: 'parsed/test.csv'
            }
          }
        }
      ]
    };

    const response = await importFileParser(event as any);

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toBe('Parsing completed');
  });
});
