"""API routes: subscription."""
from fastapi import APIRouter, HTTPException, Request, Depends
import os
from datetime import datetime
import stripe

from core.auth import require_auth
from core.config import db, logger
from core.models import User
from services.subscriptions import SUBSCRIPTION_FEATURES, get_stripe_price_for_plan, get_user_storage_usage

router = APIRouter()

# Subscription Routes
@router.get("/subscription/current")
async def get_subscription(user: User = Depends(require_auth)):
    plan = getattr(user, 'subscription_plan', 'Free')
    features = SUBSCRIPTION_FEATURES.get(plan, SUBSCRIPTION_FEATURES["Free"])
    
    # Get current usage
    asset_count = await db.assets.count_documents({"user_id": user.id})
    document_count = await db.documents.count_documents({"user_id": user.id})
    storage_bytes = await get_user_storage_usage(user.id)
    storage_mb = storage_bytes / (1024 * 1024)
    
    # Get subscription details from Stripe if applicable
    subscription_details = None
    stripe_customer_id = getattr(user, 'stripe_customer_id', None)
    
    if stripe_customer_id and plan != 'Free':
        try:
            subscriptions = stripe.Subscription.list(
                customer=stripe_customer_id,
                status='all',
                limit=10
            )
            
            if subscriptions.data and len(subscriptions.data) > 0:
                sub = subscriptions.data[0]  # Get most recent subscription
                
                # Convert Stripe object to dict for easier access
                sub_dict = sub.to_dict()
                logger.info(f"Stripe subscription keys: {list(sub_dict.keys())}")
                logger.info(f"Subscription status: {sub_dict.get('status')}, cancel_at: {sub_dict.get('cancel_at')}")
                
                # Get payment method
                payment_method_info = None
                default_pm = sub_dict.get('default_payment_method')
                if default_pm:
                    try:
                        pm = stripe.PaymentMethod.retrieve(default_pm)
                        if pm.type == 'card':
                            payment_method_info = {
                                "type": "card",
                                "brand": pm.card.brand,
                                "last4": pm.card.last4,
                                "exp_month": pm.card.exp_month,
                                "exp_year": pm.card.exp_year
                            }
                    except Exception as pm_error:
                        logger.warning(f"Failed to fetch payment method: {str(pm_error)}")
                
                try:
                    # Calculate current period dates from billing cycle
                    billing_anchor = sub_dict.get('billing_cycle_anchor', sub_dict.get('created', 0))
                    current_time = int(datetime.now().timestamp())
                    
                    # Get the plan interval to calculate period
                    interval = sub_dict.get('items', {}).get('data', [{}])[0].get('price', {}).get('recurring', {}).get('interval', 'month')
                    interval_count = sub_dict.get('items', {}).get('data', [{}])[0].get('price', {}).get('recurring', {}).get('interval_count', 1)
                    
                    # Calculate period end based on interval
                    if interval == 'month':
                        from dateutil.relativedelta import relativedelta
                        period_start_dt = datetime.fromtimestamp(billing_anchor)
                        # Find the current period by adding months until we're past current time
                        periods_passed = 0
                        while True:
                            period_end_dt = period_start_dt + relativedelta(months=interval_count * (periods_passed + 1))
                            if period_end_dt.timestamp() > current_time:
                                period_start_dt = period_start_dt + relativedelta(months=interval_count * periods_passed)
                                break
                            periods_passed += 1
                    else:
                        # For non-monthly intervals, use billing anchor as start
                        period_start_dt = datetime.fromtimestamp(billing_anchor)
                        period_end_dt = datetime.fromtimestamp(sub_dict.get('cancel_at', billing_anchor))
                    
                    subscription_details = {
                        "subscription_id": sub_dict.get('id'),
                        "status": sub_dict.get('status'),
                        "current_period_start": period_start_dt.isoformat(),
                        "current_period_end": period_end_dt.isoformat(),
                        "cancel_at_period_end": sub_dict.get('cancel_at_period_end', False),
                        "cancel_at": datetime.fromtimestamp(sub_dict['cancel_at']).isoformat() if sub_dict.get('cancel_at') else None,
                        "canceled_at": datetime.fromtimestamp(sub_dict['canceled_at']).isoformat() if sub_dict.get('canceled_at') else None,
                        "created": datetime.fromtimestamp(sub_dict.get('created', 0)).isoformat(),
                        "payment_method": payment_method_info,
                        "amount": sub_dict['items']['data'][0]['price']['unit_amount'] / 100 if sub_dict.get('items') and sub_dict['items'].get('data') else 0,
                        "currency": sub_dict['items']['data'][0]['price']['currency'].upper() if sub_dict.get('items') and sub_dict['items'].get('data') else "USD",
                        "interval": interval
                    }
                except (KeyError, IndexError, TypeError) as parse_err:
                    logger.error(f"Failed to parse subscription details: {str(parse_err)}")
                    subscription_details = None
        except Exception as e:
            logger.error(f"Failed to fetch Stripe subscription details: {str(e)}")
    
    return {
        "plan": plan,
        "status": "active" if plan != 'Free' else None,
        "features": features,
        "usage": {
            "assets": asset_count,
            "documents": document_count,
            "storage_mb": round(storage_mb, 2),
            "storage_bytes": storage_bytes
        },
        "limits": {
            "assets_remaining": features["max_assets"] - asset_count if features["max_assets"] > 0 else -1,
            "documents_remaining": features["max_documents"] - document_count if features["max_documents"] > 0 else -1,
            "storage_remaining_mb": features["storage_mb"] - storage_mb if features["storage_mb"] > 0 else -1
        },
        "subscription_details": subscription_details
    }

