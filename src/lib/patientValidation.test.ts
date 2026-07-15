import { describe, expect, it } from 'vitest';
import { calculateAge, isValidThaiCid, normalizeCid } from './patientValidation';

describe('patient validation', () => {
  it('normalizes a formatted CID', () => expect(normalizeCid('1-2345-67890-12-3')).toBe('1234567890123'));
  it('rejects invalid CID checksum', () => expect(isValidThaiCid('1234567890123')).toBe(false));
  it('accepts a synthetically generated CID checksum', () => expect(isValidThaiCid('1101700203450')).toBe(true));
  it('calculates age around birthday', () => expect(calculateAge('2000-08-01', new Date('2026-07-15'))).toBe(25));
});
