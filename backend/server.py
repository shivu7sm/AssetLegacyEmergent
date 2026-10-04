"""AssetVault API entry point (run with `uvicorn server:app`).

Routes live in routers/, shared logic in services/, and configuration,
models and auth dependencies in core/.
"""
import os

from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from core.config import client, logger
from routers import (
    auth,
    users,
    assets,
    nominees,
    dead_man_switch,
    digital_will,
    documents,
    prices,
    dashboard,
    audit,
    demo,
    subscription,
    scheduled_messages,
    insights,
    income_expense,
    budget,
    tax_blueprint,
    exchange_connections,
    portfolio,
    networth,
    admin,
    loan_calculator,
)
from scheduler import start_scheduler, stop_scheduler
from services.demo_seed import seed_universal_test_account

app = FastAPI()

# Registered in the order the routes were originally declared, so path
# matching precedence is unchanged.
for module in (
    auth,
    users,
    assets,
    nominees,
    dead_man_switch,
    digital_will,
    documents,
    prices,
    dashboard,
    audit,
    demo,
    subscription,
    scheduled_messages,
    insights,
    income_expense,
    budget,
    tax_blueprint,
    exchange_connections,
    portfolio,
    networth,
    admin,
    loan_calculator,
):
    app.include_router(module.router, prefix="/api")

# CORS configuration for production
# For cross-origin requests with credentials, we need specific origins
cors_origins_str = os.environ.get('CORS_ORIGINS', '')

if cors_origins_str and cors_origins_str != '*':
    # Production with specific origins configured
    cors_origins = [origin.strip() for origin in cors_origins_str.split(',')]
    allow_origin_regex = None
    logger.info(f"CORS: Configured for specific origins: {cors_origins}")
else:
    # Development/testing: Use regex to match common patterns
    # This allows any subdomain of emergent.host and emergentagent.com, plus localhost
    cors_origins = []  # Must be empty when using regex
    allow_origin_regex = r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$|^https://[a-zA-Z0-9\-]+\.(emergent\.host|emergentagent\.com)$|^https://zivinc\.com$"
    logger.info("CORS: Using regex pattern for development (supports localhost, *.emergent.host, *.emergentagent.com, zivinc.com)")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=cors_origins,
    allow_origin_regex=allow_origin_regex,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

@app.on_event("startup")
async def startup_scheduler():
    """Start the background job scheduler and seed test account"""
    logger.info("Starting background job scheduler...")
    start_scheduler()
    
    # Seed universal test account for demo mode
    await seed_universal_test_account()

@app.on_event("shutdown")
async def shutdown_db_client():
    """Shutdown database client and scheduler"""
    logger.info("Shutting down...")
    stop_scheduler()
    client.close()
