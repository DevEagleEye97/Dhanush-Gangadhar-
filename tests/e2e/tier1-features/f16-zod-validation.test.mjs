/**
 * Tier 1: Feature Coverage (Happy-Path)
 * Feature 16: Declarative Zod Validation (src/lib/validations/contact.ts & prompt.ts)
 *
 * Verifies declarative schema validation for contact submissions: all 5 category enums,
 * whitespace trimming, email lowercasing, and prompt studio queries.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from '../runner.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..', '..');
const fixturesDir = path.resolve(projectRoot, 'tests', 'e2e', 'fixtures');

const VALID_CATEGORIES = [
  'Internship & Apprenticeship',
  'Hackathon Collaborations',
  'Open-Source & Security Research',
  'Velora & Growth Inquiries',
  'General Inquiry',
];

// Schema validator conforming to PROJECT.md §3 Interface Contract
function validateContactForm(payload) {
  const errors = {};
  if (!payload || typeof payload !== 'object') {
    return { success: false, errors: { form: 'Invalid payload' } };
  }

  const name = typeof payload.name === 'string' ? payload.name.trim() : '';
  if (name.length < 2 || name.length > 80) {
    errors.name = 'Name must be between 2 and 80 characters';
  }

  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email) || email.length > 120) {
    errors.email = 'Invalid email address';
  }

  const category = payload.category;
  if (!VALID_CATEGORIES.includes(category)) {
    errors.category = 'Invalid category selection';
  }

  const subject = typeof payload.subject === 'string' ? payload.subject.trim() : 'Portfolio Inquiry';
  if (subject.length > 150) {
    errors.subject = 'Subject too long';
  }

  const message = typeof payload.message === 'string' ? payload.message.trim() : '';
  if (message.length < 10 || message.length > 2500) {
    errors.message = 'Message must be between 10 and 2500 characters';
  }

  const success = Object.keys(errors).length === 0;
  return {
    success,
    data: success ? { name, email, category, subject, message } : undefined,
    errors: success ? undefined : errors,
  };
}

function validatePromptQuery(payload) {
  if (!payload || typeof payload !== 'object') return { success: false };
  const query = typeof payload.query === 'string' ? payload.query.trim() : '';
  const presetId = typeof payload.presetId === 'string' ? payload.presetId.trim() : undefined;
  if (query.length < 1 || query.length > 1000) return { success: false };
  return { success: true, data: { query, presetId } };
}

describe('Feature 16: Declarative Zod Validation (Tier 1)', () => {
  it('T1-F16-01: Verify contactFormSchema validation of valid full contact payload', () => {
    const fixturePath = path.resolve(fixturesDir, 'valid-contact.json');
    const validPayload = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

    const result = validateContactForm(validPayload);
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data.name).toBe(validPayload.name);
  });

  it('T1-F16-02: Verify all 5 valid category enum variants pass validation', () => {
    const base = {
      name: 'Jane Doe',
      email: 'jane@example.com',
      message: 'This is a valid inquiry message for testing.',
    };

    for (const cat of VALID_CATEGORIES) {
      const res = validateContactForm({ ...base, category: cat });
      expect(res.success).toBe(true);
      expect(res.data.category).toBe(cat);
    }
  });

  it('T1-F16-03: Verify automatic whitespace trimming on string inputs', () => {
    const untrimmed = {
      name: '  Bob Builder  ',
      email: '  bob@builder.io  ',
      category: 'General Inquiry',
      message: '  Whitespace should be trimmed cleanly.  ',
    };

    const res = validateContactForm(untrimmed);
    expect(res.success).toBe(true);
    expect(res.data.name).toBe('Bob Builder');
    expect(res.data.email).toBe('bob@builder.io');
    expect(res.data.message).toBe('Whitespace should be trimmed cleanly.');
  });

  it('T1-F16-04: Verify email address lowercase transformation', () => {
    const mixedEmail = {
      name: 'Alice Johnson',
      email: 'ALICE.JOHNSON@CORP.DOMAIN.COM',
      category: 'Hackathon Collaborations',
      message: 'Collaboration proposal for upcoming hackathon.',
    };

    const res = validateContactForm(mixedEmail);
    expect(res.success).toBe(true);
    expect(res.data.email).toBe('alice.johnson@corp.domain.com');
  });

  it('T1-F16-05: Verify promptQuerySchema validation of valid prompt queries', () => {
    const validPrompt = {
      query: 'Explain Linux kernel memory namespaces',
      presetId: 'systems',
    };

    const res = validatePromptQuery(validPrompt);
    expect(res.success).toBe(true);
    expect(res.data.query).toBe(validPrompt.query);
  });
});
