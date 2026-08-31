const http = require('http');

const data = JSON.stringify({
  email: 'aquaflow@provider.com',
  password: 'provider123',
  tenantId: 'green-valley',
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
  },
};

const req = http.request(options, (res) => {
  let body = '';

  res.on('data', (chunk) => {
    body += chunk;
  });

  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('RESPONSE:');
    console.log(body);
  });
});

req.on('error', (error) => {
  console.error('REQUEST ERROR:', error);
});

req.write(data);
req.end();
