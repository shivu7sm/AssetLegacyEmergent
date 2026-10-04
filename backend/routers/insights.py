"""API routes: insights."""
from fastapi import APIRouter, HTTPException, Depends
import os
from datetime import datetime, timezone

from core.auth import require_auth
from core.config import db, logger
from core.models import AIInsight, AIInsightResponse, User
from services.valuation import calculate_asset_current_value, convert_currency

router = APIRouter()

# AI Insights Routes
@router.get("/insights/latest")
async def get_latest_insight(user: User = Depends(require_auth)):
    """Get the most recent AI insight for the user."""
    insight = await db.ai_insights.find_one(
        {"user_id": user.id},
        {"_id": 0}
    , sort=[("generated_at", -1)])
    
    if not insight:
        return None
    
    if isinstance(insight.get('generated_at'), str):
        insight['generated_at'] = datetime.fromisoformat(insight['generated_at'])
    
    # Convert datetime back to string for response
    if isinstance(insight.get('generated_at'), datetime):
        insight['generated_at'] = insight['generated_at'].isoformat()
    
    return AIInsightResponse(**insight)

@router.post("/insights/generate", response_model=AIInsightResponse)
async def generate_insights(user: User = Depends(require_auth)):
    """Generate fresh AI insights and store them. Includes portfolio holdings. Filters by demo mode."""
    try:
        # Check if LLM key is available
        llm_key = os.environ.get("EMERGENT_LLM_KEY")
        if not llm_key:
            logger.warning("EMERGENT_LLM_KEY not set - AI insights will use fallback templates")
        
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        # Fetch user's assets and portfolios - FILTER BY DEMO MODE
        demo_prefix = f"demo_{user.id}_"
        if user.demo_mode:
            # Use only demo assets and portfolios
            assets = await db.assets.find({
                "user_id": user.id,
                "id": {"$regex": f"^{demo_prefix}"}
            }).to_list(1000)
            portfolios = await db.portfolio_assets.find({
                "user_id": user.id,
                "id": {"$regex": f"^{demo_prefix}"}
            }).to_list(1000)
        else:
            # Use only live assets and portfolios (exclude demo)
            assets = await db.assets.find({
                "user_id": user.id,
                "id": {"$not": {"$regex": f"^{demo_prefix}"}}
            }).to_list(1000)
            portfolios = await db.portfolio_assets.find({
                "user_id": user.id,
                "id": {"$not": {"$regex": f"^{demo_prefix}"}}
            }).to_list(1000)
        
        if not assets and not portfolios:
            basic_insight = AIInsight(
                user_id=user.id,
                portfolio_summary="No assets found in your portfolio yet.",
                allocation_recommendations=[],
                risk_analysis=[],
                action_items=["Start by adding your first asset to get personalized insights."],
                advantages=[],
                risks=[],
                asset_distribution_analysis=""
            )
            
            insight_dict = basic_insight.model_dump()
            insight_dict['generated_at'] = insight_dict['generated_at'].isoformat()
            await db.ai_insights.insert_one(insight_dict)
            
            # Convert datetime to string for response
            response_data = basic_insight.model_dump()
            if isinstance(response_data.get('generated_at'), datetime):
                response_data['generated_at'] = response_data['generated_at'].isoformat()
            
            return AIInsightResponse(**response_data)
        
        # Calculate portfolio summary with proper currency conversion
        asset_types = {}
        liability_types = {'loan', 'credit_card'}
        total_assets_value = 0
        total_liabilities_value = 0
        holdings_details = []  # Track individual holdings from portfolios
        
        # Get user's preferred currency
        target_currency = user.selected_currency or "USD"
        
        # Process individual assets
        for asset in assets:
            asset_type = asset['type']
            asset_types[asset_type] = asset_types.get(asset_type, 0) + 1
            
            # Calculate value in original currency
            value_in_original_currency = calculate_asset_current_value(asset)
            original_currency = asset.get("purchase_currency", "USD")
            
            # Convert to target currency
            value_in_target_currency = convert_currency(
                value_in_original_currency,
                original_currency,
                target_currency
            )
            
            if asset_type in liability_types:
                total_liabilities_value += value_in_target_currency
            else:
                total_assets_value += value_in_target_currency
        
        # Process portfolio assets and their holdings
        for portfolio in portfolios:
            asset_types['portfolio'] = asset_types.get('portfolio', 0) + 1
            portfolio_currency = portfolio.get("purchase_currency", "USD")
            portfolio_value = portfolio.get("total_value", 0.0)
            
            # Convert portfolio value to target currency
            portfolio_value_converted = convert_currency(
                portfolio_value,
                portfolio_currency,
                target_currency
            )
            total_assets_value += portfolio_value_converted
            
            # Track holdings for detailed analysis
            if portfolio.get('holdings'):
                for holding in portfolio['holdings']:
                    holdings_details.append({
                        'portfolio': portfolio.get('name'),
                        'symbol': holding.get('symbol'),
                        'name': holding.get('name'),
                        'type': holding.get('asset_type'),
                        'quantity': holding.get('quantity'),
                        'value': holding.get('quantity', 0) * holding.get('current_price', holding.get('purchase_price', 0))
                    })
                    # Count holding types separately
                    holding_type = holding.get('asset_type', 'unknown')
                    asset_types[holding_type] = asset_types.get(holding_type, 0) + 1
        
        net_worth = total_assets_value - total_liabilities_value
        
        # Create detailed portfolio context for AI
        asset_distribution_str = ", ".join([f"{k}: {v} items" for k, v in asset_types.items()])
        
        # Format holdings for AI context
        holdings_summary = ""
        if holdings_details:
            holdings_summary = "\n\nPortfolio Holdings Breakdown:\n"
            for h in holdings_details[:20]:  # Limit to first 20 for context size
                holdings_summary += f"- {h['name']} ({h['symbol']}): {h['quantity']} units in {h['portfolio']}, Type: {h['type']}\n"
        
        portfolio_context = f"""Analyze this investment portfolio and provide structured insights:

Portfolio Overview:
- Total Assets Value: {target_currency} {total_assets_value:,.2f}
- Total Liabilities: {target_currency} {total_liabilities_value:,.2f}
- Net Worth: {target_currency} {net_worth:,.2f}
- Currency: {target_currency}
- Asset Distribution: {asset_distribution_str}
- Total number of individual assets: {len(assets)}
- Total number of portfolios: {len(portfolios)}
- Total holdings across portfolios: {len(holdings_details)}{holdings_summary}

Please provide a comprehensive analysis in the following structure:

1. PORTFOLIO SUMMARY (2-3 sentences about overall health and composition)

2. ASSET DISTRIBUTION ANALYSIS (Brief analysis of how assets are distributed and if diversification is adequate)

3. ALLOCATION RECOMMENDATIONS (List 4-5 specific, actionable recommendations)

4. ADVANTAGES (List 3-4 positive aspects or strengths of this portfolio)

5. RISKS (List 3-4 potential risks or concerns, focusing on concentration, liquidity, or market risks)

6. ACTION ITEMS (List 4-5 concrete next steps the user should take)

Format your response clearly with these section headers."""
        
        # Initialize AI chat
        ai_response = None
        try:
            api_key = os.environ.get('EMERGENT_LLM_KEY')
            chat = LlmChat(
                api_key=api_key,
                session_id=f"insights_{user.id}_{datetime.now(timezone.utc).timestamp()}",
                system_message="You are an expert financial advisor specializing in portfolio analysis, asset allocation, and risk management. Provide clear, actionable, and personalized recommendations based on the user's portfolio composition. Focus on asset distribution, investment diversification, and identifying both opportunities and risks."
            ).with_model("openai", "gpt-4o-mini")
            
            # Send message
            user_message = UserMessage(text=portfolio_context)
            ai_response = await chat.send_message(user_message)
        except Exception as ai_error:
            logger.error(f"AI service error: {str(ai_error)}")
            # Fall back to template-based insights
            ai_response = None
        
        # Parse AI response into structured sections
        sections = {
            "summary": "",
            "distribution": "",
            "recommendations": [],
            "advantages": [],
            "risks": [],
            "actions": []
        }
        
        if ai_response:
            current_section = None
            lines = ai_response.strip().split('\n')
        else:
            # Use fallback template when AI fails
            lines = []
            # Pre-populate sections with template-based insights
            sections["summary"] = f"Portfolio analysis shows net worth of ${net_worth:,.2f} across {len(assets) + len(portfolios)} holdings."
            sections["distribution"] = f"Your portfolio includes {len(asset_types)} different asset types with the following distribution: {asset_distribution_str}."
            sections["recommendations"] = [
                "Consider diversifying across multiple asset classes to reduce risk",
                "Maintain 3-6 months of expenses in liquid emergency funds",
                "Review and rebalance your portfolio quarterly",
                "Consider tax-advantaged investment accounts"
            ]
            sections["advantages"] = [
                "Comprehensive tracking of all financial assets",
                "Clear visibility into total net worth",
                "Organized financial overview for planning"
            ]
            sections["risks"] = [
                "Monitor concentration risk in any single asset type",
                "Consider liquidity needs for emergency situations",
                "Stay informed about market volatility impacts"
            ]
            sections["actions"] = [
                "Update current market valuations for all assets",
                "Set up regular portfolio review schedule",
                "Consider professional financial planning consultation",
                "Evaluate insurance coverage adequacy"
            ]
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Detect section headers
            upper_line = line.upper()
            if "PORTFOLIO SUMMARY" in upper_line or "SUMMARY" in upper_line:
                current_section = "summary"
                continue
            elif "DISTRIBUTION" in upper_line or "ASSET DISTRIBUTION" in upper_line:
                current_section = "distribution"
                continue
            elif "ALLOCATION" in upper_line or "RECOMMENDATION" in upper_line:
                current_section = "recommendations"
                continue
            elif "ADVANTAGE" in upper_line or "STRENGTH" in upper_line:
                current_section = "advantages"
                continue
            elif "RISK" in upper_line or "CONCERN" in upper_line:
                current_section = "risks"
                continue
            elif "ACTION" in upper_line or "NEXT STEP" in upper_line:
                current_section = "actions"
                continue
            
            # Add content to appropriate section
            if current_section == "summary":
                sections["summary"] += line + " "
            elif current_section == "distribution":
                sections["distribution"] += line + " "
            elif current_section in ["recommendations", "advantages", "risks", "actions"]:
                # Remove bullet points and numbering
                cleaned = line.lstrip('-*•123456789.').strip()
                if cleaned:
                    sections[current_section].append(cleaned)
        
        # Create insight object
        insight = AIInsight(
            user_id=user.id,
            portfolio_summary=sections["summary"].strip() or f"Portfolio net worth: ${net_worth:,.2f} across {len(assets)} holdings with diverse asset types.",
            asset_distribution_analysis=sections["distribution"].strip() or f"Your portfolio includes {len(asset_types)} different asset types: {asset_distribution_str}.",
            allocation_recommendations=sections["recommendations"][:5] or [
                "Consider diversifying across multiple asset classes",
                "Maintain adequate emergency fund in liquid assets",
                "Review portfolio allocation quarterly",
                "Balance growth assets with stable income generators"
            ],
            advantages=sections["advantages"][:4] or [
                "Diverse asset ownership tracked in one place",
                "Clear visibility of net worth",
                "Comprehensive financial overview"
            ],
            risks=sections["risks"][:4] or [
                "Monitor concentration risk in specific asset types",
                "Consider liquidity needs for emergency situations",
                "Stay aware of market volatility impact"
            ],
            action_items=sections["actions"][:5] or [
                "Update current valuations for all assets",
                "Review and rebalance portfolio quarterly",
                "Set up automatic tracking for market-linked assets",
                "Consider tax optimization strategies"
            ],
            risk_analysis=sections["risks"][:4] or []  # For backward compatibility
        )
        
        # Store in database
        insight_dict = insight.model_dump()
        insight_dict['generated_at'] = insight_dict['generated_at'].isoformat()
        await db.ai_insights.insert_one(insight_dict)
        
        # Convert datetime to string for response
        response_data = insight.model_dump()
        if isinstance(response_data.get('generated_at'), datetime):
            response_data['generated_at'] = response_data['generated_at'].isoformat()
        
        return AIInsightResponse(**response_data)
    except Exception as e:
        logger.error(f"AI insights generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate insights: {str(e)}")
