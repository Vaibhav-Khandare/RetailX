from django.contrib import admin
from .models import Product

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'sku', 'price', 'in_stock', 'stock_status', 'is_available')
    list_filter = ('is_available', 'category')
    search_fields = ('name', 'sku', 'description')
    readonly_fields = ('stock_status', 'created_at', 'updated_at')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'sku', 'description', 'category', 'brand')
        }),
        ('Pricing & Stock', {
            'fields': ('price', 'in_stock', 'min_stock_level', 'stock_status')
        }),
        ('Status', {
            'fields': ('is_available', 'created_at', 'updated_at')
        }),
    )