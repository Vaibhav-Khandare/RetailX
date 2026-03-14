from django.db import models

# Create your models here.

class Admin(models.Model):
    fullname = models.CharField(max_length=30)
    email = models.CharField(max_length=100, unique=True)
    username = models.CharField(max_length=30, unique=True)
    password = models.CharField(max_length=255)           # increased to 255
    confirm_password = models.CharField(max_length=255)   # increased to 255
    last_login = models.DateTimeField(null=True, blank=True)  # optional, for consistency

    def __str__(self):
        return self.fullname


class Cashier(models.Model):
    fullname = models.CharField(max_length=30)
    email = models.CharField(max_length=100, unique=True)
    username = models.CharField(max_length=30, unique=True)
    password = models.CharField(max_length=255)           # increased to 255
    confirm_password = models.CharField(max_length=255)   # increased to 255
    last_login = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.fullname


class Manager(models.Model):
    fullname = models.CharField(max_length=30)
    email = models.CharField(max_length=100, unique=True)
    username = models.CharField(max_length=30, unique=True)
    password = models.CharField(max_length=255)           # increased to 255
    confirm_password = models.CharField(max_length=255)   # increased to 255
    last_login = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.fullname


# ================== NEW SUPPLIER MODEL ==================
class Supplier(models.Model):
    CATEGORY_CHOICES = [
        ('Electronics', 'Electronics'),
        ('Grocery', 'Grocery'),
        ('Clothing', 'Clothing'),
        ('Furniture', 'Furniture'),
        ('Books', 'Books'),
        ('Toys', 'Toys'),
        ('Sports', 'Sports'),
        ('Beauty', 'Beauty'),
        ('Automotive', 'Automotive'),
        ('Other', 'Other'),
    ]

    fullname = models.CharField(max_length=30)
    email = models.CharField(max_length=100, unique=True)
    username = models.CharField(max_length=30, unique=True)
    password = models.CharField(max_length=255)           # increased to 255
    confirm_password = models.CharField(max_length=255)   # increased to 255
    location = models.CharField(max_length=200)
    contact = models.CharField(max_length=20)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='Other')
    last_login = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.username

    class Meta:
        db_table = 'supplier'