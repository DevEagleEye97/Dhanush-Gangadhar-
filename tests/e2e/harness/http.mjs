/**
 * HTTP Invocation Helpers for Next.js Route Handlers and Edge Middleware
 * Directly calls route handlers and middleware using standard Web Request/Response objects
 */

export function createMockRequest(options = {}) {
  const url = options.url || 'http://localhost:3000/api/test';
  const method = (options.method || 'GET').toUpperCase();
  const headers = new Headers(options.headers || {});

  if (!headers.has('host')) {
    try {
      const parsedUrl = new URL(url);
      headers.set('host', parsedUrl.host);
    } catch {
      headers.set('host', 'localhost:3000');
    }
  }

  if (options.ip && !headers.has('cf-connecting-ip')) {
    headers.set('cf-connecting-ip', options.ip);
  }

  let body = null;
  if (method !== 'GET' && method !== 'HEAD' && options.body !== undefined) {
    if (typeof options.body === 'object' && !(options.body instanceof Uint8Array)) {
      body = JSON.stringify(options.body);
      if (!headers.has('content-type')) {
        headers.set('content-type', 'application/json');
      }
    } else {
      body = String(options.body);
    }
  }

  const req = new Request(url, {
    method,
    headers,
    body,
  });

  // Attach Next.js convenience properties if helpful
  if (options.ip) {
    req.ip = options.ip;
  }

  return req;
}

export async function invokeRoute(handlerOrModule, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  let handlerFn = null;

  if (typeof handlerOrModule === 'function') {
    handlerFn = handlerOrModule;
  } else if (handlerOrModule && typeof handlerOrModule === 'object') {
    handlerFn = handlerOrModule[method] || handlerOrModule.default;
  }

  if (typeof handlerFn !== 'function') {
    throw new TypeError(`No handler function found for HTTP method ${method} on provided target`);
  }

  const req = createMockRequest(options);
  const context = {
    params: options.params ? Promise.resolve(options.params) : Promise.resolve({}),
  };

  const rawResponse = await handlerFn(req, context);

  // Parse response body safely
  let textBody = '';
  let jsonBody = null;
  let isJson = false;

  if (rawResponse && typeof rawResponse.text === 'function') {
    // Clone response if possible to avoid consuming body stream twice
    const responseClone = typeof rawResponse.clone === 'function' ? rawResponse.clone() : rawResponse;
    textBody = await responseClone.text();
    const contentType = rawResponse.headers?.get?.('content-type') || '';
    if (contentType.includes('application/json') || textBody.startsWith('{') || textBody.startsWith('[')) {
      try {
        jsonBody = JSON.parse(textBody);
        isJson = true;
      } catch {
        jsonBody = null;
      }
    }
  }

  return {
    raw: rawResponse,
    status: rawResponse?.status ?? 200,
    statusText: rawResponse?.statusText ?? 'OK',
    ok: rawResponse?.ok ?? (rawResponse?.status >= 200 && rawResponse?.status < 300),
    headers: rawResponse?.headers ?? new Headers(),
    body: isJson ? jsonBody : textBody,
    data: jsonBody,
    text: async () => textBody,
    json: async () => jsonBody,
  };
}

export async function invokeMiddleware(middlewareFn, options = {}) {
  if (typeof middlewareFn !== 'function') {
    throw new TypeError('invokeMiddleware requires a middleware function');
  }

  const req = createMockRequest({
    url: options.url || 'http://localhost:3000/',
    method: options.method || 'GET',
    headers: options.headers || {},
    ip: options.ip,
    body: options.body,
  });

  const response = await middlewareFn(req);

  return {
    raw: response,
    status: response?.status ?? 200,
    headers: response?.headers ?? new Headers(),
    ok: response?.ok ?? true,
    redirectUrl: response?.headers?.get?.('location') || null,
    rewriteUrl: response?.headers?.get?.('x-middleware-rewrite') || null,
  };
}

const http = {
  createMockRequest,
  invokeRoute,
  invokeMiddleware,
};

export default http;
