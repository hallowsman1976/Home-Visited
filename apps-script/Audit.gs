function appendAudit_(event) {
  try {
    const now = new Date().toISOString();
    appendRecord_('AUDIT_LOGS', {
      audit_id: Utilities.getUuid(), occurred_at: now, request_id: event.requestId || '',
      actor_user_id: event.actorUserId || '', action_code: event.actionCode || '',
      entity_type: event.entityType || '', entity_id: event.entityId || '',
      organization_id: event.organizationId || '', outcome: event.outcome || 'SUCCESS',
      changed_fields_json: JSON.stringify(event.changedFields || []), reason: event.reason || '', ip_hash: ''
    });
  } catch (error) {
    console.error(JSON.stringify({ event: 'AUDIT_WRITE_FAILED', error: String(error), requestId: event.requestId || '' }));
  }
}

