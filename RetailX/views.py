import os
import json
import random
import smtplib
from email.mime.text import MIMEText
from datetime import datetime

import pandas as pd
import numpy as np
from prophet import Prophet
import joblib
from django.http import HttpResponse, JsonResponse
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.hashers import make_password, check_password
from django.views.decorators.csrf import csrf_exempt
from django.contrib import messages
from django.views.decorators.cache import never_cache
from django.conf import settings
from django.core import serializers
from django.db import IntegrityError
from django.db.models import Q

from AccountsDB.models import Admin, Cashier, Manager
from productsDB.models import Product

from .gemini_chat import ask_gemini

# ------------------------------
# Path to trained models folder
# ------------------------------
BASE_DIR = settings.BASE_DIR
MODEL_FOLDER = os.path.join(BASE_DIR, 'RetailX', 'trained_models')

# ------------------------------
# Festival list for dropdown
# ------------------------------
FESTIVAL_CHOICES = [
    "Diwali",
    "Holi", 
    "Christmas",
    "Eid",
    "Navratri",
    "Raksha Bandhan",
    "Ganesh Chaturthi",
    "Makar Sankranti",
    "Onam",
    "Pongal",
    "Karva Chauth",
    "Valentine",
    "New Year"
]

# ------------------------------
# Festival date mappings
# ------------------------------
def get_festival_from_date(date_obj):
    """
    Map a date to the correct festival name based on actual model file naming.
    Returns the festival name as it appears in your model files.
    """
    month = date_obj.month
    day = date_obj.day
    
    # Exact date mappings based on your festival_dates dictionary
    date_mapping = {
        (1, 1): "New Year",
        (1, 14): "Makar Sankranti",
        (1, 15): "Pongal",
        (1, 26): "Republic Day",
        (2, 14): "Valentine",
        (3, 8): "Holi",
        (3, 15): "Holi",
        (3, 18): "Holi",
        (3, 25): "Holi",
        (3, 29): "Holi",
        (4, 10): "Eid",
        (4, 11): "Eid",
        (4, 22): "Eid",
        (5, 3): "Eid",
        (5, 14): "Eid",
        (8, 11): "Raksha Bandhan",
        (8, 15): "Independence Day",
        (8, 19): "Raksha Bandhan",
        (8, 21): "Onam",
        (8, 22): "Raksha Bandhan",
        (8, 29): "Onam",
        (8, 30): "Raksha Bandhan",
        (8, 31): "Ganesh Chaturthi",
        (9, 1): "Ganesh Chaturthi",
        (9, 7): "Ganesh Chaturthi",
        (9, 8): "Onam",
        (9, 10): "Ganesh Chaturthi",
        (9, 15): "Onam",
        (9, 19): "Ganesh Chaturthi",
        (10, 2): "Gandhi Jayanti",
        (10, 3): "Navratri",
        (10, 7): "Navratri",
        (10, 13): "Karva Chauth",
        (10, 15): "Navratri",
        (10, 20): "Karva Chauth",
        (10, 24): "Karva Chauth",
        (10, 24): "Diwali",
        (10, 26): "Navratri",
        (11, 1): "Diwali",
        (11, 1): "Karva Chauth",
        (11, 4): "Diwali",
        (11, 12): "Diwali",
        (12, 25): "Christmas",
        (12, 31): "New Year",
    }
    
    # Check for exact match first
    festival = date_mapping.get((month, day))
    if festival:
        return festival
    
    # Month-based fallback
    month_mapping = {
        1: "New Year",
        2: "Valentine",
        3: "Holi",
        4: "Eid",
        5: "Eid",
        8: "Independence Day",
        9: "Ganesh Chaturthi",
        10: "Diwali",
        11: "Diwali",
        12: "Christmas",
    }
    
    return month_mapping.get(month)

