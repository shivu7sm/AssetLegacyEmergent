"""API routes: scheduled messages."""
from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime

from core.auth import require_auth
from core.config import db
from core.models import ScheduledMessage, ScheduledMessageCreate, User

router = APIRouter()

# Scheduled Messages Routes
@router.get("/scheduled-messages", response_model=List[ScheduledMessage])
async def get_scheduled_messages(user: User = Depends(require_auth)):
    # Filter based on demo mode
    demo_prefix = f"demo_{user.id}_"
    if user.demo_mode:
        # Show only demo messages
        messages = await db.scheduled_messages.find({
            "user_id": user.id,
            "id": {"$regex": f"^{demo_prefix}"}
        }, {"_id": 0}).to_list(1000)
    else:
        # Show only live messages (exclude demo)
        messages = await db.scheduled_messages.find({
            "user_id": user.id,
            "id": {"$not": {"$regex": f"^{demo_prefix}"}}
        }, {"_id": 0}).to_list(1000)
    
    for msg in messages:
        if isinstance(msg.get('created_at'), str):
            msg['created_at'] = datetime.fromisoformat(msg['created_at'])
    return messages

@router.post("/scheduled-messages", response_model=ScheduledMessage)
async def create_scheduled_message(msg_data: ScheduledMessageCreate, user: User = Depends(require_auth)):
    message = ScheduledMessage(user_id=user.id, **msg_data.model_dump())
    msg_dict = message.model_dump()
    msg_dict['created_at'] = msg_dict['created_at'].isoformat()
    await db.scheduled_messages.insert_one(msg_dict)
    return message

@router.delete("/scheduled-messages/{message_id}")
async def delete_scheduled_message(message_id: str, user: User = Depends(require_auth)):
    result = await db.scheduled_messages.delete_one({"id": message_id, "user_id": user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Message not found")
    return {"success": True}
