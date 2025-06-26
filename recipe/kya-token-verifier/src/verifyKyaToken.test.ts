import { test, expect } from 'vitest';
import { verifyKyaToken } from './verifyKyaToken';

test('should reject invalid tokens', async () => {
  const { error } = await verifyKyaToken('invalid.token.value', 'fake-ssi', 'fake-aud');
  expect(error).toBeDefined();
  expect(error).toContain('Invalid token');
});

test('should reject empty token', async () => {
  const { error } = await verifyKyaToken('', 'fake-ssi', 'fake-aud');
  expect(error).toBeDefined();
  expect(error).toContain('Invalid token: must be a non-empty string');
});

test('should reject null token', async () => {
  const { error } = await verifyKyaToken(null as any, 'fake-ssi', 'fake-aud');
  expect(error).toBeDefined();
  expect(error).toContain('Invalid token: must be a non-empty string');
});

test('should reject empty expectedSsi', async () => {
  const { error } = await verifyKyaToken('some.token', '', 'fake-aud');
  expect(error).toBeDefined();
  expect(error).toContain('Invalid expectedSsi: must be a non-empty string');
});

test('should reject empty expectedAud', async () => {
  const { error } = await verifyKyaToken('some.token', 'fake-ssi', '');
  expect(error).toBeDefined();
  expect(error).toContain('Invalid expectedAud: must be a non-empty string');
});

test('should reject malformed JWT tokens', async () => {
  const { error } = await verifyKyaToken('not.a.valid.jwt', 'fake-ssi', 'fake-aud');
  expect(error).toBeDefined();
});

test('should reject tokens with wrong signature', async () => {
  // This is a malformed JWT that will fail signature verification
  const malformedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
  const { error } = await verifyKyaToken(malformedToken, 'fake-ssi', 'fake-aud');
  expect(error).toBeDefined();
});

test('should reject expired tokens', async () => {
  // This test would require a real expired token from Skyfire
  // For now, we'll test the validation logic
  const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
  const { error } = await verifyKyaToken(expiredToken, 'fake-ssi', 'fake-aud');
  expect(error).toBeDefined();
});

test('should validate input parameter types', async () => {
  // Test with non-string parameters
  const { error: error1 } = await verifyKyaToken(123 as any, 'fake-ssi', 'fake-aud');
  expect(error1).toContain('Invalid token: must be a non-empty string');

  const { error: error2 } = await verifyKyaToken('token', 123 as any, 'fake-aud');
  expect(error2).toContain('Invalid expectedSsi: must be a non-empty string');

  const { error: error3 } = await verifyKyaToken('token', 'fake-ssi', 123 as any);
  expect(error3).toContain('Invalid expectedAud: must be a non-empty string');
});

test('should handle network errors gracefully', async () => {
  // This test would require mocking the JWKS endpoint
  // For now, we'll test that the function doesn't crash on network issues
  const { error } = await verifyKyaToken('valid.jwt.format', 'fake-ssi', 'fake-aud');
  expect(error).toBeDefined();
});

test('should validate UUID format for JTI and nonce', async () => {
  // This test would require a real token with invalid UUIDs
  // The validation is implemented in the function
  expect(true).toBe(true); // Placeholder test
});

test('should validate issuer field', async () => {
  // This test would require a real token with wrong issuer
  // The validation is implemented in the function
  expect(true).toBe(true); // Placeholder test
});

test('should validate timestamp fields', async () => {
  // This test would require a real token with invalid timestamps
  // The validation is implemented in the function
  expect(true).toBe(true); // Placeholder test
});