# ------------------------------
# Helper: get festival sales predictions
# ------------------------------
def get_festival_sales(festival_name):
    """
    Load all Prophet models for a given festival, predict sales for the next
    occurrence of that festival (or a default future date), and return top and
    least selling products.
    """
    if not os.path.exists(MODEL_FOLDER):
        return {
            'error': 'Model folder not found.',
            'top_products': [],
            'least_products': [],
            'festival': festival_name
        }

    # Normalize festival name for model matching
    festival_clean = festival_name.strip()
    
    # Handle different naming patterns
    possible_formats = [
        festival_clean,
        festival_clean.lower(),
        festival_clean.title(),
        festival_clean.replace(' ', '_'),
        festival_clean.replace(' ', '_').lower(),
        festival_clean.replace(' ', '_').title(),
    ]
    
    # Add special mappings for common variations
    if festival_clean.lower() == "new year":
        possible_formats.extend(["new_year", "New_Year", "new year", "New Year", "newyear", "Newyear"])
    elif festival_clean.lower() == "valentine":
        possible_formats.extend(["valentine", "Valentine", "valentines", "Valentines", "valentines_day", "Valentines_Day"])
    elif festival_clean.lower() == "diwali":
        possible_formats.extend(["diwali", "Diwali", "deepawali", "Deepawali"])
    elif festival_clean.lower() == "christmas":
        possible_formats.extend(["christmas", "Christmas", "xmas", "Xmas"])
    elif festival_clean.lower() == "holi":
        possible_formats.extend(["holi", "Holi"])
    elif festival_clean.lower() == "eid":
        possible_formats.extend(["eid", "Eid", "eid_ul_fitr", "Eid_Ul_Fitr"])
    
    # Remove duplicates
    seen = set()
    possible_formats = [x for x in possible_formats if not (x.lower() in seen or seen.add(x.lower()))]
    
    # Find all model files that match any of the possible formats
    festival_models = []
    all_models = []
    
    for fname in os.listdir(MODEL_FOLDER):
        if not fname.endswith('.pkl'):
            continue
            
        all_models.append(fname)
        fname_lower = fname.lower()
        
        for format_name in possible_formats:
            format_lower = format_name.lower()
            if fname_lower.startswith(format_lower):
                festival_models.append(fname)
                break
            elif fname_lower.startswith(format_lower.replace('_', '') + '_'):
                festival_models.append(fname)
                break

    if not festival_models:
        print(f"Looking for festival: {festival_name}")
        print(f"Tried formats: {possible_formats}")
        return {
            'error': f'No models found for festival "{festival_name}". Please check the festival name.',
            'top_products': [],
            'least_products': [],
            'festival': festival_name
        }

    print(f"Found {len(festival_models)} models for festival {festival_name}")
    predictions = []

    for model_file in festival_models:
        model_path = os.path.join(MODEL_FOLDER, model_file)
        try:
            model = joblib.load(model_path)
        except Exception as e:
            print(f"Error loading model {model_file}: {e}")
            continue

        # Extract product name from filename
        product_name = model_file.replace('.pkl', '')
        
        for format_name in possible_formats:
            if product_name.lower().startswith(format_name.lower()):
                product_name = product_name[len(format_name):]
                if product_name and (product_name[0] == '_' or product_name[0] == ' '):
                    product_name = product_name[1:]
                break
        
        product_name = product_name.replace('_', ' ').strip()
        
        if not product_name:
            product_name = model_file.replace('.pkl', '').replace('_', ' ')
            for format_name in possible_formats:
                if product_name.lower().startswith(format_name.lower()):
                    product_name = product_name[len(format_name):].strip()
                    break

        # Determine future date for prediction
        if hasattr(model, 'history') and 'ds' in model.history.columns:
            last_date = model.history['ds'].max()
            future_date = last_date + pd.DateOffset(days=365)
        else:
            current_year = datetime.now().year
            festival_lower = festival_name.lower()
            
            if 'diwali' in festival_lower:
                future_date = pd.to_datetime(f'{current_year}-11-01')
            elif 'christmas' in festival_lower:
                future_date = pd.to_datetime(f'{current_year}-12-25')
            elif 'new year' in festival_lower or 'new_year' in festival_lower:
                future_date = pd.to_datetime(f'{current_year+1}-01-01')
            elif 'holi' in festival_lower:
                future_date = pd.to_datetime(f'{current_year}-03-15')
            elif 'eid' in festival_lower:
                future_date = pd.to_datetime(f'{current_year}-04-10')
            elif 'ganesh' in festival_lower:
                future_date = pd.to_datetime(f'{current_year}-09-01')
            elif 'valentine' in festival_lower:
                future_date = pd.to_datetime(f'{current_year}-02-14')
            else:
                future_date = pd.to_datetime(f'{current_year+1}-01-01')

        future = pd.DataFrame({'ds': [future_date]})

        try:
            forecast = model.predict(future)
            predicted_sales = forecast['yhat'].iloc[0]
            if np.isnan(predicted_sales) or predicted_sales < 0:
                predicted_sales = 0
        except Exception as e:
            print(f"Prediction failed for {model_file}: {e}")
            continue

        predictions.append({
            'product': product_name,
            'predicted_sales': round(predicted_sales, 0)
        })

    if not predictions:
        return {
            'error': 'Could not generate predictions.',
            'top_products': [],
            'least_products': [],
            'festival': festival_name
        }

    # Sort predictions by predicted sales
    predictions.sort(key=lambda x: x['predicted_sales'], reverse=True)

    # Take top 10 and least 10
    top_products = predictions[:10]
    least_products = predictions[-10:] if len(predictions) >= 10 else predictions[::-1]

    return {
        'festival': festival_name,
        'top_products': top_products,
        'least_products': least_products,
        'error': None
    }

