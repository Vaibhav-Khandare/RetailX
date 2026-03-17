from django.db import models

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