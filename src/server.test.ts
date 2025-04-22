import type express from 'express';
import odbc from 'odbc';
import supertest from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { createServer } from './server';

// Mock ODBC module
vi.mock('odbc', () => ({
  default: {
    connect: vi.fn(),
  },
}));

describe('Local SQL Server', () => {
  let app: express.Application;
  let server: ReturnType<express.Application['listen']>;

  beforeAll(() => {
    app = createServer();
    server = app.listen(3002); // Use different port for testing
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  describe('Health Check', () => {
    it('should return status ok', async () => {
      const response = await supertest(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'ok' });
    });
  });

  describe('SQL Query Endpoint', () => {
    it('should validate connection string and query are provided', async () => {
      const response = await supertest(app)
        .post('/query')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation error');
    });

    it('should handle SQL queries with different SELECT keyword casing', async () => {
      const mockData = [{ id: 1, name: 'Test' }];
      const mockConnection = {
        query: vi.fn().mockResolvedValue(mockData),
        close: vi.fn().mockResolvedValue(undefined),
        callProcedure: vi.fn(),
        createStatement: vi.fn(),
        primaryKeys: vi.fn(),
        foreignKeys: vi.fn(),
        columns: vi.fn(),
        tables: vi.fn(),
        beginTransaction: vi.fn(),
        commit: vi.fn(),
        rollback: vi.fn(),
      };

      vi.mocked(odbc.connect).mockResolvedValue(mockConnection as unknown as odbc.Connection);

      // Test lowercase select
      const lowercaseResponse = await supertest(app)
        .post('/query')
        .send({
          connectionString: 'valid connection string',
          query: 'select * from table',
        });

      expect(lowercaseResponse.status).toBe(200);
      expect(lowercaseResponse.body).toEqual({ rows: mockData });

      // Test mixed case select
      const mixedCaseResponse = await supertest(app)
        .post('/query')
        .send({
          connectionString: 'valid connection string',
          query: 'SeLeCt * from table',
        });

      expect(mixedCaseResponse.status).toBe(200);
      expect(mixedCaseResponse.body).toEqual({ rows: mockData });

      // Test with leading whitespace
      const whitespaceResponse = await supertest(app)
        .post('/query')
        .send({
          connectionString: 'valid connection string',
          query: '  SELECT * from table',
        });

      expect(whitespaceResponse.status).toBe(200);
      expect(whitespaceResponse.body).toEqual({ rows: mockData });
    });

    it('should reject non-SELECT queries', async () => {
      const response = await supertest(app)
        .post('/query')
        .send({
          connectionString: 'valid connection string',
          query: 'DELETE FROM table',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation error');
    });

    it('should handle successful query execution', async () => {
      const mockData = [{ id: 1, name: 'Test' }];
      const mockConnection = {
        query: vi.fn().mockResolvedValue(mockData),
        close: vi.fn().mockResolvedValue(undefined),
        callProcedure: vi.fn(),
        createStatement: vi.fn(),
        primaryKeys: vi.fn(),
        foreignKeys: vi.fn(),
        columns: vi.fn(),
        tables: vi.fn(),
        beginTransaction: vi.fn(),
        commit: vi.fn(),
        rollback: vi.fn(),
      };

      vi.mocked(odbc.connect).mockResolvedValue(mockConnection as unknown as odbc.Connection);

      const response = await supertest(app)
        .post('/query')
        .send({
          connectionString: 'valid connection string',
          query: 'SELECT * FROM table',
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ rows: mockData });
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('should handle query execution errors', async () => {
      const mockConnection = {
        query: vi.fn().mockRejectedValue(new Error('Database error')),
        close: vi.fn().mockResolvedValue(undefined),
        callProcedure: vi.fn(),
        createStatement: vi.fn(),
        primaryKeys: vi.fn(),
        foreignKeys: vi.fn(),
        columns: vi.fn(),
        tables: vi.fn(),
        beginTransaction: vi.fn(),
        commit: vi.fn(),
        rollback: vi.fn(),
      };

      vi.mocked(odbc.connect).mockResolvedValue(mockConnection as unknown as odbc.Connection);

      const response = await supertest(app)
        .post('/query')
        .send({
          connectionString: 'valid connection string',
          query: 'SELECT * FROM table',
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Database error');
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('should handle connection errors', async () => {
      vi.mocked(odbc.connect).mockRejectedValue(new Error('Connection failed'));

      const response = await supertest(app)
        .post('/query')
        .send({
          connectionString: 'invalid connection string',
          query: 'SELECT * FROM table',
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Connection failed');
    });
  });
});