# -------------------------------------------------------------------
# OTP Storage and Email Functions
# -------------------------------------------------------------------
otp_storage = {}
manager_otp_storage = {}
cashier_otp_storage = {}

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

# -------------------------------------------------------------------
# Public Pages
# -------------------------------------------------------------------
def index(request):
    if request.session.get('manager_username'):
        request.session.flush()
    
    return render(request, 'index.html')

def test(request):
    e = Product.objects.all()
    dic = {
        'sku':'101',
        'p_name':'hello'
    }
    print(e.sku)
    return render(request,'test.html', dic)

def about(request):
    return render(request, 'about.html')

def help(request):
    return render(request, 'help.html')

def privacy_policy(request):
    return render(request, 'privacy_policy.html')

def terms(request):
    return render(request, 'terms.html')

# -------------------------------------------------------------------
# Authentication Views
# -------------------------------------------------------------------
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

@csrf_exempt
def manager_registration(request):
    """Handle manager registration with OTP verification"""
    
    if request.method == 'POST' and request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        try:
            data = json.loads(request.body)
            action = data.get('action')
            email = data.get('email')
            
            if action == 'send_otp':
                if not email:
                    return JsonResponse({'status': 'error', 'message': 'Email is required'}, status=400)
                
                if Manager.objects.filter(email=email).exists():
                    return JsonResponse({
                        'status': 'error', 
                        'message': 'This email is already registered'
                    }, status=400)
                
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
    
    if request.method == 'POST':
        fullname = request.POST.get('fullname')
        email = request.POST.get('email')
        username = request.POST.get('username', '').lower()
        password = request.POST.get('password')
        confirm_password = request.POST.get('confirm_password')

        if password != confirm_password:
            messages.error(request, "Passwords do not match!")
            return render(request, 'manager_register.html')
        
        if Manager.objects.filter(username=username).exists():
            messages.error(request, "Username already exists!")
            return render(request, 'manager_register.html')
        
        if Manager.objects.filter(email=email).exists():
            messages.error(request, "Email already registered!")
            return render(request, 'manager_register.html')

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
    
    return render(request, 'manager_register.html')

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
def cashier_registration(request):
    """Handle cashier registration with OTP verification"""
    
    if request.method == 'POST' and request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        try:
            data = json.loads(request.body)
            action = data.get('action')
            email = data.get('email')
            
            if action == 'send_otp':
                if not email:
                    return JsonResponse({'status': 'error', 'message': 'Email is required'}, status=400)
                
                if Cashier.objects.filter(email=email).exists():
                    return JsonResponse({
                        'status': 'error', 
                        'message': 'This email is already registered'
                    }, status=400)
                
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
    
    if request.method == 'POST':
        fullname = request.POST.get('fullname')
        email = request.POST.get('email')
        username = request.POST.get('username', '').lower()
        password = request.POST.get('password')
        confirm_password = request.POST.get('confirm_password')

        if password != confirm_password:
            messages.error(request, "Passwords do not match!")
            return render(request, 'cashier_register.html')
        
        if Cashier.objects.filter(username=username).exists():
            messages.error(request, "Username already exists!")
            return render(request, 'cashier_register.html')
        
        if Cashier.objects.filter(email=email).exists():
            messages.error(request, "Email already registered!")
            return render(request, 'cashier_register.html')

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
    
    return render(request, 'cashier_register.html')

