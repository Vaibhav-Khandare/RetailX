from django.http import HttpResponse,JsonResponse
from django.shortcuts import render, HttpResponseRedirect, redirect
from AccountsDB.models import Admin, Cashier, Manager
from productsDB.models import Product
from django.contrib.auth.hashers import make_password, check_password
from django.shortcuts import render, redirect
from django.contrib.auth.hashers import check_password
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from datetime import datetime
import json
import random
import smtplib
from email.mime.text import MIMEText
from django.contrib import messages

from django.shortcuts import render

from django.views.decorators.cache import never_cache
# import django.contrib.sessions



# OTP storage for admin, manager, and cashier
otp_storage = {}
manager_otp_storage = {}  # Separate storage for manager OTPs
cashier_otp_storage = {}  # Separate storage for cashier OTPs

def send_email_otp(receiver_email, otp, user_type="admin"):
    """Send OTP email for admin, manager, or cashier registration"""
    sender_email = "retailx.connect@gmail.com"
    sender_password = "kalk fnar rmnz imwj"
    
    if user_type == "admin":
        subject = "Your OTP Verification Code - RetailX Admin Registration"
        body = f"""Dear Admin,

This is an official email verification message from RetailX Team.

Your One-Time Password (OTP) for admin registration is: {otp}

Please use this code to verify your email address.

This OTP is valid for 5 minutes.

Thank you,
RetailX Team"""
    elif user_type == "manager":
        subject = "Your OTP Verification Code - RetailX Manager Registration"
        body = f"""Dear Manager,

This is an official email verification message from RetailX Team.

Your One-Time Password (OTP) for manager registration is: {otp}

Please use this code to verify your email address.

This OTP is valid for 5 minutes.

Thank you,
RetailX Team"""
    else:  # cashier
        subject = "Your OTP Verification Code - RetailX Cashier Registration"
        body = f"""Dear Cashier,

This is an official email verification message from RetailX Team.

Your One-Time Password (OTP) for cashier registration is: {otp}

Please use this code to verify your email address.

This OTP is valid for 5 minutes.

Thank you,
RetailX Team"""

    msg = MIMEText(body)
    msg['Subject'] = subject
    msg['From'] = sender_email
    msg['To'] = receiver_email

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, receiver_email, msg.as_string())
        print(f"{user_type.capitalize()} Registration Detected !!")
        print(f"OTP email sent to {receiver_email}")
        return True
    except Exception as e:
        print("Error sending email:", e)
        return False


def index(request):
   
    if request.session.get('manager_username'):
        # return redirect('manager_home')
        request.session.flush()
    
    # Otherwise show the landing page
    return render(request, 'index.html')

def test(request):
    return render(request,'test.html')

def admin_login(request):
    if request.method == 'POST':
        username = request.POST.get('username', '').lower()
        password = request.POST.get('password', '')

        try:
            user = Admin.objects.get(username=username)
        except Admin.DoesNotExist:
            return render(request, 'admin_login.html', {'error': 'Invalid username'})

        if check_password(password, user.password):
            request.session['username'] = user.username
            request.session['email'] = user.email
            return redirect('/admin_home')
        else:
            return render(request, 'admin_login.html', {'error': 'Invalid username or password'})

    return render(request, 'admin_login.html')

