const assert = require('node:assert/strict');
const http = require('node:http');
const { test } = require('node:test');
const express = require('express');
const mongoose = require('mongoose');
const routes = require('../src/routes');

const getHealth = async () => {
  const app = express();
  app.use('/api', routes);
  const server = app.listen(0, '127.0.0.1');

  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });

  try {
    const { port } = server.address();
    return await new Promise((resolve, reject) => {
      http.get(`http://127.0.0.1:${port}/api/health`, (response) => {
        let body = '';
        response.setEncoding('utf8');
        response.on('data', (chunk) => {
          body += chunk;
        });
        response.on('end', () => {
          resolve({ statusCode: response.statusCode, body: JSON.parse(body) });
        });
      }).on('error', reject);
    });
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
};

test('health reports unavailable when MongoDB is disconnected', async () => {
  const previousReadyState = mongoose.connection.readyState;
  mongoose.connection.readyState = 0;

  try {
    const response = await getHealth();
    assert.equal(response.statusCode, 503);
    assert.equal(response.body.status, 'UNHEALTHY');
    assert.equal(response.body.database, 'DISCONNECTED');
  } finally {
    mongoose.connection.readyState = previousReadyState;
  }
});

test('health reports healthy when MongoDB is connected', async () => {
  const previousReadyState = mongoose.connection.readyState;
  mongoose.connection.readyState = 1;

  try {
    const response = await getHealth();
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.status, 'HEALTHY');
    assert.equal(response.body.database, 'CONNECTED');
  } finally {
    mongoose.connection.readyState = previousReadyState;
  }
});
