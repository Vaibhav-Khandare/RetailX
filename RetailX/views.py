from django.http import HttpResponse
from django.shortcuts import render, HttpResponseRedirect, redirect
from AccountsDB.models import Admin, Cashier, Manager
from django.contrib.auth.hashers import make_password, check_password
from django.shortcuts import render, redirect
from django.contrib.auth.hashers import check_password




def index(request):
    return render(request,'index.html')

def test(request):
    return render(request,'test.html')

def admin_login(request):
    if request.method == 'POST':
        username = request.POST.get('username', '').lower()
        password = request.POST.get('password')

        # Get user by username
        try:
            user = Admin.objects.get(username=username)
        except Admin.DoesNotExist:
            return render(request, 'admin_register.html')

        # Check hashed password
        if check_password(password, user.confirm_password):
            request.session['username'] = user.username
            request.session['email'] = user.email
            return redirect('/admin-home')
        else:
            return render(request, 'admin_login.html', {'error': 'Invalid username or password'})

    
    return render(request, 'admin_login.html')

def admin_registration(request):
    if request.method == 'POST':
        fullname = request.POST['fullname']
        email = request.POST['email']
        # username = request.POST['username'].lower()
        username = request.POST.get('username', '').lower()
        password = request.POST['password']
        confirm_password = request.POST['confirm_password']

        hashed_password = make_password(confirm_password)

        # database table object 
        # print(fullname, email, username, password, confirm_password)
        a1 = Admin(fullname=fullname, email=email, username=username, password=hashed_password, confirm_password=hashed_password)
        a1.save()
        return redirect('/admin_login')
    
    return render(request,'admin_register.html')

def manager_login(request):
    if request.method == 'POST':
        # username = request.POST['username']
        username = request.POST.get('username', '').lower()
        password = request.POST['password']

        # Get user by username
        try:
            user = Manager.objects.get(username=username)
        except Manager.DoesNotExist:
            return render(request, 'manager_register.html')

        # Check hashed password
        if check_password(password, user.confirm_password):
            request.session['username'] = user.username
            request.session['email'] = user.email
            return render(request, 'index.html')
        else:
            return render(request, 'manager_register.html')
    return render(request,'manager_login.html')

def manager_registration(request):
    if request.method == 'POST':
        fullname = request.POST['fullname']
        email = request.POST['email']
        # username = request.POST['username']
        username = request.POST.get('username', '').lower()
        password = request.POST['password']
        confirm_password = request.POST['confirm_password']

        hashed_password = make_password(confirm_password)

        # database table object 
        # print(fullname, email, username, password, confirm_password)
        m1 = Manager(fullname=fullname, email=email, username=username, password=hashed_password, confirm_password=hashed_password)
        m1.save()
        return redirect('/manager_login')
    return render(request,'manager_register.html')

def cashier_login(request):
    if request.method == 'POST':
        # username = request.POST['username']
        username = request.POST.get('username', '').lower()
        password = request.POST['password']

        # Get user by username
        try:
            user = Cashier.objects.get(username=username)
        except Cashier.DoesNotExist:
            return render(request, 'cashier_register.html')

        # Check hashed password
        if check_password(password, user.confirm_password):
            request.session['username'] = user.username
            request.session['email'] = user.email
            return render(request, 'index.html')
        else:
            return render(request, 'cashier_register.html')
    return render(request,"cashier_login.html")

def cashier_registration(request):
    if request.method == 'POST':
        fullname = request.POST['fullname']
        email = request.POST['email']
        # username = request.POST['username']
        username = request.POST.get('username', '').lower()
        password = request.POST['password']
        confirm_password = request.POST['confirm_password']

        hashed_password = make_password(confirm_password)

        # database table object 
        # print(fullname, email, username, password, confirm_password)
        c1 = Cashier(fullname=fullname, email=email, username=username, password=hashed_password, confirm_password=hashed_password)
        c1.save()
        return redirect('/cashier_login')
    
    return render(request,"cashier_register.html")


def admin_home(request):
    # Check if admin is logged in
    if not request.session.get('username'):
        return redirect('/admin_login')  # Redirect to login if not logged in
    return render(request, 'admin_home.html')