@router.post("/subscription/verify-and-update")
async def verify_and_update_subscription(user: User = Depends(require_auth)):
    """
    Manually verify subscription status with Stripe and update local database.
    Useful as fallback when webhooks don't fire.
    """
    try:
        stripe_customer_id = getattr(user, 'stripe_customer_id', None)
        if not stripe_customer_id:
            return {"plan": "Free", "updated": False}
        
        # Fetch active subscriptions from Stripe
        subscriptions = stripe.Subscription.list(
            customer=stripe_customer_id,
            status='active',
            limit=10
        )
        
        if subscriptions.data and len(subscriptions.data) > 0:
            # Get the first active subscription
            subscription = subscriptions.data[0]
            price_id = subscription['items']['data'][0]['price']['id']
            
            # Determine plan based on price amount
            price = stripe.Price.retrieve(price_id)
            plan = "Pro" if price.unit_amount == 999 else "Family" if price.unit_amount == 2499 else "Free"
            
            # Update database
            await db.users.update_one(
                {"id": user.id},
                {"$set": {
                    "subscription_plan": plan,
                    "stripe_subscription_id": subscription['id']
                }}
            )
            
            logger.info(f"Updated subscription for {user.email}: {plan}")
            return {"plan": plan, "updated": True}
        else:
            # No active subscription found
            await db.users.update_one(
                {"id": user.id},
                {"$set": {"subscription_plan": "Free"}}
            )
            return {"plan": "Free", "updated": True}
            
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error verifying subscription: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to verify subscription")
    except Exception as e:
        logger.error(f"Error verifying subscription: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/subscription/create-checkout-session")
