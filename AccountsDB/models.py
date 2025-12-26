from django.db import models

# Create your models here.

class Admin(models.Model):
    fullname = models.CharField(max_length=30)
    email = models.CharField(max_length=100, unique=True)
    username = models.CharField(max_length=30, unique=True)
    password = models.CharField(max_length=30)
    confirm_password = models.CharField(max_length=30)

    def __str__(self):
        return self.fullname
    


class Cashier(models.Model):
    fullname = models.CharField(max_length=30)
    email = models.CharField(max_length=100, unique=True)
    username = models.CharField(max_length=30, unique=True)
    password = models.CharField(max_length=30)
    confirm_password = models.CharField(max_length=30)

    def __str__(self):
        return self.fullname
    



class Manager(models.Model):
    fullname = models.CharField(max_length=30)
    email = models.CharField(max_length=100, unique=True)
    username = models.CharField(max_length=30, unique=True)
    password = models.CharField(max_length=30)
    confirm_password = models.CharField(max_length=30)

    def __str__(self):
        return self.fullname
    

    