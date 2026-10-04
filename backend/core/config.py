"""Environment, database client and shared service clients."""
import logging
import os
from pathlib import Path

import stripe
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from pycoingecko import CoinGeckoAPI

ROOT_DIR = Path(__file__).resolve().parent.parent
# Load .env file but don't override existing environment variables (from Kubernetes)
load_dotenv(ROOT_DIR / '.env', override=False)

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

cg = CoinGeckoAPI()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("server")

# Stripe configuration
stripe.api_key = os.environ.get('STRIPE_SECRET_KEY', 'sk_test_placeholder')
