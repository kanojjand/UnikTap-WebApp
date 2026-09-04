import 'server-only'
import { createAdminClient } from './supabase/admin'

/** Каждая мутация в админке пишет запись в audit_log (раздел 8.1). */
export async function writeAudit(entry: {
  actorId: string | null
  action: 'insert' | 'update' | 'delete' | 'restore' | 'moderate' | 'login' | 'export' | 'settings'
  entity: string
  entityId?: string | null
  before?: unknown
  after?: unknown
}) {
  try {
    const admin = createAdminClient()
    await admin.from('audit_log').insert({
      actor_id: entry.actorId,
      action: entry.action,
      entity: entry.entity,
      entity_id: entry.entityId ?? null,
      before: entry.before ?? null,
      after: entry.after ?? null,
    })
  } catch (error) {
    console.error('audit_log write failed', error)
  }
}
