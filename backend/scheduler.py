"""
Background job scheduler for AssetVault
Handles:
- Dead Man Switch (DMS) checking and reminders
- Scheduled message sending
- Retry mechanisms for failed jobs
"""

import asyncio
import logging
from datetime import datetime, timezone, timedelta
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from motor.motor_asyncio import AsyncIOMotorClient
import os

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(MONGO_URL)
db = client['test_database']

# Initialize scheduler
scheduler = AsyncIOScheduler()

async def check_dms_and_send_reminders():
    """
    Check all active Dead Man Switches and send reminders/alerts
    Runs daily at 9 AM
    """
    logger.info("Starting DMS check...")
    try:
        # Get all active DMS
        dms_list = await db.dead_man_switches.find({"is_active": True}).to_list(1000)
        
        for dms in dms_list:
            user_id = dms["user_id"]
            inactivity_days = dms["inactivity_days"]
            reminders_sent = dms.get("reminders_sent", 0)
            
            # Get user's last activity
            user = await db.users.find_one({"id": user_id})
            if not user:
                continue
            
            last_activity = user.get("last_activity")
            if isinstance(last_activity, str):
                last_activity = datetime.fromisoformat(last_activity)
            
            # Calculate days inactive
            days_inactive = (datetime.now(timezone.utc) - last_activity).days
            
            # Reminder thresholds
            reminder_threshold = inactivity_days - 7  # Remind 7 days before trigger
            
            if days_inactive >= inactivity_days:
                # DMS TRIGGERED! Alert nominee
                logger.warning(f"DMS TRIGGERED for user {user['email']} - {days_inactive} days inactive")
                
                # Get nominee info
                nominee = await db.nominees.find_one({"user_id": user_id})
                if nominee:
                    # MOCK EMAIL: Send email to nominee with asset information
                    logger.info(f"📧 [MOCK EMAIL] Sending DMS Alert to nominee {nominee['email']}")
                    logger.info(f"   Subject: Important Alert from {user['name']}")
                    logger.info(f"   Message: Dead Man Switch activated for {user['email']}")
                    logger.info(f"   Action: Providing access to asset information")
                    
                    # Mark DMS as triggered
                    await db.dead_man_switches.update_one(
                        {"id": dms["id"]},
                        {"$set": {
                            "is_active": False,
                            "triggered_at": datetime.now(timezone.utc).isoformat()
                        }}
                    )
            
            elif days_inactive >= reminder_threshold and reminders_sent == 0:
                # Send first reminder to user
                logger.info(f"Sending reminder to {user['email']} - {days_inactive} days inactive")
                
                # MOCK EMAIL: Send email reminder to user
                logger.info(f"📧 [MOCK EMAIL] Sending DMS Reminder to {user['email']}")
                logger.info(f"   Subject: Activity Reminder - Dead Man Switch")
                logger.info(f"   Message: You've been inactive for {days_inactive} days")
                logger.info(f"   Warning: DMS will trigger in {inactivity_days - days_inactive} days")
                
                # Update reminders sent count
                await db.dead_man_switches.update_one(
                    {"id": dms["id"]},
                    {"$set": {"reminders_sent": 1}}
                )
        
        logger.info(f"DMS check complete. Checked {len(dms_list)} DMS configurations")
        
    except Exception as e:
        logger.error(f"Error in DMS check: {str(e)}")

async def send_scheduled_messages():
    """
    Check and send scheduled messages that are due
    Runs every hour
    """
    logger.info("Checking scheduled messages...")
    try:
        # Get messages that are scheduled and due
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        
        messages = await db.scheduled_messages.find({
            "status": "scheduled",
            "send_date": {"$lte": today}
        }).to_list(100)
        
        for message in messages:
            try:
                # MOCK EMAIL: Send email via SMTP or email service
                logger.info(f"📧 [MOCK EMAIL] Sending scheduled message")
                logger.info(f"   To: {message['recipient_email']}")
                logger.info(f"   Subject: {message['subject']}")
                logger.info(f"   Body: {message.get('body', 'N/A')[:100]}...")
                logger.info(f"   Status: Message sent successfully")
                
                # Mark as sent
                await db.scheduled_messages.update_one(
                    {"id": message["id"]},
                    {"$set": {
                        "status": "sent",
                        "sent_at": datetime.now(timezone.utc).isoformat()
                    }}
                )
                
                logger.info(f"Message sent successfully: {message['id']}")
                
            except Exception as e:
                logger.error(f"Failed to send message {message['id']}: {str(e)}")
                
                # Mark as failed and increment retry count
                retry_count = message.get("retry_count", 0)
                if retry_count < 3:  # Max 3 retries
                    await db.scheduled_messages.update_one(
                        {"id": message["id"]},
                        {"$set": {
                            "retry_count": retry_count + 1,
                            "last_error": str(e)
                        }}
                    )
                else:
                    # Max retries reached, mark as failed
                    await db.scheduled_messages.update_one(
                        {"id": message["id"]},
                        {"$set": {
                            "status": "failed",
                            "last_error": str(e),
                            "failed_at": datetime.now(timezone.utc).isoformat()
                        }}
                    )
        
        logger.info(f"Scheduled messages check complete. Processed {len(messages)} messages")
        
    except Exception as e:
        logger.error(f"Error in scheduled messages: {str(e)}")

async def retry_failed_messages():
    """
    Retry failed messages (runs once per day)
    """
    logger.info("Retrying failed messages...")
    try:
        # Get failed messages with retry count < 3
        failed_messages = await db.scheduled_messages.find({
            "status": "failed",
            "retry_count": {"$lt": 3}
        }).to_list(50)
        
        for message in failed_messages:
            try:
                # Reset to scheduled for retry
                await db.scheduled_messages.update_one(
                    {"id": message["id"]},
                    {"$set": {"status": "scheduled"}}
                )
                logger.info(f"Reset message {message['id']} for retry")
                
            except Exception as e:
                logger.error(f"Error resetting message {message['id']}: {str(e)}")
        
        logger.info(f"Retry complete. Reset {len(failed_messages)} messages")
        
    except Exception as e:
        logger.error(f"Error in retry failed messages: {str(e)}")

def start_scheduler():
    """Start all scheduled jobs"""
    try:
        # DMS check - Daily at 9 AM
        scheduler.add_job(
            check_dms_and_send_reminders,
            CronTrigger(hour=9, minute=0),
            id='dms_check',
            name='Check Dead Man Switches',
            replace_existing=True
        )
        
        # Scheduled messages - Every hour
        scheduler.add_job(
            send_scheduled_messages,
            CronTrigger(minute=0),  # Every hour at minute 0
            id='scheduled_messages',
            name='Send Scheduled Messages',
            replace_existing=True
        )
        
        # Retry failed messages - Daily at 10 AM
        scheduler.add_job(
            retry_failed_messages,
            CronTrigger(hour=10, minute=0),
            id='retry_failed',
            name='Retry Failed Messages',
            replace_existing=True
        )
        
        scheduler.start()
        logger.info("Scheduler started successfully")
        logger.info("Jobs configured:")
        logger.info("  - DMS check: Daily at 9:00 AM")
        logger.info("  - Scheduled messages: Every hour")
        logger.info("  - Retry failed: Daily at 10:00 AM")
        
    except Exception as e:
        logger.error(f"Failed to start scheduler: {str(e)}")

def stop_scheduler():
    """Stop the scheduler"""
    try:
        scheduler.shutdown()
        logger.info("Scheduler stopped")
    except Exception as e:
        logger.error(f"Error stopping scheduler: {str(e)}")