# -------------------------------------------------------------------
# Dashboard Views
# -------------------------------------------------------------------
@csrf_exempt
@never_cache
def admin_home(request):
    if not request.session.get('username'):
        return redirect('/admin_login')

    # ================== USER & PRODUCT DATA =====================
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

    all_products = Product.objects.all().values(
        'id', 'name', 'category', 'price', 'in_stock', 'min_stock_level', 'sku'
    )
    low_stock_count = Product.objects.filter(in_stock__lt=10).count()
    # ============================================================

    # ================== FESTIVAL SALES ANALYTICS =================
    festival_input = (request.GET.get('festival') or '').strip()
    print("FESTIVAL INPUT:", festival_input)
    detected_festival = None
    top_products = []
    least_products = []
    festival_error = None

    if festival_input:
        # Check if input is a date (DD-MM-YYYY format)
        try:
            # Try to parse as date
            input_date = datetime.strptime(festival_input, '%d-%m-%Y')
            
            # Get the correct festival name based on actual model naming
            festival_name = get_festival_from_date(input_date)
            
            if festival_name:
                print(f"Date {festival_input} mapped to festival: {festival_name}")
                # Get predictions for that festival
                festival_result = get_festival_sales(festival_name)
                top_products = festival_result.get("top_products", [])
                least_products = festival_result.get("least_products", [])
                detected_festival = festival_name
                festival_error = festival_result.get("error")
            else:
                festival_error = f"No festival found for date {festival_input}"
                    
        except ValueError:
            # Not a valid date, treat as festival name
            print(f"Treating '{festival_input}' as festival name")
            festival_result = get_festival_sales(festival_input)
            top_products = festival_result.get("top_products", [])
            least_products = festival_result.get("least_products", [])
            detected_festival = festival_result.get("festival")
            festival_error = festival_result.get("error")
    # ============================================================

    # ================== CONTEXT ================================
    # Convert products to JSON-safe format
    import json
    top_products_json = json.dumps(list(top_products)) if top_products else '[]'
    least_products_json = json.dumps(list(least_products)) if least_products else '[]'
    
    context = {
        'uname': request.session.get('username'),
        'email': request.session.get('email'),
        'totaluser': totuser,
        'totalpro': totpro,
        'users': all_users,
        'products': list(all_products),
        'low_stock_count': low_stock_count,
        'top_products': top_products_json,
        'least_products': least_products_json,
        'detected_festival': detected_festival,
        'festival_error': festival_error,
        'festival_choices': FESTIVAL_CHOICES,
    }
    # ============================================================

    # ================== USER MODAL POST =========================
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

    # ================== PRODUCT MODAL POST ======================
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
    # ============================================================

    return render(request, 'admin_home.html', context)

@never_cache
def cashier_home(request):
    if not request.session.get('cashier_username'):
        return redirect('/cashier_login')
    
    cashier_username = request.session.get('cashier_username')
    try:
        cashier = Cashier.objects.get(username=cashier_username)
        
        # =========================================================
        # FETCH REAL PRODUCTS FROM DJANGO DATABASE
        # =========================================================
        # We query the Product model for all available items
        products_queryset = Product.objects.filter(is_available=True).values(
            'id', 'name', 'sku', 'category', 'brand', 'price', 'in_stock'
        )
        
        # Convert the queryset into a standard Python list of dictionaries
        # Crucial: Convert Decimal prices to float so JSON can serialize them
        products_list = []
        for p in products_queryset:
            products_list.append({
                'id': p['id'],
                'name': p['name'],
                'sku': p['sku'],
                'category': p['category'] or 'General',
                'brand': p['brand'] or 'N/A',
                'price': float(p['price']),       # Converted for JS
                'in_stock': p['in_stock']         # Used for stock validation
            })
            
        # Do NOT use json.dumps() here. Pass the raw Python list.
        # The Django {{ products_data|json_script:"products-data" }} tag in HTML 
        # handles the secure JSON stringification automatically.
        # =========================================================

        context = {
            'cashier_name': cashier.fullname,
            'cashier_username': cashier.username,
            'products_data': products_list  # Passing actual DB data
        }
    except Cashier.DoesNotExist:
        context = {
            'cashier_name': 'Cashier',
            'cashier_username': 'Unknown',
            'products_data': []
        }
        
    return render(request, 'cashier_home.html', context)

# ====================================================================
# ENHANCED MANAGER HOME WITH COMPLETE CASHIER CRUD OPERATIONS
# ====================================================================

