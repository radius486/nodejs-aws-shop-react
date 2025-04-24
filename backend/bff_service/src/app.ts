import * as http from 'http';
import * as dotenv from 'dotenv';
import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { IncomingMessage, ServerResponse, OutgoingHttpHeaders } from 'http';
import NodeCache from 'node-cache';

dotenv.config();

// Cache service implementation
const cache = new NodeCache({ stdTTL: 120 }); // 2 minutes TTL

const cacheService = {
  get: <T>(key: string): T | undefined => {
    return cache.get(key);
  },
  set: (key: string, value: any): void => {
    cache.set(key, value);
  },
  del: (key: string): void => {
    cache.del(key);
  }
};

// Interface definitions
interface ServiceMapping {
  [key: string]: string | undefined;
}

const serviceUrls: ServiceMapping = {
  cart: process.env.CART_SERVICE_URL,
  products: process.env.PRODUCT_SERVICE_URL,
};

// Helper function to read request body
const getRequestBody = async (req: IncomingMessage): Promise<any> => {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : null);
      } catch (e) {
        resolve(body);
      }
    });
  });
};

// Add CORS headers helper function
const setCorsHeaders = (res: ServerResponse) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '3600');
};

const server = http.createServer(async (req: IncomingMessage, res: ServerResponse) => {
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    setCorsHeaders(res);

    const parsedUrl = new URL(req.url || '', `http://${req.headers.host}`);
    const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);

    if (!pathSegments.length) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Service name is required' }));
      return;
    }

    const serviceName = pathSegments[0];
    const serviceUrl = serviceUrls[serviceName];

    if (!serviceUrl) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Cannot process request',
        message: `Service '${serviceName}' not found`
      }));
      return;
    }

    const body = await getRequestBody(req);

    // Check if it's a products list request
    const isProductsList = serviceName === 'products' && req.method === 'GET';

    // Try to get from cache for products list request
    if (isProductsList) {
      const cachedData = cacheService.get<any>('productsList');
      if (cachedData) {
        console.log('Serving from cache');
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'X-Cache': 'HIT'
        });
        res.end(JSON.stringify(cachedData));
        return;
      }
    }

    // Build target URL
    const servicePath = pathSegments.slice(1).join('/');
    const targetUrl = new URL(
      servicePath,
      serviceUrl.endsWith('/') ? serviceUrl : `${serviceUrl}/`
    ).toString();

    // Add query parameters
    if (parsedUrl.search) {
      targetUrl + parsedUrl.search;
    }

    const axiosConfig: AxiosRequestConfig = {
      method: req.method || 'GET',
      url: targetUrl,
      headers: {
        'Content-Type': 'application/json',
        ...(req.headers.authorization && {
          'Authorization': req.headers.authorization
        })
      },
      validateStatus: () => true,
      maxRedirects: 5,
      timeout: 10000
    };

    // Add body for POST, PUT, PATCH methods
    if (body && ['POST', 'PUT', 'PATCH'].includes(req.method || '')) {
      axiosConfig.data = body;
    }

    const response = await axios(axiosConfig);

    // Cache products list response
    if (isProductsList && response.status === 200) {
      console.log('Caching products list');
      cacheService.set('productsList', response.data);
    }

    // Invalidate cache on product creation
    if (serviceName === 'products' && req.method === 'POST' && response.status === 200) {
      console.log('Invalidating products list cache');
      cacheService.del('productsList');
    }

    // Prepare response headers
    const responseHeaders: OutgoingHttpHeaders = {
      'Content-Type': 'application/json',
      'X-Cache': isProductsList ? 'MISS' : 'BYPASS'
    };

    // Copy response headers
    if (response.headers) {
      Object.entries(response.headers).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            responseHeaders[key.toLowerCase()] = value;
          } else {
            responseHeaders[key.toLowerCase()] = String(value);
          }
        }
      });
    }

    // Send response
    res.writeHead(response.status, responseHeaders);
    const responseData = typeof response.data === 'string'
      ? response.data
      : JSON.stringify(response.data);
    res.end(responseData);

  } catch (error) {
    console.error('Request failed:', error);

    const axiosError = error as AxiosError;
    const statusCode = axiosError.response?.status || 502;

    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Cannot process request',
      details: axiosError.message
    }));
  }
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`BFF Service is running on port ${PORT}`);
});