@csrf_exempt
def admin_registration(request):
    """Handle admin registration with OTP verification"""
    
    if request.method == 'POST' and request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        try:
            data = json.loads(request.body)
            action = data.get('action')
            email = data.get('email')
            
            if action == 'send_otp':
                if not email:
                    return JsonResponse({'status': 'error', 'message': 'Email is required'}, status=400)
                
                if Admin.objects.filter(email=email).exists():
                    return JsonResponse({
                        'status': 'error', 
                        'message': 'This email is already registered'
                    }, status=400)
                
                otp = str(random.randint(100000, 999999))
                if send_email_otp(email, otp, "admin"):
                    otp_storage[f'email_{email}'] = otp
                    return JsonResponse({
                        'status': 'success', 
                        'message': f'OTP sent to {email}'
                    })
                return JsonResponse({
                    'status': 'error', 
                    'message': 'Failed to send OTP'
                }, status=500)
                
            elif action == 'verify_otp':
                user_otp = data.get('otp')
                email = data.get('email')
                
                if not user_otp or not email:
                    return JsonResponse({
                        'status': 'error', 
                        'message': 'OTP and email are required'
                    }, status=400)
                
                stored_otp = otp_storage.get(f'email_{email}')
                
                if stored_otp and stored_otp == user_otp:
                    del otp_storage[f'email_{email}']
                    return JsonResponse({
                        'status': 'success', 
                        'message': 'Email verified successfully'
                    })
                
                return JsonResponse({
                    'status': 'error', 
                    'message': 'Incorrect OTP. Please check and try again.'
                }, status=400)
                
            else:
                return JsonResponse({
                    'status': 'error', 
                    'message': 'Invalid action'
                }, status=400)
                
        except json.JSONDecodeError:
            return JsonResponse({
                'status': 'error', 
                'message': 'Invalid request data'
            }, status=400)
        except Exception as e:
            print("Error:", str(e))
            return JsonResponse({
                'status': 'error', 
                'message': 'Server error'
            }, status=500)
    
    if request.method == 'POST':
        fullname = request.POST.get('fullname')
        email = request.POST.get('email')
        username = request.POST.get('username', '').lower()
        password = request.POST.get('password')
        confirm_password = request.POST.get('confirm_password')

        if password != confirm_password:
            messages.error(request, "Passwords do not match!")
            return render(request, 'admin_register.html')
        
        if Admin.objects.filter(username=username).exists():
            messages.error(request, "Username already exists!")
            return render(request, 'admin_register.html')
        
        if Admin.objects.filter(email=email).exists():
            messages.error(request, "Email already registered!")
            return render(request, 'admin_register.html')

        hashed_password = make_password(password)
        
        admin = Admin(
            fullname=fullname,
            email=email,
            username=username,
            password=hashed_password,
            confirm_password=hashed_password
        )
        admin.save()
        
        messages.success(request, "Registration successful! Please login.")
        return redirect('/admin_login')
    
    return render(request, 'admin_register.html')

@csrf_exempt
def manager_registration(request):
    """Handle manager registration with OTP verification"""
    
    # AJAX requests for OTP handling
    if request.method == 'POST' and request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        try:
            data = json.loads(request.body)
            action = data.get('action')
            email = data.get('email')
            
            if action == 'send_otp':
                if not email:
                    return JsonResponse({'status': 'error', 'message': 'Email is required'}, status=400)
                
                # Check if email already exists
                if Manager.objects.filter(email=email).exists():
                    return JsonResponse({
                        'status': 'error', 
                        'message': 'This email is already registered'
                    }, status=400)
                
                # Generate and store OTP
                otp = str(random.randint(100000, 999999))
                if send_email_otp(email, otp, "manager"):
                    manager_otp_storage[f'email_{email}'] = otp
                    return JsonResponse({
                        'status': 'success', 
                        'message': f'OTP sent to {email}'
                    })
                return JsonResponse({
                    'status': 'error', 
                    'message': 'Failed to send OTP'
                }, status=500)
                
            elif action == 'verify_otp':
                user_otp = data.get('otp')
                email = data.get('email')
                
                if not user_otp or not email:
                    return JsonResponse({
                        'status': 'error', 
                        'message': 'OTP and email are required'
                    }, status=400)
                
                stored_otp = manager_otp_storage.get(f'email_{email}')
                
                if stored_otp and stored_otp == user_otp:
                    del manager_otp_storage[f'email_{email}']
                    return JsonResponse({
                        'status': 'success', 
                        'message': 'Email verified successfully'
                    })
                
                return JsonResponse({
                    'status': 'error', 
                    'message': 'Incorrect OTP. Please check and try again.'
                }, status=400)
                
            else:
                return JsonResponse({
                    'status': 'error', 
                    'message': 'Invalid action'
                }, status=400)
                
        except json.JSONDecodeError:
            return JsonResponse({
                'status': 'error', 
                'message': 'Invalid request data'
            }, status=400)
        except Exception as e:
            print("Error:", str(e))
            return JsonResponse({
                'status': 'error', 
                'message': 'Server error'
            }, status=500)
    
    # Handle form submission (after OTP verification)
    if request.method == 'POST':
        fullname = request.POST.get('fullname')
        email = request.POST.get('email')
        username = request.POST.get('username', '').lower()
        password = request.POST.get('password')
        confirm_password = request.POST.get('confirm_password')

        # Validate passwords match
        if password != confirm_password:
            messages.error(request, "Passwords do not match!")
            return render(request, 'manager_register.html')
        
        # Check if username already exists
        if Manager.objects.filter(username=username).exists():
            messages.error(request, "Username already exists!")
            return render(request, 'manager_register.html')
        
        # Check if email already exists
        if Manager.objects.filter(email=email).exists():
            messages.error(request, "Email already registered!")
            return render(request, 'manager_register.html')

        # Hash password and create manager
        hashed_password = make_password(password)
        
        manager = Manager(
            fullname=fullname,
            email=email,
            username=username,
            password=hashed_password,
            confirm_password=hashed_password
        )
        manager.save()
        
        messages.success(request, "Registration successful! Please login.")
        return redirect('/manager_login')
    
    # GET request - show registration form
    return render(request, 'manager_register.html')

