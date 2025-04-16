import * as http from 'http';
import * as url from 'url';
import * as dotenv from 'dotenv';
import { IncomingMessage, ServerResponse } from 'http';

dotenv.config();

// Interface for service mapping
interface ServiceMapping {
  [key: string]: string | undefined;
}

// Create service URL mapping
const serviceUrls: ServiceMapping = {
  cart: process.env.CART_SERVICE_URL,
  products: process.env.PRODUCT_SERVICE_URL,
};

// Helper function to read request body
const getRequestBody = async (req: IncomingMessage): Promise<string> => {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      resolve(body);
    });
  });
};

const server = http.createServer(async (req: IncomingMessage, res: ServerResponse) => {
  try {
    const parsedUrl = url.parse(req.url || '', true);
    const pathSegments = parsedUrl.pathname?.split('/').filter(Boolean) || [];

    if (!pathSegments.length) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Service name is required' }));
      return;
    }

    const serviceName = pathSegments[0];
    const recipientURL = serviceUrls[serviceName];

    if (!recipientURL) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Cannot process request',
        message: `Service '${serviceName}' not found`
      }));
      return;
    }

    // Reconstruct the path without the service name
    const remainingPath = pathSegments.slice(1).join('/');
    const queryString = parsedUrl.search || '';

    // Construct target URL
    const targetUrl = `${recipientURL}/${remainingPath}${queryString}`;

    // Get request body if present
    const body = await getRequestBody(req);

    // Forward the request
    const forwardRequest = http.request(
      targetUrl,
      {
        method: req.method,
        headers: {
          ...req.headers,
          host: new URL(recipientURL).host,
        },
      },
      (serviceRes) => {
        res.writeHead(serviceRes.statusCode || 502, serviceRes.headers);

        serviceRes.on('data', (chunk) => {
          res.write(chunk);
        });

        serviceRes.on('end', () => {
          res.end();
        });
      }
    );

    forwardRequest.on('error', (error) => {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Cannot process request',
        message: error.message
      }));
    });

    // Send body data if present
    if (body) {
      forwardRequest.write(body);
    }

    forwardRequest.end();

  } catch (error) {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Cannot process request',
      message: error instanceof Error ? error.message : 'Internal server error'
    }));
  }
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`BFF Service is running on port ${PORT}`);
});