async def create_checkout_session(data: dict, user: User = Depends(require_auth)):
    try:
        plan = data.get('plan')
        logger.info(f"Creating checkout session for user {user.email}, plan: {plan}")
        
        # Get price ID based on plan (with dynamic fetching from product)
        price_id = await get_stripe_price_for_plan(plan)
        logger.info(f"Found price ID: {price_id}")
        
        # Create or retrieve Stripe customer
        stripe_customer_id = getattr(user, 'stripe_customer_id', None)
        if not stripe_customer_id:
            customer = stripe.Customer.create(
                email=user.email,
                name=user.name,
                metadata={"user_id": user.id}
            )
            stripe_customer_id = customer.id
            await db.users.update_one(
                {"id": user.id},
                {"$set": {"stripe_customer_id": stripe_customer_id}}
            )
        
        # Create checkout session
        # Get frontend URL - use FRONTEND_URL env var or derive from request
        frontend_url = os.environ.get('FRONTEND_URL')
        if not frontend_url:
            # Fallback: try to get from CORS_ORIGINS if it's not '*'
            cors_origins = os.environ.get('CORS_ORIGINS', '')
            if cors_origins and cors_origins != '*':
                frontend_url = cors_origins.split(',')[0]
            else:
                # Last resort: use the backend URL domain (they're usually the same in preview)
                frontend_url = os.environ.get('FRONTEND_URL', os.environ.get('APP_URL', 'https://wealth-tracker-fix.preview.emergentagent.com'))
        
        # Ensure URL has scheme
        if not frontend_url.startswith('http'):
            frontend_url = f"https://{frontend_url}"
        
        session = stripe.checkout.Session.create(
            customer=stripe_customer_id,
            payment_method_types=['card'],
            mode='subscription',
            line_items=[{'price': price_id, 'quantity': 1}],
            success_url=f"{frontend_url}/subscription?success=true",
            cancel_url=f"{frontend_url}/subscription?canceled=true",
            metadata={"user_id": user.id, "plan": plan}
        )
        
        logger.info(f"Checkout session created: {session.id}, URL: {session.url}")
        return {"sessionId": session.id, "url": session.url}
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error in checkout session: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create checkout session: {str(e)}")

@router.post("/subscription/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    webhook_secret = os.environ.get('STRIPE_WEBHOOK_SECRET')
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, webhook_secret
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Handle events
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        user_id = session['metadata']['user_id']
        plan = session['metadata']['plan']
        
        await db.users.update_one(
            {"id": user_id},
            {"$set": {
                "subscription_plan": plan,
                "stripe_subscription_id": session.get('subscription')
            }}
        )
    elif event['type'] == 'customer.subscription.deleted':
        subscription = event['data']['object']
        await db.users.update_one(
            {"stripe_subscription_id": subscription['id']},
            {"$set": {"subscription_plan": "Free", "stripe_subscription_id": None}}
        )
    
    return {"status": "success"}

@router.post("/subscription/cancel")
async def cancel_subscription(user: User = Depends(require_auth)):
    try:
        subscription_id = getattr(user, 'stripe_subscription_id', None)
        
        # If no subscription ID, user might be on Free plan or subscription was already reset
        if not subscription_id:
            # Reset to Free plan just in case
            await db.users.update_one(
                {"id": user.id},
                {"$set": {"subscription_plan": "Free"}, "$unset": {"stripe_customer_id": "", "stripe_subscription_id": ""}}
            )
            return {"success": True, "message": "Already on Free plan"}
        
        # Cancel subscription in Stripe
        try:
            stripe.Subscription.modify(subscription_id, cancel_at_period_end=True)
        except stripe.error.InvalidRequestError as e:
            # Subscription doesn't exist in Stripe, clean up local DB
            logger.warning(f"Subscription {subscription_id} not found in Stripe, cleaning up: {str(e)}")
            await db.users.update_one(
                {"id": user.id},
                {"$set": {"subscription_plan": "Free"}, "$unset": {"stripe_customer_id": "", "stripe_subscription_id": ""}}
            )
            return {"success": True, "message": "Subscription reset to Free plan"}
        
        await db.users.update_one(
            {"id": user.id},
            {"$set": {"subscription_status": "canceling"}}
        )
        
        return {"success": True, "message": "Subscription will be canceled at period end"}
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/subscription/reactivate")
async def reactivate_subscription(user: User = Depends(require_auth)):
    try:
        subscription_id = getattr(user, 'stripe_subscription_id', None)
        if not subscription_id:
            raise HTTPException(status_code=400, detail="No subscription to reactivate")
        
        # Reactivate subscription in Stripe
        stripe.Subscription.modify(subscription_id, cancel_at_period_end=False)
        
        await db.users.update_one(
            {"id": user.id},
            {"$set": {"subscription_status": "active"}}
        )
        
        return {"success": True, "message": "Subscription reactivated"}
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
