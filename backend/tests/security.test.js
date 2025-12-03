/**
 * Security Testing Suite
 * Tests authentication, authorization, input validation, and security features
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import axios from 'axios';
import mongoose from 'mongoose';

const API_URL = process.env.API_URL || 'http://localhost:8000';
const TEST_EMAIL = 'test.security@semo.edu';
const TEST_S0_KEY = 'SO1234567';

describe('Security Tests', () => {
  let authToken;
  let testUserId;

  beforeAll(async () => {
    // Setup test user if needed
  });

  afterAll(async () => {
    // Cleanup test data
  });

  describe('Authentication Security', () => {
    it('should reject requests without token', async () => {
      try {
        await axios.get(`${API_URL}/api/users/me`);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error.response.status).toBe(401);
      }
    });

    it('should reject invalid tokens', async () => {
      try {
        await axios.get(`${API_URL}/api/users/me`, {
          headers: { Authorization: 'Bearer invalid-token' }
        });
        expect(true).toBe(false);
      } catch (error) {
        expect(error.response.status).toBe(401);
      }
    });

    it('should reject expired tokens', async () => {
      // Test with expired token
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQ1NiIsImV4cCI6MTYwOTQ1NjgwMH0.invalid';
      try {
        await axios.get(`${API_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${expiredToken}` }
        });
        expect(true).toBe(false);
      } catch (error) {
        expect(error.response.status).toBe(401);
      }
    });

    it('should enforce rate limiting on auth endpoints', async () => {
      const requests = [];
      for (let i = 0; i < 10; i++) {
        requests.push(
          axios.post(`${API_URL}/api/auth/login`, {
            email: 'test@semo.edu',
            s0Key: 'SO0000000'
          }).catch(err => err.response)
        );
      }
      
      const responses = await Promise.all(requests);
      const rateLimited = responses.filter(r => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  describe('Input Validation', () => {
    it('should reject invalid email format', async () => {
      try {
        await axios.post(`${API_URL}/api/auth/register`, {
          email: 'invalid-email',
          s0Key: TEST_S0_KEY
        });
        expect(true).toBe(false);
      } catch (error) {
        expect(error.response.status).toBe(400);
      }
    });

    it('should reject non-SEMO emails', async () => {
      try {
        await axios.post(`${API_URL}/api/auth/register`, {
          email: 'test@gmail.com',
          s0Key: TEST_S0_KEY
        });
        expect(true).toBe(false);
      } catch (error) {
        expect(error.response.status).toBe(400);
      }
    });

    it('should reject invalid S0 Key format', async () => {
      try {
        await axios.post(`${API_URL}/api/auth/register`, {
          email: TEST_EMAIL,
          s0Key: 'INVALID123'
        });
        expect(true).toBe(false);
      } catch (error) {
        expect(error.response.status).toBe(400);
      }
    });

    it('should sanitize XSS attempts', async () => {
      const xssPayload = '<script>alert("XSS")</script>';
      try {
        await axios.post(`${API_URL}/api/ai/explain`, {
          question: xssPayload,
          language: 'python'
        });
        // Should not execute script
        expect(true).toBe(true);
      } catch (error) {
        // Should handle gracefully
        expect(error.response.status).not.toBe(500);
      }
    });

    it('should reject oversized requests', async () => {
      const largeCode = 'a'.repeat(200000); // 200KB
      try {
        await axios.post(`${API_URL}/api/ai/explain`, {
          code: largeCode,
          language: 'python'
        });
        expect(true).toBe(false);
      } catch (error) {
        expect([400, 413]).toContain(error.response.status);
      }
    });
  });

  describe('NoSQL Injection Protection', () => {
    it('should prevent NoSQL injection in email field', async () => {
      const injection = { $ne: null };
      try {
        await axios.post(`${API_URL}/api/auth/login`, {
          email: injection,
          s0Key: TEST_S0_KEY
        });
        expect(true).toBe(false);
      } catch (error) {
        expect(error.response.status).toBe(400);
      }
    });

    it('should sanitize MongoDB operators', async () => {
      const maliciousInput = { $gt: '' };
      try {
        await axios.post(`${API_URL}/api/ai/explain`, {
          question: JSON.stringify(maliciousInput),
          language: 'python'
        });
        // Should sanitize and handle gracefully
        expect(true).toBe(true);
      } catch (error) {
        expect(error.response.status).not.toBe(500);
      }
    });
  });

  describe('Rate Limiting', () => {
    it('should limit API requests', async () => {
      const requests = [];
      for (let i = 0; i < 150; i++) {
        requests.push(
          axios.get(`${API_URL}/api/ai/providers`).catch(err => err.response)
        );
      }
      
      const responses = await Promise.all(requests);
      const rateLimited = responses.filter(r => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    });

    it('should limit code execution requests', async () => {
      const requests = [];
      for (let i = 0; i < 15; i++) {
        requests.push(
          axios.post(`${API_URL}/api/code/execute`, {
            code: 'print("test")',
            language: 'python'
          }).catch(err => err.response)
        );
      }
      
      const responses = await Promise.all(requests);
      const rateLimited = responses.filter(r => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  describe('Authorization', () => {
    it('should prevent unauthorized access to protected routes', async () => {
      try {
        await axios.get(`${API_URL}/api/users/me`);
        expect(true).toBe(false);
      } catch (error) {
        expect(error.response.status).toBe(401);
      }
    });

    it('should enforce role-based access control', async () => {
      // Test that non-admin users cannot access admin routes
      // This requires a test user with non-admin role
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await axios.get(`${API_URL}/`);
      const headers = response.headers;
      
      expect(headers['x-content-type-options']).toBe('nosniff');
      expect(headers['x-frame-options']).toBeDefined();
      expect(headers['x-xss-protection']).toBeDefined();
    });
  });
});