@never_cache
def manager_home(request):
    if not request.session.get('manager_username'):
        return redirect('/')
    
    manager_username = request.session.get('manager_username')
    try:
        manager = Manager.objects.get(username=manager_username)
        
        # ================== FESTIVAL SALES ANALYTICS =================
        festival_input = (request.GET.get('festival') or '').strip()
        print("MANAGER - FESTIVAL INPUT:", festival_input)
        detected_festival = None
        top_products = []
        least_products = []
        festival_error = None

        if festival_input:
            # Check if input is a date (DD-MM-YYYY format)
            try:
                # Try to parse as date
                input_date = datetime.strptime(festival_input, '%d-%m-%Y')
                
                # Get the correct festival name based on actual model naming
                festival_name = get_festival_from_date(input_date)
                
                if festival_name:
                    print(f"Date {festival_input} mapped to festival: {festival_name}")
                    # Get predictions for that festival
                    festival_result = get_festival_sales(festival_name)
                    top_products = festival_result.get("top_products", [])
                    least_products = festival_result.get("least_products", [])
                    detected_festival = festival_name
                    festival_error = festival_result.get("error")
                else:
                    festival_error = f"No festival found for date {festival_input}"
                        
            except ValueError:
                # Not a valid date, treat as festival name
                print(f"Treating '{festival_input}' as festival name")
                festival_result = get_festival_sales(festival_input)
                top_products = festival_result.get("top_products", [])
                least_products = festival_result.get("least_products", [])
                detected_festival = festival_result.get("festival")
                festival_error = festival_result.get("error")
        # ============================================================

        # ================== GET ALL CASHIERS FOR STAFF MANAGEMENT =================
        all_cashiers = Cashier.objects.all().order_by('-id')
        cashiers_list = []
        for cashier in all_cashiers:
            cashiers_list.append({
                'id': cashier.id,
                'fullname': cashier.fullname,
                'email': cashier.email,
                'username': cashier.username,
            })
        # ============================================================

        # ================== CONTEXT ================================
        import json
        top_products_json = json.dumps(list(top_products)) if top_products else '[]'
        least_products_json = json.dumps(list(least_products)) if least_products else '[]'
        
        context = {
            'manager_name': manager.fullname,
            'manager_username': manager.username,
            'top_products': top_products_json,
            'least_products': least_products_json,
            'detected_festival': detected_festival,
            'festival_error': festival_error,
            'festival_choices': FESTIVAL_CHOICES,
            'cashiers': json.dumps(cashiers_list),
            'total_cashiers': len(cashiers_list),
        }
        # ============================================================
        
    except Manager.DoesNotExist:
        context = {
            'manager_name': 'Manager',
            'manager_username': 'Unknown',
            'top_products': '[]',
            'least_products': '[]',
            'detected_festival': None,
            'festival_error': None,
            'festival_choices': FESTIVAL_CHOICES,
            'cashiers': '[]',
            'total_cashiers': 0,
        }
    
    return render(request, 'manager_home.html', context)

# ====================================================================
# CASHIER MANAGEMENT API ENDPOINTS (AJAX)
# ====================================================================

@csrf_exempt
@never_cache
def get_all_cashiers(request):
    """API endpoint to get all cashiers (AJAX)"""
    if not request.session.get('manager_username'):
        return JsonResponse({'error': 'Unauthorized'}, status=401)
    
    if request.method == 'GET':
        cashiers = Cashier.objects.all().order_by('-id')
        cashiers_data = []
        
        for cashier in cashiers:
            cashiers_data.append({
                'id': cashier.id,
                'fullname': cashier.fullname,
                'email': cashier.email,
                'username': cashier.username,
            })
        
        return JsonResponse({
            'success': True,
            'cashiers': cashiers_data,
            'total': len(cashiers_data)
        })
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)


