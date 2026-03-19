from django.contrib import admin
from AccountsDB.models import Admin, Cashier, Manager, ChatRoom, Message
# Register your models here.

admin.site.register(Admin)
admin.site.register(Cashier)
admin.site.register(Manager)
admin.site.register(ChatRoom)
admin.site.register(Message)