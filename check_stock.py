from productsDB.models import Product

print("=" * 60)
print("CHECKING ALL PRODUCTS")
print("=" * 60)

products = Product.objects.all()

if products.count() > 0:
    for p in products:
        stock = p.in_stock if p.in_stock else 0
        min_stock = p.min_stock_level if p.min_stock_level else 0
        
        print(f"\nProduct: {p.name}")
        print(f"  SKU: {p.sku}")
        print(f"  Current Stock: {stock}")
        print(f"  Min Stock Level: {min_stock}")
        
        if min_stock > 0 and stock < min_stock:
            print(f"  ⚠️ LOW STOCK! Need {min_stock - stock} more")
        else:
            print(f"  ✅ Stock OK")
else:
    print("❌ NO PRODUCTS FOUND!")

# Count low stock
from django.db import models
low_stock_count = Product.objects.filter(
    in_stock__lt=models.F('min_stock_level')
).count()
print(f"\n📊 Total Low Stock Products: {low_stock_count}")