@csrf_exempt
def cashier_registration(request):
    """Handle cashier registration with OTP verification"""
    
    # AJAX requests for OTP handling
    if request.method == 'POST' and request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        try:
            data = json.loads(request.body)
            action = data.get('action')
            email = data.get('email')
            
            if action == 'send_otp':
                if not email:
                    return JsonResponse({'status': 'error', 'message': 'Email is required'}, status=400)
                
                # Check if email already exists
                if Cashier.objects.filter(email=email).exists():
                    return JsonResponse({
                        'status': 'error', 
                        'message': 'This email is already registered'
                    }, status=400)
                
                # Generate and store OTP
                otp = str(random.randint(100000, 999999))
                if send_email_otp(email, otp, "cashier"):
                    cashier_otp_storage[f'email_{email}'] = otp
                    return JsonResponse({
                        'status': 'success', 
                        'message': f'OTP sent to {email}'
                    })
                return JsonResponse({
                    'status': 'error', 
                    'message': 'Failed to send OTP'
                }, status=500)
                
            elif action == 'verify_otp':
                user_otp = data.get('otp')
                email = data.get('email')
                
                if not user_otp or not email:
                    return JsonResponse({
                        'status': 'error', 
                        'message': 'OTP and email are required'
                    }, status=400)
                
                stored_otp = cashier_otp_storage.get(f'email_{email}')
                
                if stored_otp and stored_otp == user_otp:
                    del cashier_otp_storage[f'email_{email}']
                    return JsonResponse({
                        'status': 'success', 
                        'message': 'Email verified successfully'
                    })
                
                return JsonResponse({
                    'status': 'error', 
                    'message': 'Incorrect OTP. Please check and try again.'
                }, status=400)
                
            else:
                return JsonResponse({
                    'status': 'error', 
                    'message': 'Invalid action'
                }, status=400)
                
        except json.JSONDecodeError:
            return JsonResponse({
                'status': 'error', 
                'message': 'Invalid request data'
            }, status=400)
        except Exception as e:
            print("Error:", str(e))
            return JsonResponse({
                'status': 'error', 
                'message': 'Server error'
            }, status=500)
    
    # Handle form submission (after OTP verification)
    if request.method == 'POST':
        fullname = request.POST.get('fullname')
        email = request.POST.get('email')
        username = request.POST.get('username', '').lower()
        password = request.POST.get('password')
        confirm_password = request.POST.get('confirm_password')

        # Validate passwords match
        if password != confirm_password:
            messages.error(request, "Passwords do not match!")
            return render(request, 'cashier_register.html')
        
        # Check if username already exists
        if Cashier.objects.filter(username=username).exists():
            messages.error(request, "Username already exists!")
            return render(request, 'cashier_register.html')
        
        # Check if email already exists
        if Cashier.objects.filter(email=email).exists():
            messages.error(request, "Email already registered!")
            return render(request, 'cashier_register.html')

        # Hash password and create cashier
        hashed_password = make_password(password)
        
        cashier = Cashier(
            fullname=fullname,
            email=email,
            username=username,
            password=hashed_password,
            confirm_password=hashed_password
        )
        cashier.save()
        
        messages.success(request, "Registration successful! Please login.")
        return redirect('/cashier_login')
    
    # GET request - show registration form
    return render(request, 'cashier_register.html')