@csrf_exempt
@never_cache
def add_cashier(request):
    """API endpoint to add a new cashier"""
    if not request.session.get('manager_username'):
        return JsonResponse({'error': 'Unauthorized'}, status=401)
    
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            # Extract data
            fullname = data.get('fullname', '')
            email = data.get('email', '')
            username = data.get('username', '').lower()
            password = data.get('password', '')
            
            # Validation
            if not fullname or not email or not username or not password:
                return JsonResponse({
                    'success': False,
                    'error': 'All required fields must be filled'
                }, status=400)
            
            # Check if username already exists
            if Cashier.objects.filter(username=username).exists():
                return JsonResponse({
                    'success': False,
                    'error': 'Username already exists'
                }, status=400)
            
            # Check if email already exists
            if Cashier.objects.filter(email=email).exists():
                return JsonResponse({
                    'success': False,
                    'error': 'Email already registered'
                }, status=400)
            
            # Hash password
            hashed_password = make_password(password)
            
            # Create cashier
            cashier = Cashier(
                fullname=fullname,
                email=email,
                username=username,
                password=hashed_password,
                confirm_password=hashed_password
            )
            cashier.save()
            
            return JsonResponse({
                'success': True,
                'message': 'Cashier added successfully',
                'cashier': {
                    'id': cashier.id,
                    'fullname': cashier.fullname,
                    'email': cashier.email,
                    'username': cashier.username,
                }
            })
            
        except IntegrityError as e:
            return JsonResponse({
                'success': False,
                'error': 'Database error. Username or email may already exist.'
            }, status=400)
        except Exception as e:
            print(f"Error adding cashier: {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)


@csrf_exempt
@never_cache
def edit_cashier(request, cashier_id):
    """API endpoint to edit an existing cashier"""
    if not request.session.get('manager_username'):
        return JsonResponse({'error': 'Unauthorized'}, status=401)
    
    if request.method == 'PUT':
        try:
            data = json.loads(request.body)
            
            # Get cashier
            cashier = get_object_or_404(Cashier, id=cashier_id)
            
            # Extract data
            fullname = data.get('fullname', '')
            email = data.get('email', '')
            username = data.get('username', '').lower()
            password = data.get('password', '')
            
            # Validation
            if not fullname or not email or not username:
                return JsonResponse({
                    'success': False,
                    'error': 'Required fields cannot be empty'
                }, status=400)
            
            # Check if username already exists (excluding current cashier)
            if Cashier.objects.filter(username=username).exclude(id=cashier_id).exists():
                return JsonResponse({
                    'success': False,
                    'error': 'Username already taken by another cashier'
                }, status=400)
            
            # Check if email already exists (excluding current cashier)
            if Cashier.objects.filter(email=email).exclude(id=cashier_id).exists():
                return JsonResponse({
                    'success': False,
                    'error': 'Email already registered to another cashier'
                }, status=400)
            
            # Update fields
            cashier.fullname = fullname
            cashier.email = email
            cashier.username = username
            
            # Update password if provided
            if password and password.strip():
                cashier.password = make_password(password)
                cashier.confirm_password = cashier.password
            
            cashier.save()
            
            return JsonResponse({
                'success': True,
                'message': 'Cashier updated successfully'
            })
            
        except Exception as e:
            print(f"Error updating cashier: {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)


@csrf_exempt
@never_cache
def delete_cashier(request, cashier_id):
    """API endpoint to delete a cashier"""
    if not request.session.get('manager_username'):
        return JsonResponse({'error': 'Unauthorized'}, status=401)
    
    if request.method == 'DELETE':
        try:
            cashier = get_object_or_404(Cashier, id=cashier_id)
            cashier_name = cashier.fullname
            cashier.delete()
            
            return JsonResponse({
                'success': True,
                'message': f'Cashier {cashier_name} deleted successfully'
            })
            
        except Exception as e:
            print(f"Error deleting cashier: {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)


@csrf_exempt
@never_cache
def get_cashier_details(request, cashier_id):
    """API endpoint to get details of a specific cashier"""
    if not request.session.get('manager_username'):
        return JsonResponse({'error': 'Unauthorized'}, status=401)
    
    if request.method == 'GET':
        try:
            cashier = get_object_or_404(Cashier, id=cashier_id)
            
            return JsonResponse({
                'success': True,
                'cashier': {
                    'id': cashier.id,
                    'fullname': cashier.fullname,
                    'email': cashier.email,
                    'username': cashier.username,
                }
            })
            
        except Exception as e:
            print(f"Error fetching cashier details: {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)


# -------------------------------------------------------------------
# Logout View
# -------------------------------------------------------------------
def logout_view(request):
    request.session.flush()
    response = redirect('/')
    response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response['Pragma'] = 'no-cache'
    response['Expires'] = '0'
    return response

@csrf_exempt
def chatbot_api(request):
    if request.method == "POST":
        try:
            print("✅ CHATBOT REQUEST RECEIVED")
            
            # Parse JSON data
            data = json.loads(request.body)
            message = data.get("message", "")
            
            print(f"📝 USER MESSAGE: {message}")
            
            if not message:
                return JsonResponse({"reply": "Please send a message."}, status=400)
            
            # Get response from Gemini
            reply = ask_gemini(message)
            
            print(f"🤖 BOT REPLY: {reply[:100]}...")
            
            return JsonResponse({"reply": reply})
            
        except json.JSONDecodeError:
            print("❌ Invalid JSON")
            return JsonResponse({"reply": "Invalid request format."}, status=400)
        except Exception as e:
            print(f"❌ CHATBOT ERROR: {str(e)}")
            return JsonResponse({"reply": "Server error. Please try again."}, status=500)
    
    return JsonResponse({"reply": "Only POST requests are allowed."}, status=405)