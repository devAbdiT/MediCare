import prisma from "@/lib/prisma";

interface AuditLogPayload {
  userId: string;
  userRole: string;
  action: string;
  entity: string;
  entityId?: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
}

export async function createAuditLog({
  userId,
  userRole,
  action,
  entity,
  entityId,
  oldValues,
  newValues,
  ipAddress,
}: AuditLogPayload): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        userRole,
        action,
        entity,
        entityId,
        oldValues: oldValues ? JSON.parse(JSON.stringify(oldValues)) : null,
        newValues: newValues ? JSON.parse(JSON.stringify(newValues)) : null,
        ipAddress,
      },
    });
  } catch (error) {
    // Wrap in try/catch so it never breaks the main operation
    console.error("[Audit Log Error] Failed to create audit log:", error);
  }
}
