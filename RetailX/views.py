from django.http import HttpResponse
from django.shortcuts import render, HttpResponseRedirect

def index(request):
    return render(request,'index.html')

def test(request):
    return render(request,'test.html')

def admin_login(request):
    return render(request,'admin_login.html')

def admin_registration(request):
    return render(request,'admin_register.html')

def manager_login(request):
    return render(request,'manager_login.html')

def manager_registration(request):
    return render(request,'manager_register.html')

def cashier_login(request):
    return render(request,"cashier_login.html")

def cashier_registration(request):
    return render(request,"cashier_register.html")