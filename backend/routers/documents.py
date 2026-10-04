"""API routes: documents."""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone

from core.auth import require_auth
from core.config import db
from core.models import Document, DocumentCreate, User
from services.subscriptions import SUBSCRIPTION_FEATURES, get_user_storage_usage

router = APIRouter()

# Document Routes
@router.get("/documents")
async def get_documents(user: User = Depends(require_auth)):
    # Filter based on demo mode
    demo_prefix = f"demo_{user.id}_"
    if user.demo_mode:
        # Show only demo documents
        documents = await db.documents.find({
            "user_id": user.id,
            "id": {"$regex": f"^{demo_prefix}"}
        }, {"_id": 0, "file_data": 0}).to_list(1000)
    else:
        # Show only live documents (exclude demo)
        documents = await db.documents.find({
            "user_id": user.id,
            "id": {"$not": {"$regex": f"^{demo_prefix}"}}
        }, {"_id": 0, "file_data": 0}).to_list(1000)
    
    for doc in documents:
        if isinstance(doc.get('created_at'), str):
            doc['created_at'] = datetime.fromisoformat(doc['created_at'])
        if isinstance(doc.get('updated_at'), str):
            doc['updated_at'] = datetime.fromisoformat(doc['updated_at'])
    return documents

@router.get("/documents/{doc_id}")
async def get_document(doc_id: str, user: User = Depends(require_auth)):
    document = await db.documents.find_one({"id": doc_id, "user_id": user.id}, {"_id": 0})
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    if isinstance(document.get('created_at'), str):
        document['created_at'] = datetime.fromisoformat(document['created_at'])
    if isinstance(document.get('updated_at'), str):
        document['updated_at'] = datetime.fromisoformat(document['updated_at'])
    return document

@router.post("/documents")
async def create_document(doc_data: DocumentCreate, user: User = Depends(require_auth)):
    # Check subscription limits
    plan = getattr(user, 'subscription_plan', 'Free')
    features = SUBSCRIPTION_FEATURES.get(plan, SUBSCRIPTION_FEATURES["Free"])
    
    # Check document count limit
    if features["max_documents"] > 0:
        current_count = await db.documents.count_documents({"user_id": user.id})
        if current_count >= features["max_documents"]:
            raise HTTPException(
                status_code=403,
                detail=f"Document limit reached. Your {plan} plan allows {features['max_documents']} documents. Upgrade to add more."
            )
    
    # Check storage limit
    storage_bytes = await get_user_storage_usage(user.id)
    storage_mb = storage_bytes / (1024 * 1024)
    new_file_mb = doc_data.file_size / (1024 * 1024)
    
    if features["storage_mb"] > 0:
        if (storage_mb + new_file_mb) > features["storage_mb"]:
            raise HTTPException(
                status_code=403,
                detail=f"Storage limit exceeded. Your {plan} plan allows {features['storage_mb']} MB. Current: {storage_mb:.1f} MB, New file: {new_file_mb:.1f} MB. Upgrade for more storage."
            )
    
    document = Document(user_id=user.id, **doc_data.model_dump())
    doc_dict = document.model_dump()
    doc_dict['created_at'] = doc_dict['created_at'].isoformat()
    doc_dict['updated_at'] = doc_dict['updated_at'].isoformat()
    await db.documents.insert_one(doc_dict)
    
    # Fetch the document back without _id and file_data
    created_doc = await db.documents.find_one(
        {"id": document.id, "user_id": user.id},
        {"_id": 0, "file_data": 0}
    )
    
    if created_doc:
        # Convert datetime strings back to datetime objects for response
        if isinstance(created_doc.get('created_at'), str):
            created_doc['created_at'] = datetime.fromisoformat(created_doc['created_at'])
        if isinstance(created_doc.get('updated_at'), str):
            created_doc['updated_at'] = datetime.fromisoformat(created_doc['updated_at'])
        return created_doc
    
    raise HTTPException(status_code=500, detail="Failed to create document")

@router.delete("/documents/{doc_id}")
async def delete_document(doc_id: str, user: User = Depends(require_auth)):
    result = await db.documents.delete_one({"id": doc_id, "user_id": user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"success": True}

@router.put("/documents/{document_id}/link-asset")
async def link_document_to_asset(document_id: str, asset_data: dict, user: User = Depends(require_auth)):
    """Link a document to an asset"""
    asset_id = asset_data.get("asset_id")
    
    # Verify document exists and belongs to user
    document = await db.documents.find_one({"id": document_id, "user_id": user.id})
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # If asset_id provided, verify it exists and belongs to user
    if asset_id:
        asset = await db.assets.find_one({"id": asset_id, "user_id": user.id})
        if not asset:
            raise HTTPException(status_code=404, detail="Asset not found")
    
    # Update document with linked asset
    result = await db.documents.update_one(
        {"id": document_id},
        {"$set": {"linked_asset_id": asset_id, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Failed to link document")
    
    return {"success": True, "message": "Document linked successfully"}
