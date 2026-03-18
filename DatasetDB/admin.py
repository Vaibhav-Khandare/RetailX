from django.contrib import admin
from DatasetDB.models import Product, Cashier_Product
# Register your models here.
admin.site.register(Product)
admin.site.register(Cashier_Product)

from django.contrib import admin
from .models import Bill, BillItem

@admin.register(Bill)
class BillAdmin(admin.ModelAdmin):
    list_display = ('bill_number', 'cashier_username', 'total_amount', 'item_count', 'payment_method', 'created_at')
    list_filter = ('payment_method', 'created_at')
    search_fields = ('bill_number', 'cashier_username')
    readonly_fields = ('bill_number', 'created_at')
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Bill Information', {
            'fields': ('bill_number', 'cashier_username', 'total_amount', 'item_count')
        }),
        ('Payment Details', {
            'fields': ('payment_method',)
        }),
        ('Timestamps', {
            'fields': ('created_at',)
        }),
    )

@admin.register(BillItem)
class BillItemAdmin(admin.ModelAdmin):
    list_display = ('bill', 'product_name', 'sku', 'quantity', 'price', 'subtotal')
    list_filter = ('bill__created_at',)
    search_fields = ('product_name', 'sku', 'bill__bill_number')