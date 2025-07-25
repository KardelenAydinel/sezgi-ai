"""
MCP Server for Shopping Assistant Database
Exposes database functionality as MCP tools for LLM agents
"""

from typing import List, Optional, Dict, Any
from fastmcp import FastMCP
from pydantic import Field
import os
import sys

# Ensure we can import our modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import our database functions and models
from app.database import (
    initialize_all_databases,
    search_products_by_tags,
    save_product_to_db,
    get_products_from_db,
    search_products_by_visual_description,
    get_all_ecommerce_products
)
from app.models import EcommerceProduct

print("🔧 Initializing MCP Server...")

# Initialize MCP server
mcp = FastMCP(
    name="Shopping Assistant Database",
    dependencies=[
        "fastmcp",
        "pydantic"
    ]
)

print("✅ MCP Server instance created")

# Initialize databases
print("🗄️ Initializing databases...")
initialize_all_databases()
print("✅ Databases initialized successfully")

@mcp.tool
def search_ecommerce_products_by_tags(
    search_tags: List[str] = Field(description="List of tags to search for"),
    limit: int = Field(default=4, description="Maximum number of products to return"),
    min_price: Optional[float] = Field(default=None, description="Minimum price filter"),
    max_price: Optional[float] = Field(default=None, description="Maximum price filter"),
    category: Optional[str] = Field(default=None, description="Category filter")
) -> List[EcommerceProduct]:
    """
    Search for e-commerce products by tags with optional filters.
    Returns products ranked by tag similarity.
    """
    print(f"🔍 MCP Tool called: search_ecommerce_products_by_tags")
    print(f"   Tags: {search_tags}")
    print(f"   Limit: {limit}")
    print(f"   Price range: {min_price} - {max_price}")
    print(f"   Category: {category}")
    
    result = search_products_by_tags(
        search_tags=search_tags,
        limit=limit,
        min_price=min_price,
        max_price=max_price,
        category=category
    )
    
    print(f"   🎯 Found {len(result)} products")
    return result

@mcp.tool
def get_all_ecommerce_products_list(
    limit: int = Field(default=20, description="Maximum number of products to return")
) -> List[EcommerceProduct]:
    """
    Get all available e-commerce products from the database.
    """
    print(f"📦 MCP Tool called: get_all_ecommerce_products_list (limit: {limit})")
    result = get_all_ecommerce_products(limit=limit)
    print(f"   📋 Returned {len(result)} products")
    return result

@mcp.tool
def save_product_card(
    product_data: Dict[str, Any] = Field(description="Product card data to save")
) -> str:
    """
    Save a product card to the database. 
    Returns the generated product ID.
    """
    print(f"💾 MCP Tool called: save_product_card")
    print(f"   Product: {product_data.get('urun_adi', 'Unknown')}")
    
    product_id = save_product_to_db(product_data)
    print(f"   ✅ Saved with ID: {product_id}")
    return product_id

@mcp.tool
def get_saved_products(
    limit: int = Field(default=10, description="Maximum number of products to return")
) -> List[Dict[str, Any]]:
    """
    Get saved product cards from the database, ordered by creation date.
    """
    print(f"📚 MCP Tool called: get_saved_products (limit: {limit})")
    result = get_products_from_db(limit=limit)
    print(f"   📖 Found {len(result)} saved products")
    return result

@mcp.tool
def search_products_by_description(
    query: str = Field(description="Visual description or search query"),
    limit: int = Field(default=10, description="Maximum number of products to return")
) -> List[Dict[str, Any]]:
    """
    Search saved products by visual description or general query.
    """
    print(f"🔎 MCP Tool called: search_products_by_description")
    print(f"   Query: {query[:100]}...")
    print(f"   Limit: {limit}")
    
    result = search_products_by_visual_description(query=query, limit=limit)
    print(f"   🎯 Found {len(result)} matching products")
    return result

# Resources for read-only data access
@mcp.resource("shopping://stats")
def get_database_stats() -> Dict[str, Any]:
    """Get database statistics and status."""
    print("📊 MCP Resource accessed: shopping://stats")
    try:
        # Get some basic stats
        saved_products = get_products_from_db(limit=1000)  # Get all to count
        ecommerce_products = get_all_ecommerce_products(limit=1000)  # Get all to count
        
        stats = {
            "status": "operational",
            "saved_products_count": len(saved_products),
            "ecommerce_products_count": len(ecommerce_products),
            "database_initialized": True
        }
        print(f"   📈 Stats: {stats}")
        return stats
    except Exception as e:
        error_stats = {
            "status": "error",
            "error": str(e),
            "database_initialized": False
        }
        print(f"   ❌ Error getting stats: {e}")
        return error_stats

@mcp.resource("shopping://categories")
def get_available_categories() -> List[str]:
    """Get list of available product categories."""
    print("🏷️ MCP Resource accessed: shopping://categories")
    try:
        ecommerce_products = get_all_ecommerce_products(limit=1000)
        categories = list(set(product.category for product in ecommerce_products))
        sorted_categories = sorted(categories)
        print(f"   📂 Found {len(sorted_categories)} categories: {sorted_categories}")
        return sorted_categories
    except Exception as e:
        print(f"   ❌ Error getting categories: {e}")
        return [f"Error: {str(e)}"]

print("🛠️ All MCP tools and resources registered")

if __name__ == "__main__":
    # Run the MCP server
    print("\n" + "="*60)
    print("🛍️ SHOPPING ASSISTANT MCP SERVER STARTING")
    print("="*60)
    print("\n📋 Available MCP Tools:")
    print("  🔍 search_ecommerce_products_by_tags - Search products by tags")
    print("  📦 get_all_ecommerce_products_list - Get all e-commerce products")
    print("  💾 save_product_card - Save a product card")
    print("  📚 get_saved_products - Get saved product cards")
    print("  🔎 search_products_by_description - Search by visual description")
    print("\n🗃️ Available MCP Resources:")
    print("  📊 shopping://stats - Database statistics")
    print("  🏷️ shopping://categories - Available categories")
    print("\n🚀 MCP Server is ready for connections...")
    print("   Use: fastmcp run mcp_server.py")
    print("="*60)
    
    mcp.run()