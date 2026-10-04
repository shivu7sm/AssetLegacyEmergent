"""API routes: auth."""
from fastapi import APIRouter, HTTPException, Response, Request, Depends
import os
from datetime import datetime, timezone, timedelta
import requests

from core.auth import require_auth
from core.config import db, logger
from core.models import User, UserSession
from services.demo_seed import seed_demo_data

router = APIRouter()

# Auth Routes
@router.post("/auth/session")
async def create_session(request: Request, response: Response):
    session_id = request.headers.get("X-Session-ID")
    logger.info(f"Auth session request received, session_id present: {bool(session_id)}")
    
    if not session_id:
        logger.error("No session ID provided in request")
        raise HTTPException(status_code=400, detail="Session ID required")
    
    try:
        auth_backend_url = os.environ.get('AUTH_BACKEND_URL', 'https://demobackend.emergentagent.com')
        logger.info(f"Validating session with auth backend: {auth_backend_url}")
        auth_response = requests.get(
            f"{auth_backend_url}/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id},
            timeout=10
        )
        auth_response.raise_for_status()
        session_data = auth_response.json()
        logger.info(f"Session validated for email: {session_data.get('email')}")
    except Exception as e:
        logger.error(f"Failed to validate session: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to validate session: {str(e)}")
    
    existing_user = await db.users.find_one({"email": session_data["email"]})
    
    if not existing_user:
        # Check if this is the admin user
        admin_email = os.environ.get('ADMIN_EMAIL', 'shivu7sm@gmail.com')
        is_admin = session_data["email"] == admin_email
        
        # Get system default currency from preferences (can be configured later)
        default_currency = os.environ.get('DEFAULT_CURRENCY', 'USD')
        
        user = User(
            email=session_data["email"],
            name=session_data["name"],
            picture=session_data.get("picture"),
            role="admin" if is_admin else "customer",
            default_currency=default_currency,
            selected_currency=default_currency
        )
        user_dict = user.model_dump()
        user_dict['last_activity'] = user_dict['last_activity'].isoformat()
        user_dict['created_at'] = user_dict['created_at'].isoformat()
        await db.users.insert_one(user_dict)
        user_id = user.id
        
        # Auto-seed demo data for new users (since demo_mode defaults to True)
        await seed_demo_data(user_id)
    else:
        user_id = existing_user["id"]
        # If existing user is the admin email but not marked as admin, update them
        if session_data["email"] == os.environ.get('ADMIN_EMAIL', 'shivu7sm@gmail.com') and existing_user.get("role") != "admin":
            await db.users.update_one(
                {"email": session_data["email"]},
                {"$set": {"role": "admin"}}
            )
    
    session_token = session_data["session_token"]
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    user_session = UserSession(
        user_id=user_id,
        session_token=session_token,
        expires_at=expires_at
    )
    
    session_dict = user_session.model_dump()
    session_dict['expires_at'] = session_dict['expires_at'].isoformat()
    session_dict['created_at'] = session_dict['created_at'].isoformat()
    await db.user_sessions.insert_one(session_dict)
    
    # Detect if request came through HTTPS (via ingress/load balancer)
    # Check multiple headers that might indicate HTTPS
    forwarded_proto = request.headers.get("X-Forwarded-Proto", "")
    forwarded_ssl = request.headers.get("X-Forwarded-Ssl", "")
    
    # Determine if HTTPS based on headers or environment
    is_https = (
        forwarded_proto.lower() == "https" or
        forwarded_ssl.lower() == "on" or
        os.environ.get("ENVIRONMENT") == "production" or
        request.url.scheme == "https"
    )
    
    # Set cookie attributes depending on environment.
    # In production (ENVIRONMENT=production) keep secure=True and samesite="none" for cross-domain auth.
    # In local development, allow non-secure cookies so they can be set on http://localhost.
    is_production = os.environ.get('ENVIRONMENT') == 'production'
    cookie_secure = True if is_production else False
    cookie_samesite = "none" if is_production else "lax"

    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=cookie_secure,
        samesite=cookie_samesite,
        max_age=7 * 24 * 60 * 60,
        path="/"
    )

    logger.info(f"Session created for user {user_id}, cookie set (secure={cookie_secure}, samesite={cookie_samesite}, proto={forwarded_proto or 'none'})")
    
    # Reset DMS timer on login
    try:
        await db.dead_man_switches.update_one(
            {"user_id": user_id},
            {"$set": {"last_reset": datetime.now(timezone.utc).isoformat()}}
        )
        logger.info(f"DMS timer reset for user {user_id}")
    except Exception as e:
        logger.error(f"Failed to reset DMS timer: {str(e)}")
    
    # Get current user data for response (could be new or existing user)
    current_user = await db.users.find_one({"id": user_id}, {"_id": 0})
    
    # Also return token in response body as fallback for browsers that block third-party cookies
    return {
        "success": True,
        "session_token": session_token,  # Client can store this and send via Authorization header
        "user": {
            "id": user_id,
            "email": current_user["email"],
            "name": current_user.get("name", ""),
            "onboarding_completed": current_user.get("onboarding_completed", False)
        }
    }

@router.get("/auth/me")
async def get_me(user: User = Depends(require_auth)):
    return user

@router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"success": True}
