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
