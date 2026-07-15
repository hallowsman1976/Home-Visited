import { describe, expect, it } from 'vitest';
import { hasPermission } from './permissions';

describe('RBAC permission matrix', () => {
  it('allows every action for SUPER_ADMIN', () => expect(hasPermission('SUPER_ADMIN', 'users.manage')).toBe(true));
  it('prevents VIEWER from writes', () => expect(hasPermission('VIEWER', 'visits.write')).toBe(false));
  it('allows CLINICIAN to submit visits', () => expect(hasPermission('CLINICIAN', 'visits.submit')).toBe(true));
  it('allows AUDITOR to read audit trail', () => expect(hasPermission('AUDITOR', 'audit.read')).toBe(true));
});

