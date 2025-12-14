from django.db import models

class Product(models.Model):  # Capitalize class name (convention)
    # Basic Information
    name = models.CharField(max_length=100, verbose_name="Product Name")
    sku = models.CharField(max_length=20, unique=True, verbose_name="SKU")
    
    # Pricing - Use DecimalField for prices
    price = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        verbose_name="Price (₹)"
    )
    
    # Stock - Use IntegerField for quantities
    in_stock = models.IntegerField(
        default=0,
        verbose_name="Current Stock"
    )
    
    min_stock_level = models.IntegerField(
        default=10,
        verbose_name="Minimum Stock Level"
    )
    
    # Description - Use TextField for long text
    description = models.TextField(
        max_length=2000,
        blank=True,
        verbose_name="Description"
    )
    
    # Additional useful fields
    category = models.CharField(
        max_length=50,
        blank=True,
        verbose_name="Category"
    )
    
    brand = models.CharField(
        max_length=50,
        blank=True,
        verbose_name="Brand"
    )
    
    is_available = models.BooleanField(
        default=True,
        verbose_name="Available"
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Created Date"
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Updated Date"
    )
    
    # Meta class for database settings
    class Meta:
        ordering = ['-created_at']  # Newest first
        verbose_name = "Product"
        verbose_name_plural = "Products"
    
    # String representation
    def __str__(self):
        return f"{self.name} ({self.sku})"
    
    # Property to check if stock is low
    @property
    def is_low_stock(self):
        return self.in_stock <= self.min_stock_level
    
    # Property to get stock status
    @property
    def stock_status(self):
        if self.in_stock == 0:
            return "Out of Stock"
        elif self.is_low_stock:
            return "Low Stock"
        else:
            return "In Stock"
    
    # Override save method
    def save(self, *args, **kwargs):
        # Auto-update is_available based on stock
        self.is_available = self.in_stock > 0
        super().save(*args, **kwargs)