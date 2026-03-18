from django.db import models
from django.db import models
from django.utils import timezone

class Product(models.Model):
    sku = models.CharField(max_length=50, unique=True)
    product_name = models.TextField()
    brand = models.CharField(max_length=100)
    price = models.FloatField()
    discount_price = models.FloatField()
    subcategory = models.CharField(max_length=50)
    category = models.CharField(max_length=50)

    def __str__(self):
        return self.product_name




class Cashier_Product(models.Model):
    sku = models.CharField(max_length=50, unique=True, verbose_name="SKU")
    barcode = models.CharField(max_length=50, unique=True, verbose_name="Barcode")
    name = models.CharField(max_length=200, verbose_name="Product Name")
    category = models.CharField(max_length=100, verbose_name="Category")
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Price")
    stock = models.PositiveIntegerField(verbose_name="Stock Quantity")
    threshold = models.PositiveIntegerField(verbose_name="Reorder Threshold", default=10)

    def __str__(self):
        return f"{self.name} ({self.sku})"

    class Meta:
        ordering = ['name']


class Bill(models.Model):
    """Model to store daily bill transactions"""
    bill_number = models.CharField(max_length=50, unique=True)
    cashier_username = models.CharField(max_length=100)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    item_count = models.IntegerField(default=0)
    payment_method = models.CharField(max_length=20, default='cash')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Bill #{self.bill_number} - ₹{self.total_amount}"
    

class BillItem(models.Model):
    """Individual items in a bill"""
    bill = models.ForeignKey(Bill, on_delete=models.CASCADE, related_name='items')
    product_name = models.CharField(max_length=200)
    sku = models.CharField(max_length=50)
    quantity = models.IntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    
    def __str__(self):
        return f"{self.product_name} x{self.quantity}"