from django.contrib import admin
from AccountsDB.models import Admin, Cashier, Manager
# Register your models here.

admin.site.register(Admin)
admin.site.register(Cashier)
admin.site.register(Manager)