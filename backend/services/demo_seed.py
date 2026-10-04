"""Demo-mode and universal test-account seed data."""
from datetime import datetime, timezone, timedelta

from core.config import db, logger

async def seed_demo_data(user_id: str, force: bool = False):
    """Create comprehensive demo data for user with realistic values"""
    demo_prefix = f"demo_{user_id}_"
    
    # Check if demo data already exists (skip if not forcing)
    if not force:
        existing_demo = await db.assets.find_one({"user_id": user_id, "id": {"$regex": f"^{demo_prefix}"}})
        if existing_demo:
            return  # Demo data already exists
    
    # Demo Assets - Expanded with more realistic data
    demo_assets = [
        # Bank Accounts
        {
            "id": f"{demo_prefix}bank1",
            "user_id": user_id,
            "name": "Chase Checking Account",
            "type": "bank",
            "purchase_currency": "USD",
            "purchase_date": "2023-01-15",
            "total_value": 15000,
            "current_value": 15000,
            "details": {
                "account_number": "****1234",
                "bank_name": "Chase Bank",
                "account_type": "Checking"
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}bank2",
            "user_id": user_id,
            "name": "Savings Account - Emergency Fund",
            "type": "bank",
            "purchase_currency": "USD",
            "purchase_date": "2022-06-10",
            "total_value": 45000,
            "current_value": 45000,
            "details": {
                "account_number": "****5678",
                "bank_name": "Bank of America",
                "account_type": "Savings"
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}bank3",
            "user_id": user_id,
            "name": "Wells Fargo Money Market",
            "type": "bank",
            "purchase_currency": "USD",
            "purchase_date": "2023-03-01",
            "total_value": 28000,
            "current_value": 28500,
            "details": {
                "account_number": "****9012",
                "bank_name": "Wells Fargo",
                "account_type": "Money Market"
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}bank4",
            "user_id": user_id,
            "name": "HSBC UK Savings Account",
            "type": "bank",
            "purchase_currency": "GBP",
            "purchase_date": "2023-02-20",
            "total_value": 18000,
            "current_value": 18500,
            "details": {
                "account_number": "****7890",
                "bank_name": "HSBC UK",
                "account_type": "Savings"
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        # Crypto
        {
            "id": f"{demo_prefix}crypto1",
            "user_id": user_id,
            "name": "Bitcoin Holdings",
            "type": "crypto",
            "symbol": "BTC",
            "purchase_currency": "USD",
            "purchase_date": "2023-03-20",
            "quantity": 0.75,
            "unit_price": 40000,
            "current_unit_price": 95000,
            "total_value": 30000,
            "current_value": 71250,
            "details": {
                "wallet_address": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
                "crypto_type": "BTC"
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}crypto2",
            "user_id": user_id,
            "name": "Ethereum Holdings",
            "type": "crypto",
            "symbol": "ETH",
            "purchase_currency": "USD",
            "purchase_date": "2023-05-15",
            "quantity": 8,
            "unit_price": 2200,
            "current_unit_price": 3500,
            "total_value": 17600,
            "current_value": 28000,
            "details": {
                "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
                "crypto_type": "ETH"
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}crypto3",
            "user_id": user_id,
            "name": "Solana Holdings - EUR Account",
            "type": "crypto",
            "symbol": "SOL",
            "purchase_currency": "EUR",
            "purchase_date": "2023-09-10",
            "quantity": 100,
            "unit_price": 20,
            "current_unit_price": 110,
            "total_value": 2000,
            "current_value": 11000,
            "details": {
                "wallet_address": "SoL9x1...AbC123",
                "crypto_type": "SOL"
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        # Stocks
        {
            "id": f"{demo_prefix}stock1",
            "user_id": user_id,
            "name": "Apple Inc.",
            "type": "stock",
            "symbol": "AAPL",
            "purchase_currency": "USD",
            "purchase_date": "2023-02-15",
            "quantity": 150,
            "unit_price": 150,
            "current_unit_price": 230,
            "total_value": 22500,
            "current_value": 34500,
            "details": {
                "ticker": "AAPL",
                "broker": "Robinhood"
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}stock2",
            "user_id": user_id,
            "name": "Tesla Inc.",
            "type": "stock",
            "symbol": "TSLA",
            "purchase_currency": "USD",
            "purchase_date": "2023-06-20",
            "quantity": 50,
            "unit_price": 250,
            "current_unit_price": 380,
            "total_value": 12500,
            "current_value": 19000,
            "details": {
                "ticker": "TSLA",
                "broker": "E*TRADE"
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}stock3",
            "user_id": user_id,
            "name": "Microsoft Corporation",
            "type": "stock",
            "symbol": "MSFT",
            "purchase_currency": "USD",
            "purchase_date": "2022-11-10",
            "quantity": 80,
            "unit_price": 280,
            "current_unit_price": 425,
            "total_value": 22400,
            "current_value": 34000,
            "details": {
                "ticker": "MSFT",
                "broker": "Fidelity"
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        # Real Estate
        {
            "id": f"{demo_prefix}property1",
            "user_id": user_id,
            "name": "Family Home - Austin, TX",
            "type": "property",
            "purchase_currency": "USD",
            "purchase_date": "2020-05-10",
            "area": 2500,
            "area_unit": "sqft",
            "price_per_area": 160,
            "current_price_per_area": 220,
            "total_value": 400000,
            "current_value": 550000,
            "location": {
                "address": "123 Oak Street, Austin, TX 78701",
                "lat": "",
                "lng": ""
            },
            "details": {
                "property_type": "Residential",
                "area": 2500,
                "price_per_area": 160,
                "current_price_per_area": 220,
                "location": "Austin, TX"
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}property2",
            "user_id": user_id,
            "name": "Rental Property - Miami",
            "type": "property",
            "purchase_currency": "USD",
            "purchase_date": "2021-08-15",
            "area": 1200,
            "area_unit": "sqft",
            "price_per_area": 180,
            "current_price_per_area": 210,
            "total_value": 216000,
            "current_value": 252000,
            "location": {
                "address": "456 Beach Blvd, Miami, FL 33139",
                "lat": "",
                "lng": ""
            },
            "details": {
                "property_type": "Rental",
                "monthly_rental_income": 2800
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}property3",
            "user_id": user_id,
            "name": "London Apartment Investment",
            "type": "property",
            "purchase_currency": "GBP",
            "purchase_date": "2022-04-10",
            "area": 800,
            "area_unit": "sqft",
            "price_per_area": 600,
            "current_price_per_area": 720,
            "total_value": 480000,
            "current_value": 576000,
            "location": {
                "address": "Baker Street, London, UK",
                "lat": "",
                "lng": ""
            },
            "details": {
                "property_type": "Rental",
                "monthly_rental_income": 2500
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        # Investments
        {
            "id": f"{demo_prefix}investment1",
            "user_id": user_id,
            "name": "401(k) Retirement Fund",
            "type": "investment",
            "purchase_currency": "USD",
            "purchase_date": "2018-01-01",
            "total_value": 85000,
            "current_value": 125000,
            "details": {
                "investment_type": "401k",
                "provider": "Vanguard",
                "annual_contribution": 19500
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}investment2",
            "user_id": user_id,
            "name": "Roth IRA",
            "type": "investment",
            "purchase_currency": "USD",
            "purchase_date": "2019-03-15",
            "total_value": 32000,
            "current_value": 48000,
            "details": {
                "investment_type": "Roth IRA",
                "provider": "Fidelity",
                "annual_contribution": 6500
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        # Insurance
        {
            "id": f"{demo_prefix}insurance1",
            "user_id": user_id,
            "name": "Life Insurance Policy",
            "type": "insurance",
            "purchase_currency": "USD",
            "purchase_date": "2021-08-01",
            "total_value": 750000,
            "current_value": 750000,
            "details": {
                "policy_number": "LI-2021-12345",
                "provider": "State Farm",
                "policy_type": "Term Life",
                "premium": 150,
                "coverage_amount": 750000
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        # Precious Metals
        {
            "id": f"{demo_prefix}precious1",
            "user_id": user_id,
            "name": "Gold Bars",
            "type": "precious_metals",
            "purchase_currency": "USD",
            "purchase_date": "2022-11-05",
            "weight": 300,
            "weight_unit": "gram",
            "purity": "99.9%",
            "unit_price": 60,
            "current_unit_price": 70,
            "total_value": 18000,
            "current_value": 21000,
            "details": {
                "purity": "99.9%",
                "weight": "300g",
                "storage": "Bank Locker"
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}precious2",
            "user_id": user_id,
            "name": "Silver Coins Collection",
            "type": "precious_metals",
            "purchase_currency": "USD",
            "purchase_date": "2023-04-20",
            "weight": 1000,
            "weight_unit": "gram",
            "purity": "92.5%",
            "unit_price": 0.75,
            "current_unit_price": 0.90,
            "total_value": 750,
            "current_value": 900,
            "details": {
                "purity": "92.5%",
                "weight": "1kg",
                "type": "American Eagle coins"
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        # Liabilities
        {
            "id": f"{demo_prefix}loan1",
            "user_id": user_id,
            "name": "Home Mortgage",
            "type": "loan",
            "purchase_currency": "USD",
            "purchase_date": "2020-05-10",
            "principal_amount": 350000,
            "interest_rate": 3.5,
            "tenure_months": 360,
            "total_value": 350000,
            "current_value": 310000,
            "details": {
                "loan_type": "Mortgage",
                "bank_name": "Wells Fargo",
                "interest_rate": 3.5,
                "emi_amount": 1800,
                "tenure_months": 360,
                "remaining_months": 312
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}credit1",
            "user_id": user_id,
            "name": "Chase Sapphire Credit Card",
            "type": "credit_card",
            "purchase_currency": "USD",
            "purchase_date": "2023-01-01",
            "total_value": 5200,
            "current_value": 5200,
            "details": {
                "card_number": "****4321",
                "interest_rate": 18.99,
                "credit_limit": 25000,
                "min_payment": 150
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}loan2",
            "user_id": user_id,
            "name": "Car Loan - Tesla Model Y",
            "type": "loan",
            "purchase_currency": "USD",
            "purchase_date": "2023-07-01",
            "principal_amount": 55000,
            "interest_rate": 4.5,
            "tenure_months": 60,
            "total_value": 55000,
            "current_value": 48000,
            "details": {
                "loan_type": "Auto Loan",
                "bank_name": "Tesla Financing",
                "interest_rate": 4.5,
                "emi_amount": 1025,
                "tenure_months": 60,
                "remaining_months": 52
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}loan3",
            "user_id": user_id,
            "name": "Personal Loan",
            "type": "loan",
            "purchase_currency": "USD",
            "purchase_date": "2024-01-15",
            "principal_amount": 15000,
            "interest_rate": 8.99,
            "tenure_months": 36,
            "total_value": 15000,
            "current_value": 12500,
            "details": {
                "loan_type": "Personal Loan",
                "bank_name": "Bank of America",
                "interest_rate": 8.99,
                "emi_amount": 475,
                "tenure_months": 36,
                "remaining_months": 28
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}loan4",
            "user_id": user_id,
            "name": "Student Loan",
            "type": "loan",
            "purchase_currency": "USD",
            "purchase_date": "2018-09-01",
            "principal_amount": 45000,
            "interest_rate": 5.5,
            "tenure_months": 120,
            "total_value": 45000,
            "current_value": 28000,
            "details": {
                "loan_type": "Student Loan",
                "bank_name": "Federal Student Aid",
                "interest_rate": 5.5,
                "emi_amount": 485,
                "tenure_months": 120,
                "remaining_months": 62
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}loan5",
            "user_id": user_id,
            "name": "Business Loan",
            "type": "loan",
            "purchase_currency": "USD",
            "purchase_date": "2023-03-20",
            "principal_amount": 75000,
            "interest_rate": 6.75,
            "tenure_months": 84,
            "total_value": 75000,
            "current_value": 68000,
            "details": {
                "loan_type": "Business Loan",
                "bank_name": "Chase Business Banking",
                "interest_rate": 6.75,
                "emi_amount": 1150,
                "tenure_months": 84,
                "remaining_months": 72
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}credit2",
            "user_id": user_id,
            "name": "Amex Platinum Card",
            "type": "credit_card",
            "purchase_currency": "USD",
            "purchase_date": "2022-06-15",
            "total_value": 3800,
            "current_value": 3800,
            "details": {
                "card_number": "****8765",
                "interest_rate": 21.99,
                "credit_limit": 50000,
                "min_payment": 120
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}loan6",
            "user_id": user_id,
            "name": "Home Equity Line of Credit",
            "type": "loan",
            "purchase_currency": "USD",
            "purchase_date": "2023-11-01",
            "principal_amount": 50000,
            "interest_rate": 7.25,
            "tenure_months": 120,
            "total_value": 50000,
            "current_value": 48000,
            "details": {
                "loan_type": "HELOC",
                "bank_name": "Citibank",
                "interest_rate": 7.25,
                "emi_amount": 590,
                "tenure_months": 120,
                "remaining_months": 116
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        # New Asset Types - Multi-country
        {
            "id": f"{demo_prefix}vehicle1",
            "user_id": user_id,
            "name": "Tesla Model Y - 2023",
            "type": "vehicle",
            "purchase_currency": "USD",
            "purchase_date": "2023-07-01",
            "total_value": 65000,
            "current_value": 52000,
            "details": {
                "make": "Tesla",
                "model": "Model Y",
                "year": 2023,
                "vin": "5YJ3E1EB8PF123456",
                "license_plate": "CAL-1234",
                "mileage": 12500
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}art1",
            "user_id": user_id,
            "name": "Contemporary Art Collection",
            "type": "art",
            "purchase_currency": "USD",
            "purchase_date": "2022-09-15",
            "total_value": 35000,
            "current_value": 42000,
            "details": {
                "artist": "Various Artists",
                "pieces": 5,
                "authenticated": True,
                "storage": "Climate-controlled vault"
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}nft1",
            "user_id": user_id,
            "name": "Bored Ape NFT #4521",
            "type": "nft",
            "purchase_currency": "ETH",
            "purchase_date": "2023-04-12",
            "quantity": 1,
            "unit_price": 45,
            "current_unit_price": 38,
            "total_value": 45,
            "current_value": 38,
            "details": {
                "collection": "Bored Ape Yacht Club",
                "token_id": "4521",
                "blockchain": "Ethereum",
                "wallet": "0x742d35Cc..."
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        # Singapore Assets
        {
            "id": f"{demo_prefix}sg_bank1",
            "user_id": user_id,
            "name": "DBS Singapore Savings Account",
            "type": "bank",
            "purchase_currency": "SGD",
            "purchase_date": "2023-01-10",
            "total_value": 65000,
            "current_value": 66500,
            "details": {
                "account_number": "****3456",
                "bank_name": "DBS Bank",
                "account_type": "High-Yield Savings",
                "country": "Singapore"
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}sg_property1",
            "user_id": user_id,
            "name": "Condo Unit - Marina Bay",
            "type": "property",
            "purchase_currency": "SGD",
            "purchase_date": "2021-06-20",
            "area": 1000,
            "area_unit": "sqft",
            "price_per_area": 1800,
            "current_price_per_area": 2100,
            "total_value": 1800000,
            "current_value": 2100000,
            "location": {
                "address": "Marina Bay Residences, Singapore",
                "lat": "",
                "lng": ""
            },
            "details": {
                "property_type": "Condominium",
                "country": "Singapore"
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        # India Assets
        {
            "id": f"{demo_prefix}india_fd1",
            "user_id": user_id,
            "name": "ICICI Bank Fixed Deposit",
            "type": "investment",
            "purchase_currency": "INR",
            "purchase_date": "2023-02-01",
            "total_value": 500000,
            "current_value": 525000,
            "details": {
                "investment_type": "Fixed Deposit",
                "provider": "ICICI Bank",
                "interest_rate": 7.5,
                "maturity_date": "2026-02-01",
                "country": "India"
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}india_gold1",
            "user_id": user_id,
            "name": "Gold Jewelry Collection",
            "type": "precious_metals",
            "purchase_currency": "INR",
            "purchase_date": "2022-10-15",
            "weight": 500,
            "weight_unit": "gram",
            "purity": "22K",
            "unit_price": 5000,
            "current_unit_price": 6200,
            "total_value": 2500000,
            "current_value": 3100000,
            "details": {
                "purity": "22K",
                "storage": "Bank Locker - Mumbai",
                "country": "India"
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        # Australia Assets
        {
            "id": f"{demo_prefix}au_stock1",
            "user_id": user_id,
            "name": "Commonwealth Bank Shares",
            "type": "stock",
            "symbol": "CBA.AX",
            "purchase_currency": "AUD",
            "purchase_date": "2023-03-20",
            "quantity": 200,
            "unit_price": 95,
            "current_unit_price": 108,
            "total_value": 19000,
            "current_value": 21600,
            "details": {
                "ticker": "CBA.AX",
                "broker": "CommSec",
                "country": "Australia"
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}au_property1",
            "user_id": user_id,
            "name": "Investment Apartment - Sydney",
            "type": "property",
            "purchase_currency": "AUD",
            "purchase_date": "2022-05-10",
            "area": 900,
            "area_unit": "sqft",
            "price_per_area": 800,
            "current_price_per_area": 920,
            "total_value": 720000,
            "current_value": 828000,
            "location": {
                "address": "Darling Harbour, Sydney, Australia",
                "lat": "",
                "lng": ""
            },
            "details": {
                "property_type": "Apartment",
                "monthly_rental_income": 3200,
                "country": "Australia"
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        # Mutual Funds
        {
            "id": f"{demo_prefix}mf1",
            "user_id": user_id,
            "name": "Vanguard S&P 500 Index Fund",
            "type": "mutual_fund",
            "purchase_currency": "USD",
            "purchase_date": "2022-01-15",
            "total_value": 45000,
            "current_value": 58000,
            "details": {
                "fund_name": "Vanguard S&P 500",
                "ticker": "VFIAX",
                "expense_ratio": 0.04,
                "country": "USA"
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}india_mf1",
            "user_id": user_id,
            "name": "SBI Bluechip Fund",
            "type": "mutual_fund",
            "purchase_currency": "INR",
            "purchase_date": "2022-08-10",
            "total_value": 300000,
            "current_value": 385000,
            "details": {
                "fund_name": "SBI Bluechip Fund",
                "folio_number": "12345678",
                "units": 5000,
                "country": "India"
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.assets.insert_many(demo_assets)
    
    # Demo Portfolio
    demo_portfolio_id = f"{demo_prefix}portfolio1"
    demo_portfolio = {
        "id": demo_portfolio_id,
        "user_id": user_id,
        "name": "Binance Trading Account",
        "provider_name": "binance",
        "provider_type": "crypto_exchange",
        "purchase_currency": "USD",
        "total_value": 22500,
        "holdings": [
            {
                "symbol": "BTC",
                "name": "Bitcoin",
                "quantity": 0.15,
                "purchase_price": 45000,
                "current_price": 95000,
                "purchase_date": "2023-06-15",
                "purchase_currency": "USD",
                "asset_type": "crypto"
            },
            {
                "symbol": "ETH",
                "name": "Ethereum",
                "quantity": 3.2,
                "purchase_price": 2000,
                "current_price": 3500,
                "purchase_date": "2023-07-20",
                "purchase_currency": "USD",
                "asset_type": "crypto"
            },
            {
                "symbol": "SOL",
                "name": "Solana",
                "quantity": 50,
                "purchase_price": 25,
                "current_price": 110,
                "purchase_date": "2023-08-10",
                "purchase_currency": "USD",
                "asset_type": "crypto"
            }
        ],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.portfolio_assets.insert_one(demo_portfolio)
    
    # Demo Documents - Linked to Assets
    demo_documents = [
        {
            "id": f"{demo_prefix}doc1",
            "user_id": user_id,
            "name": "Life Insurance Policy Document",
            "category": "insurance",
            "file_path": "demo/life_insurance_policy.pdf",
            "file_size": 2457600,  # 2.4 MB
            "mime_type": "application/pdf",
            "description": "State Farm Term Life Insurance Policy - $750,000 coverage",
            "linked_asset_id": f"{demo_prefix}insurance1",  # Link to insurance asset
            "uploaded_at": datetime.now(timezone.utc).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}doc2",
            "user_id": user_id,
            "name": "Home Deed - Austin Property",
            "category": "property",
            "file_path": "demo/home_deed_austin.pdf",
            "file_size": 1843200,  # 1.8 MB
            "mime_type": "application/pdf",
            "description": "Property deed for 123 Oak Street, Austin, TX",
            "linked_asset_id": f"{demo_prefix}property1",  # Link to property asset
            "uploaded_at": datetime.now(timezone.utc).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}doc3",
            "user_id": user_id,
            "name": "401k Statement Q4 2024",
            "category": "investment",
            "file_path": "demo/401k_statement_q4_2024.pdf",
            "file_size": 892800,  # 870 KB
            "mime_type": "application/pdf",
            "description": "Vanguard 401(k) quarterly statement",
            "linked_asset_id": f"{demo_prefix}investment1",  # Link to 401k asset
            "uploaded_at": datetime.now(timezone.utc).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}doc4",
            "user_id": user_id,
            "name": "Bank Statement - November 2024",
            "category": "bank",
            "file_path": "demo/bank_statement_nov_2024.pdf",
            "file_size": 512000,  # 500 KB
            "mime_type": "application/pdf",
            "description": "Chase Bank checking account statement",
            "linked_asset_id": f"{demo_prefix}bank1",  # Link to bank asset
            "uploaded_at": datetime.now(timezone.utc).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}doc5",
            "user_id": user_id,
            "name": "Car Title - Tesla Model Y",
            "category": "vehicle",
            "file_path": "demo/car_title_tesla.pdf",
            "file_size": 614400,  # 600 KB
            "mime_type": "application/pdf",
            "description": "Vehicle title and registration documents",
            "uploaded_at": datetime.now(timezone.utc).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.documents.insert_many(demo_documents)
    
    # Demo Digital Will
    demo_will = {
        "id": f"{demo_prefix}will1",
        "user_id": user_id,
        "demo_mode": True,  # Mark as demo data
        "will_text": """LAST WILL AND TESTAMENT

I, [Your Name], being of sound mind and memory, do hereby declare this to be my Last Will and Testament.

ARTICLE I: FAMILY
I am married to Jane Doe and have two children:
- John Doe Jr. (Son, age 15)
- Sarah Doe (Daughter, age 12)

ARTICLE II: EXECUTOR
I appoint Jane Doe as the Executor of this Will. If Jane Doe is unable or unwilling to serve, I appoint my brother, Michael Doe, as alternate Executor.

ARTICLE III: ASSETS DISTRIBUTION
1. Primary Residence (Austin, TX): To be transferred to Jane Doe
2. Rental Property (Miami, FL): To be held in trust for children until age 25
3. Investment Accounts (401k, IRA): To be split equally between Jane Doe and children's education trust
4. Cryptocurrency Holdings: 50% to Jane Doe, 50% to children's trust
5. Life Insurance Proceeds: To be deposited in children's education trust

ARTICLE IV: GUARDIANSHIP
If Jane Doe is unable to care for our minor children, I appoint my sister, Emily Doe, as their guardian.

ARTICLE V: TRUSTS
I establish an education trust for my children to be managed by Jane Doe until each child reaches age 25.

ARTICLE VI: DIGITAL ASSETS
All digital assets, online accounts, and cryptocurrency wallets should be accessed using my AssetVault account. Login credentials are held by my trusted executor.

ARTICLE VII: FINAL INSTRUCTIONS
- Funeral: Simple ceremony, no elaborate arrangements
- Cremation preferred
- Memorial donations to American Heart Association

This Will revokes all previous Wills and Codicils.

Signed: [Your Signature]
Date: November 15, 2024
Witnesses: [To be completed with legal counsel]

---
DEMO NOTE: This is sample demo content. Please consult with a legal professional to create your actual will.""",
        "beneficiaries": [
            {
                "name": "Jane Doe",
                "relationship": "Spouse",
                "allocation_percentage": 50,
                "details": "Primary beneficiary - receives 50% of estate"
            },
            {
                "name": "John Doe Jr.",
                "relationship": "Son",
                "allocation_percentage": 25,
                "details": "Secondary beneficiary - receives 25% held in trust until age 25"
            },
            {
                "name": "Sarah Doe",
                "relationship": "Daughter",
                "allocation_percentage": 25,
                "details": "Secondary beneficiary - receives 25% held in trust until age 25"
            }
        ],
        "asset_distribution": {
            "real_estate": "Primary residence to Jane Doe, Rental property held in children's trust",
            "investments": "401k and IRA split equally between Jane Doe and children's education trust",
            "cryptocurrency": "50% to Jane Doe, 50% to children's trust",
            "life_insurance": "Proceeds deposited in children's education trust"
        },
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    existing_will = await db.digital_wills.find_one({"user_id": user_id, "demo_mode": True})
    if not existing_will:
        await db.digital_wills.insert_one(demo_will)
    
    # Demo Scheduled Messages
    demo_messages = [
        {
            "id": f"{demo_prefix}msg1",
            "user_id": user_id,
            "recipient_email": "jane.demo@example.com",
            "recipient_name": "Jane Doe",
            "subject": "Happy Anniversary, My Love! 💕",
            "message": """My Dearest Jane,

Happy Anniversary! If you're reading this, it means I've scheduled this message to reach you on our special day.

I want you to know how much you mean to me. Every year with you has been a blessing. Thank you for being my partner, my best friend, and the love of my life.

Remember our first date at that little Italian restaurant? You wore that blue dress, and I knew right then that I wanted to spend my life with you.

Here's to many more years together!

All my love,
[Your Name]""",
            "send_date": (datetime.now(timezone.utc) + timedelta(days=45)).isoformat(),
            "status": "scheduled",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}msg2",
            "user_id": user_id,
            "recipient_email": "john.jr.demo@example.com",
            "recipient_name": "John Doe Jr.",
            "subject": "Happy 16th Birthday, Son! 🎂",
            "message": """Dear John,

Happy 16th Birthday! You're officially old enough to drive now - scary thought for your old dad!

I'm so proud of the young man you're becoming. Your dedication to your studies and your kindness to others make me incredibly proud every day.

A few things I want you to remember as you grow:
- Always be honest, even when it's hard
- Treat everyone with respect
- Chase your dreams, but work hard for them
- Your family will always be there for you

Enjoy your special day!

Love,
Dad""",
            "send_date": (datetime.now(timezone.utc) + timedelta(days=120)).isoformat(),
            "status": "scheduled",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}msg3",
            "user_id": user_id,
            "recipient_email": "sarah.demo@example.com",
            "recipient_name": "Sarah Doe",
            "subject": "Graduation Day Message 🎓",
            "message": """My Sweet Sarah,

If you're reading this on your high school graduation day, I want you to know how incredibly proud I am of you!

Watching you grow from a little girl into this amazing young woman has been one of the greatest joys of my life. Your creativity, your compassion, and your determination inspire me every day.

As you head off to college and start this new chapter:
- Trust your instincts
- Don't be afraid to fail - that's how we learn
- Stay curious and keep asking questions
- Remember that home is always here for you

The world is lucky to have you. Go make your mark!

All my love,
Dad""",
            "send_date": (datetime.now(timezone.utc) + timedelta(days=1095)).isoformat(),  # ~3 years
            "status": "scheduled",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.scheduled_messages.insert_many(demo_messages)
    
    # Demo Nominees (keep existing)
    demo_nominees = [
        {
            "id": f"{demo_prefix}nominee1",
            "user_id": user_id,
            "name": "Jane Doe (Spouse)",
            "email": "jane.demo@example.com",
            "phone": "+1-555-0101",
            "relationship": "spouse",
            "priority": 1,
            "access_granted": True,  # Already has access in demo
            "access_type": "immediate",
            "access_token": f"nom_demo_{user_id}_jane",
            "access_token_created_at": datetime.now(timezone.utc).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}nominee2",
            "user_id": user_id,
            "name": "John Doe Jr. (Son)",
            "email": "john.jr.demo@example.com",
            "phone": "+1-555-0102",
            "relationship": "child",
            "priority": 2,
            "access_granted": False,
            "access_type": "after_dms",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.nominees.insert_many(demo_nominees)
    
    # Demo DMS (keep existing)
    demo_dms = {
        "user_id": user_id,
        "inactivity_days": 90,
        "reminder_1_days": 60,
        "reminder_2_days": 75,
        "reminder_3_days": 85,
        "is_active": True,
        "last_reset": datetime.now(timezone.utc).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    existing_dms = await db.dead_man_switches.find_one({"user_id": user_id})
    if not existing_dms:
        await db.dead_man_switches.insert_one(demo_dms)
    
    # Demo AI Insight - Create a comprehensive insight snapshot
    demo_insight = {
        "id": f"{demo_prefix}insight1",
        "user_id": user_id,
        "portfolio_summary": "Your portfolio demonstrates strong diversification across multiple asset classes with a healthy balance of liquid and long-term investments. Total net worth stands at approximately $520,000, with a well-balanced mix of real estate, stocks, cryptocurrencies, and cash reserves.",
        "asset_distribution_analysis": "Your asset allocation shows 45% in real estate, 25% in equities and portfolios, 15% in cash and liquid assets, 10% in cryptocurrencies, and 5% in precious metals. This distribution provides both stability through real estate and growth potential through equities and crypto.",
        "allocation_recommendations": [
            "Consider increasing emergency fund to cover 6 months of expenses for optimal financial security",
            "Evaluate rebalancing crypto holdings if they exceed 15% of total portfolio due to volatility",
            "Review real estate holdings for diversification opportunities in different geographic locations",
            "Consider tax-advantaged retirement accounts to optimize long-term growth"
        ],
        "advantages": [
            "Strong real estate foundation providing stable, appreciating assets",
            "Diversified across traditional and alternative investments",
            "Healthy emergency fund in liquid bank accounts",
            "Multi-currency holdings providing natural hedge against currency fluctuations",
            "Active portfolio management with both US and international exposure"
        ],
        "risks": [
            "Real estate concentration may limit liquidity in emergencies",
            "Cryptocurrency holdings carry high volatility risk",
            "Outstanding loan obligations require consistent cash flow management",
            "Some investments may not be optimally diversified within their asset class",
            "Currency exposure may introduce foreign exchange risk"
        ],
        "action_items": [
            "Schedule quarterly portfolio rebalancing reviews",
            "Set up automatic transfers to build emergency fund to 6-month target",
            "Review and optimize tax strategy with a financial advisor",
            "Consider dollar-cost averaging for crypto investments to reduce volatility impact",
            "Document all account access information in secure location for nominees"
        ],
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    # Remove existing demo insights if force reseeding
    if force:
        await db.ai_insights.delete_many({"user_id": user_id, "id": {"$regex": f"^{demo_prefix}"}})
    await db.ai_insights.insert_one(demo_insight)
    
    # Demo Income & Expense Data
    current_month = datetime.now(timezone.utc).strftime("%Y-%m")
    last_month = (datetime.now(timezone.utc) - timedelta(days=30)).strftime("%Y-%m")
    
    # Demo Incomes for current month
    demo_incomes_current = [
        {
            "id": f"{demo_prefix}income1",
            "user_id": user_id,
            "month": current_month,
            "source": "Salary",
            "description": "Monthly salary from TechCorp Inc.",
            "amount_before_tax": 8500.00,
            "tax_deducted": 1700.00,
            "amount_after_tax": 6800.00,
            "currency": "USD",
            "payment_date": datetime.now(timezone.utc).replace(day=1).isoformat().split('T')[0],
            "notes": "Regular monthly salary",
            "recurring": True,
            "demo_mode": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}income2",
            "user_id": user_id,
            "month": current_month,
            "source": "Freelance/Consulting",
            "description": "Web development project for Client XYZ",
            "amount_before_tax": 2000.00,
            "tax_deducted": 300.00,
            "amount_after_tax": 1700.00,
            "currency": "USD",
            "payment_date": datetime.now(timezone.utc).replace(day=15).isoformat().split('T')[0],
            "notes": "One-time project payment",
            "recurring": False,
            "demo_mode": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}income3",
            "user_id": user_id,
            "month": current_month,
            "source": "Investment Returns",
            "description": "Dividend from stock portfolio",
            "amount_before_tax": 450.00,
            "tax_deducted": 67.50,
            "amount_after_tax": 382.50,
            "currency": "USD",
            "payment_date": datetime.now(timezone.utc).replace(day=20).isoformat().split('T')[0],
            "notes": "Quarterly dividend payment",
            "recurring": True,
            "demo_mode": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    # Demo Expenses for current month
    demo_expenses_current = [
        {
            "id": f"{demo_prefix}expense1",
            "user_id": user_id,
            "month": current_month,
            "category": "Housing",
            "subcategory": "Rent",
            "description": "Monthly apartment rent",
            "amount": 1800.00,
            "currency": "USD",
            "payment_method": "Bank Transfer",
            "payment_date": datetime.now(timezone.utc).replace(day=1).isoformat().split('T')[0],
            "is_recurring": True,
            "is_essential": True,
            "notes": "2-bedroom apartment downtown",
            "demo_mode": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}expense2",
            "user_id": user_id,
            "month": current_month,
            "category": "Food & Dining",
            "subcategory": "Groceries",
            "description": "Weekly grocery shopping",
            "amount": 450.00,
            "currency": "USD",
            "payment_method": "Credit Card",
            "payment_date": datetime.now(timezone.utc).replace(day=5).isoformat().split('T')[0],
            "is_recurring": True,
            "is_essential": True,
            "notes": "Monthly groceries",
            "demo_mode": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}expense3",
            "user_id": user_id,
            "month": current_month,
            "category": "Transportation",
            "subcategory": "Fuel",
            "description": "Gas for car",
            "amount": 180.00,
            "currency": "USD",
            "payment_method": "Debit Card",
            "payment_date": datetime.now(timezone.utc).replace(day=10).isoformat().split('T')[0],
            "is_recurring": True,
            "is_essential": True,
            "notes": "Monthly fuel expenses",
            "demo_mode": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}expense4",
            "user_id": user_id,
            "month": current_month,
            "category": "Utilities",
            "subcategory": "Electricity",
            "description": "Monthly electricity bill",
            "amount": 120.00,
            "currency": "USD",
            "payment_method": "Bank Transfer",
            "payment_date": datetime.now(timezone.utc).replace(day=5).isoformat().split('T')[0],
            "is_recurring": True,
            "is_essential": True,
            "notes": "Utility bill",
            "demo_mode": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}expense5",
            "user_id": user_id,
            "month": current_month,
            "category": "Technology",
            "subcategory": "Internet",
            "description": "Internet and streaming bundle",
            "amount": 85.00,
            "currency": "USD",
            "payment_method": "Credit Card",
            "payment_date": datetime.now(timezone.utc).replace(day=1).isoformat().split('T')[0],
            "is_recurring": True,
            "is_essential": True,
            "notes": "High-speed internet + Netflix",
            "demo_mode": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}expense6",
            "user_id": user_id,
            "month": current_month,
            "category": "Food & Dining",
            "subcategory": "Restaurants",
            "description": "Dining out and restaurants",
            "amount": 320.00,
            "currency": "USD",
            "payment_method": "Credit Card",
            "payment_date": datetime.now(timezone.utc).replace(day=15).isoformat().split('T')[0],
            "is_recurring": False,
            "is_essential": False,
            "notes": "Weekend dining",
            "demo_mode": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}expense7",
            "user_id": user_id,
            "month": current_month,
            "category": "Entertainment",
            "subcategory": "Movies",
            "description": "Movie tickets and entertainment",
            "amount": 65.00,
            "currency": "USD",
            "payment_method": "Credit Card",
            "payment_date": datetime.now(timezone.utc).replace(day=12).isoformat().split('T')[0],
            "is_recurring": False,
            "is_essential": False,
            "notes": "Weekend entertainment",
            "demo_mode": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}expense8",
            "user_id": user_id,
            "month": current_month,
            "category": "Healthcare",
            "subcategory": "Health Insurance",
            "description": "Monthly health insurance premium",
            "amount": 350.00,
            "currency": "USD",
            "payment_method": "Bank Transfer",
            "payment_date": datetime.now(timezone.utc).replace(day=1).isoformat().split('T')[0],
            "is_recurring": True,
            "is_essential": True,
            "notes": "Family health insurance",
            "demo_mode": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}expense9",
            "user_id": user_id,
            "month": current_month,
            "category": "Personal Care",
            "subcategory": "Gym",
            "description": "Gym membership",
            "amount": 45.00,
            "currency": "USD",
            "payment_method": "Credit Card",
            "payment_date": datetime.now(timezone.utc).replace(day=1).isoformat().split('T')[0],
            "is_recurring": True,
            "is_essential": False,
            "notes": "Monthly gym membership",
            "demo_mode": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"{demo_prefix}expense10",
            "user_id": user_id,
            "month": current_month,
            "category": "Shopping",
            "subcategory": "Clothing",
            "description": "Clothing and accessories",
            "amount": 150.00,
            "currency": "USD",
            "payment_method": "Credit Card",
            "payment_date": datetime.now(timezone.utc).replace(day=18).isoformat().split('T')[0],
            "is_recurring": False,
            "is_essential": False,
            "notes": "New work clothes",
            "demo_mode": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    # Remove existing demo income/expenses if force reseeding
    if force:
        await db.monthly_incomes.delete_many({"user_id": user_id, "id": {"$regex": f"^{demo_prefix}"}})
        await db.monthly_expenses.delete_many({"user_id": user_id, "id": {"$regex": f"^{demo_prefix}"}})
    
    # Insert demo income and expenses
    await db.monthly_incomes.insert_many(demo_incomes_current)
    await db.monthly_expenses.insert_many(demo_expenses_current)

async def seed_universal_test_account():
    """Create universal test account that all demo users can access"""
    test_account_id = "test_account_universal"
    
    # Check if test account already exists
    existing_user = await db.users.find_one({"id": test_account_id})
    if existing_user:
        return  # Already exists
    
    # Create test user
    test_user = {
        "id": test_account_id,
        "email": "demo.portfolio@assetvault.com",
        "name": "AssetVault Demo Portfolio",
        "picture": None,
        "role": "customer",
        "demo_mode": False,
        "last_activity": datetime.now(timezone.utc).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "subscription_plan": "Family"
    }
    await db.users.insert_one(test_user)
    
    # Create comprehensive test assets
    test_assets = [
        # USA Assets
        {
            "id": f"test_bank_us1",
            "user_id": test_account_id,
            "name": "Wells Fargo Premier Checking",
            "type": "bank",
            "purchase_currency": "USD",
            "purchase_date": "2022-01-15",
            "total_value": 125000,
            "current_value": 127500,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"test_crypto_btc1",
            "user_id": test_account_id,
            "name": "Bitcoin Investment",
            "type": "crypto",
            "symbol": "BTC",
            "purchase_currency": "USD",
            "purchase_date": "2021-05-10",
            "quantity": 2.5,
            "unit_price": 35000,
            "current_unit_price": 95000,
            "total_value": 87500,
            "current_value": 237500,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": f"test_property_us1",
            "user_id": test_account_id,
            "name": "Luxury Penthouse - Manhattan",
            "type": "property",
            "purchase_currency": "USD",
            "purchase_date": "2019-03-20",
            "area": 3500,
            "area_unit": "sqft",
            "price_per_area": 1200,
            "current_price_per_area": 1650,
            "total_value": 4200000,
            "current_value": 5775000,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        # Singapore Assets
        {
            "id": f"test_bank_sg1",
            "user_id": test_account_id,
            "name": "OCBC Premium Banking Account",
            "type": "bank",
            "purchase_currency": "SGD",
            "purchase_date": "2022-06-01",
            "total_value": 180000,
            "current_value": 185000,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        # UK Assets
        {
            "id": f"test_stock_uk1",
            "user_id": test_account_id,
            "name": "HSBC Holdings PLC",
            "type": "stock",
            "symbol": "HSBA.L",
            "purchase_currency": "GBP",
            "purchase_date": "2021-09-15",
            "quantity": 5000,
            "unit_price": 4.5,
            "current_unit_price": 6.2,
            "total_value": 22500,
            "current_value": 31000,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.assets.insert_many(test_assets)
    logger.info("Universal test account seeded successfully")
