from django.http import HttpResponse
from django.shortcuts import render, HttpResponseRedirect, redirect
from AccountsDB.models import Admin, Cashier, Manager
from productsDB.models import Product
from django.contrib.auth.hashers import make_password, check_password
from django.shortcuts import render, redirect
from django.contrib.auth.hashers import check_password
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from datetime import datetime


def index(request):
    return render(request,'index.html')

def test(request):
    return render(request,'test.html')

def admin_login(request):
    if request.method == 'POST':
        username = request.POST.get('username', '').lower()
        password = request.POST.get('password', '')

        # Get user by username
        try:
            user = Admin.objects.get(username=username)
        except Admin.DoesNotExist:
            return render(request, 'admin_login.html', {'error': 'Invalid username'})

        # IMPORTANT: check against the password field (where you stored the hash)
        if check_password(password, user.password):
            # create session
            request.session['username'] = user.username
            request.session['email'] = user.email

            # optional: confirm session saved (for debugging)
            # print("Session keys:", request.session.keys())

            return redirect('/admin_home')
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
        username = request.POST.get('username', '')
        password = request.POST.get('password')

        try:
            # Case-insensitive search
            manager = Manager.objects.get(username__iexact=username)
            
            if check_password(password, manager.password):
                # Set session
                request.session['manager_username'] = manager.username
                return redirect('manager_home')  # Use named URL
            else:
                error = "Invalid password"
        except Manager.DoesNotExist:
            error = "Manager not found"

        return render(request, 'manager_login.html', {'error': error})

    return render(request, 'manager_login.html')

def manager_registration(request):
    if request.method == 'POST':
        fullname = request.POST['fullname']
        email = request.POST['email']
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
        username = request.POST.get('username', '').lower()
        password = request.POST.get('password', '')

        try:
            user = Cashier.objects.get(username=username)
        except Cashier.DoesNotExist:
            return render(request, 'cashier_login.html', {'error': 'Invalid username'})

        # Compare hashed password
        if check_password(password, user.password):  
            request.session['cashier_username'] = user.username
            request.session['cashier_email'] = user.email

            return redirect('/cashier_home')   # CORRECT REDIRECT
        else:
            return render(request, 'cashier_login.html', {'error': 'Invalid username or password'})

    return render(request, "cashier_login.html")


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

@csrf_exempt
def admin_home(request):
    # Check if admin is logged in
    if not request.session.get('username'):
        return redirect('/admin_login')  # Redirect to login if not logged  
    
    # Count total users
    nadmin = Admin.objects.count()
    nmanager = Manager.objects.count()
    ncashier = Cashier.objects.count()
    totuser = nadmin + nmanager + ncashier
    
    # Count total products
    totpro = Product.objects.count()
    
    # Get all users with their details
    admins = Admin.objects.all()
    managers = Manager.objects.all()
    cashiers = Cashier.objects.all()
    
    # Combine all users into one list with proper formatting
    all_users = []
    
    # Process Admins
    for admin in admins:
        all_users.append({
            'id': admin.id,
            'type': 'Admin',
            'name': admin.fullname,
            'email': admin.email,
            'username': admin.username,
            'role': 'admin',
            'status': 'Active',
            'last_login': admin.last_login.strftime('%Y-%m-%d %H:%M') if hasattr(admin, 'last_login') and admin.last_login else 'Never'
        })
    
    # Process Managers
    for manager in managers:
        all_users.append({
            'id': manager.id,
            'type': 'Manager',
            'name': manager.fullname,
            'email': manager.email,
            'username': manager.username,
            'role': 'manager',
            'status': 'Active',
            'last_login': manager.last_login.strftime('%Y-%m-%d %H:%M') if hasattr(manager, 'last_login') and manager.last_login else 'Never'
        })
    
    # Process Cashiers
    for cashier in cashiers:
        all_users.append({
            'id': cashier.id,
            'type': 'Cashier',
            'name': cashier.fullname,
            'email': cashier.email,
            'username': cashier.username,
            'role': 'cashier',
            'status': 'Active',
            'last_login': cashier.last_login.strftime('%Y-%m-%d %H:%M') if hasattr(cashier, 'last_login') and cashier.last_login else 'Never'
        })
    
    # Get all products for product management
    all_products = Product.objects.all().values('id', 'name', 'category', 'price', 'in_stock', 'min_stock_level', 'sku')
    
    # Calculate dashboard statistics
    low_stock_count = Product.objects.filter(in_stock__lt=10).count()
    
    # Prepare context data
    context = {
        'uname': request.session.get('username'),
        'email': request.session.get('email'),
        'totaluser': totuser,
        'totalpro': totpro,
        'users': all_users,
        'products': list(all_products),
        'low_stock_count': low_stock_count,
    }
    
    # Handle new user registration
    if request.method == 'POST' and request.POST.get('formType') == 'userModal':
        user_role = request.POST.get('userRole')
        fullname = request.POST.get('fullName')
        email = request.POST.get('userEmail')
        username = request.POST.get('userName', '').lower()
        password = request.POST.get('userPassword')
        confirm_password = request.POST.get('confirmUserPassword')
        
        if password == confirm_password:
            hashed_password = make_password(password)
            
            if user_role == 'admin':
                Admin.objects.create(
                    fullname=fullname,
                    email=email,
                    username=username,
                    password=hashed_password,
                    confirm_password=hashed_password
                )
            elif user_role == 'manager':
                Manager.objects.create(
                    fullname=fullname,
                    email=email,
                    username=username,
                    password=hashed_password,
                    confirm_password=hashed_password
                )
            else:  # cashier
                Cashier.objects.create(
                    fullname=fullname,
                    email=email,
                    username=username,
                    password=hashed_password,
                    confirm_password=hashed_password
                )
            
            # Redirect to refresh the page with new data
            return redirect('/admin_home')
    
    # Handle new product addition
    if request.method == 'POST' and request.POST.get('formType') == 'productModal':
        Product.objects.create(
            name=request.POST.get('productName'),
            category=request.POST.get('productCategory'),
            sku=request.POST.get('productSKU'),
            brand=request.POST.get('productBrand'),
            price=request.POST.get('productPrice'),
            in_stock=request.POST.get('productStock'),
            min_stock_level=request.POST.get('productMinStock'),
            description=request.POST.get('productDescription')
        )
        
        # Redirect to refresh the page with new data
        return redirect('/admin_home')
    
    return render(request, 'admin_home.html', context)

def cashier_home(request):
    # Check if cashier is logged in
    if not request.session.get('cashier_username'):
        return redirect('/cashier_login')
    
    return render(request, 'cashier_home.html')

def manager_home(request):
    # Only allow access if manager is logged in
    if not request.session.get('manager_username'):
        return redirect('/manager_login')
    
    return render(request, 'manager_home.html')

def logout_view(request):
    request.session.flush()  # clears all session data
    return redirect('manager_login')  # or 'manager_login', 'cashier_login', etc.