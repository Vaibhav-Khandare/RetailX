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

# ============================================
# CHAT SYSTEM MODELS (Add this at the end of file)
# ============================================

class ChatRoom(models.Model):
    """
    Represents a chat room between a Manager and a Supplier
    One chat room per manager-supplier pair
    """
    manager = models.ForeignKey('Manager', on_delete=models.CASCADE, related_name='chat_rooms')
    supplier = models.ForeignKey('Supplier', on_delete=models.CASCADE, related_name='chat_rooms')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        # Ensure only one chat room per manager-supplier pair
        unique_together = ('manager', 'supplier')
        ordering = ['-updated_at']
    
    def __str__(self):
        return f"Chat: {self.manager.fullname} - {self.supplier.fullname}"

class Message(models.Model):
    """
    Represents individual messages in a chat room
    """
    SENDER_CHOICES = (
        ('manager', 'Manager'),
        ('supplier', 'Supplier'),
    )
    
    chat_room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='messages')
    sender_type = models.CharField(max_length=10, choices=SENDER_CHOICES)
    sender_id = models.IntegerField()  # ID of the sender (manager_id or supplier_id)
    content = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"Message from {self.sender_type} at {self.created_at}"