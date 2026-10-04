"""Audit-log writer."""
from fastapi import Request

from core.config import db, logger
from core.models import AuditLog, User

# Helper function to log audit events
async def log_audit(user: User, action: str, resource_type: str, resource_id: str = None, 
                   changes: dict = None, request: Request = None):
    """Log an audit event."""
    try:
        ip_address = None
        user_agent = None
        
        if request:
            # Get IP from X-Forwarded-For or X-Real-IP headers (from proxy) or direct connection
            ip_address = request.headers.get("X-Forwarded-For", request.headers.get("X-Real-IP", request.client.host if request.client else None))
            user_agent = request.headers.get("User-Agent")
        
        audit_log = AuditLog(
            user_id=user.id,
            user_email=user.email,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            changes=changes,
            ip_address=ip_address,
            user_agent=user_agent,
            is_admin_action=(user.role == "admin")
        )
        
        log_dict = audit_log.model_dump()
        log_dict['timestamp'] = log_dict['timestamp'].isoformat()
        
        await db.audit_logs.insert_one(log_dict)
    except Exception as e:
        # Don't fail the main operation if audit logging fails
        logger.error(f"Failed to log audit event: {str(e)}")