def manager_login(request):
    if request.method == 'POST':
        username = request.POST.get('username', '')
        password = request.POST.get('password')

        try:
            manager = Manager.objects.get(username=username)
            
            if check_password(password, manager.password):
                request.session['manager_username'] = manager.username
                return redirect('manager_home')
            else:
                error = "Invalid password"
        except Manager.DoesNotExist:
            error = "Manager not found"

        return render(request, 'manager_login.html', {'error': error})

    return render(request, 'manager_login.html')

def cashier_login(request):
    if request.method == 'POST':
        username = request.POST.get('username', '').lower()
        password = request.POST.get('password', '')

        try:
            user = Cashier.objects.get(username=username)
        except Cashier.DoesNotExist:
            return render(request, 'cashier_login.html', {'error': 'Invalid username'})

        if check_password(password, user.password):  
            request.session['cashier_username'] = user.username
            request.session['cashier_email'] = user.email
            return redirect('/cashier_home')
        else:
            return render(request, 'cashier_login.html', {'error': 'Invalid username or password'})

    return render(request, "cashier_login.html")

@csrf_exempt
@never_cache
def admin_home(request):
    if not request.session.get('username'):
        return redirect('/admin_login')
    
    nadmin = Admin.objects.count()
    nmanager = Manager.objects.count()
    ncashier = Cashier.objects.count()
    totuser = nadmin + nmanager + ncashier
    totpro = Product.objects.count()
    
    admins = Admin.objects.all()
    managers = Manager.objects.all()
    cashiers = Cashier.objects.all()
    
    all_users = []
    
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
    
    all_products = Product.objects.all().values('id', 'name', 'category', 'price', 'in_stock', 'min_stock_level', 'sku')
    low_stock_count = Product.objects.filter(in_stock__lt=10).count()
    
    context = {
        'uname': request.session.get('username'),
        'email': request.session.get('email'),
        'totaluser': totuser,
        'totalpro': totpro,
        'users': all_users,
        'products': list(all_products),
        'low_stock_count': low_stock_count,
    }
    
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
            else:
                Cashier.objects.create(
                    fullname=fullname,
                    email=email,
                    username=username,
                    password=hashed_password,
                    confirm_password=hashed_password
                )
            
            return redirect('/admin_home')
    
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
        
        return redirect('/admin_home')
    
    return render(request, 'admin_home.html', context)

@never_cache
def cashier_home(request):
    if not request.session.get('cashier_username'):
        return redirect('/cashier_login')
    
    return render(request, 'cashier_home.html')


@never_cache
# WITH THIS:
def manager_home(request):
    if not request.session.get('manager_username'):
        return redirect('/')
    
    # Get manager details
    manager_username = request.session.get('manager_username')
    try:
        manager = Manager.objects.get(username=manager_username)
        context = {
            'manager_name': manager.fullname,
            'manager_username': manager.username
        }
    except Manager.DoesNotExist:
        context = {
            'manager_name': 'Manager',
            'manager_username': 'Unknown'
        }
    
    return render(request, 'manager_home.html', context)


def logout_view(request):
    request.session.flush()
    # from django.http import HttpResponseRedirect
    response = redirect('/')
    response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response['Pragma'] = 'no-cache'
    response['Expires'] = '0'
    return response

def about(request):
    return render(request, 'about.html')

def contact(request):
    return render(request, 'contact.html')

def base(request):
    return render(request, base.html)