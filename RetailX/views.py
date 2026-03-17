import os
import json
import pickle
import random
import smtplib
import csv
import traceback
import string
from email.mime.text import MIMEText
from datetime import datetime, date as date_type
from collections import defaultdict

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
from django.views.decorators.http import require_POST, require_GET
from django.contrib.auth.decorators import login_required
from functools import lru_cache

# ================== MODELS ==================
from AccountsDB.models import Admin, Cashier, Manager, Supplier
from productsDB.models import Product

from .gemini_chat import ask_gemini

# ================== OTP STORAGES ==================
otp_storage = {}
manager_otp_storage = {}
cashier_otp_storage = {}
supplier_otp_storage = {}

# ================== AGE PREDICTION SETUP ==================
AGE_MODEL_PATH = os.path.join(settings.BASE_DIR, 'RetailX', 'trained_models', 'age_prediction')
AGE_MODEL_FILE = os.path.join(AGE_MODEL_PATH, 'customer_age_prediction_model.pkl')
ENCODERS_FILE = os.path.join(AGE_MODEL_PATH, 'encoders.pkl')

# Path to customer data CSV for category-brand mapping
CUSTOMER_DATA_CSV = os.path.join(settings.BASE_DIR, 'static', 'Dataset_CSV', 'customer_data.csv')
_category_brands = None

print(f"=== Age Prediction Model Path ===")
print(f"BASE_DIR: {settings.BASE_DIR}")
print(f"AGE_MODEL_PATH: {AGE_MODEL_PATH}")
print(f"Model file exists: {os.path.exists(AGE_MODEL_FILE)}")
print(f"Encoders file exists: {os.path.exists(ENCODERS_FILE)}")
print(f"================================")


def get_category_brands_mapping():
    """Load category to brands mapping from customer_data.csv"""
    global _category_brands
    if _category_brands is not None:
        return _category_brands

    mapping = defaultdict(set)
    try:
        if not os.path.exists(CUSTOMER_DATA_CSV):
            print(f"Warning: Customer data CSV not found at {CUSTOMER_DATA_CSV}")
            _category_brands = {}
            return _category_brands

        with open(CUSTOMER_DATA_CSV, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                cat = row.get('product_category', '').strip()
                brand = row.get('brand', '').strip()
                if cat and brand:
                    mapping[cat].add(brand)

        # Convert sets to sorted lists
        for cat in mapping:
            mapping[cat] = sorted(list(mapping[cat]))

        _category_brands = dict(mapping)
        print(f"Loaded {len(_category_brands)} categories with brands from CSV")

    except Exception as e:
        print(f"Error loading customer_data.csv: {e}")
        _category_brands = {}

    return _category_brands


@lru_cache(maxsize=1)
def load_age_prediction_model():
    """Load and cache the KNN model and encoders."""
    if not os.path.exists(AGE_MODEL_FILE):
        raise FileNotFoundError(f"Model file not found at {AGE_MODEL_FILE}")
    if not os.path.exists(ENCODERS_FILE):
        raise FileNotFoundError(f"Encoders file not found at {ENCODERS_FILE}")

    model = joblib.load(AGE_MODEL_FILE)
    encoders = joblib.load(ENCODERS_FILE)

    return model, encoders


# ================== AGE PREDICTION API ==================
@csrf_exempt
@require_POST
def predict_age_api(request):
    """
    API endpoint for age group prediction.
    UPDATED: Model now expects only 2 features (product_category and brand)
    """
    try:
        if not os.path.exists(AGE_MODEL_FILE):
            return JsonResponse({'error': f'Model file not found at {AGE_MODEL_FILE}'}, status=500)
        if not os.path.exists(ENCODERS_FILE):
            return JsonResponse({'error': f'Encoders file not found at {ENCODERS_FILE}'}, status=500)

        model = joblib.load(AGE_MODEL_FILE)
        encoders = joblib.load(ENCODERS_FILE)

        data = json.loads(request.body)
        product_category = data.get('product_category', '').strip()
        brand = data.get('brand', '').strip()

        le_category = encoders["category"]
        le_brand = encoders["brand"]
        le_agegroup = encoders["agegroup"]

        print(f"\nInput category: '{product_category}'")
        print(f"Input brand: '{brand}'")

        # Encode categorical features
        try:
            cat_encoded = le_category.transform([product_category])[0]
            print(f"Encoded category: {cat_encoded}")
        except ValueError as e:
            valid_cats = list(le_category.classes_)
            error_msg = f"Unknown category '{product_category}'. Valid categories: {valid_cats}"
            print(error_msg)
            return JsonResponse({'error': error_msg}, status=400)

        try:
            brand_encoded = le_brand.transform([brand])[0]
            print(f"Encoded brand: {brand_encoded}")
        except ValueError as e:
            valid_brands = list(le_brand.classes_)[:20]
            error_msg = f"Unknown brand '{brand}'. Valid brands: {valid_brands}..."
            print(error_msg)
            return JsonResponse({'error': error_msg}, status=400)

        # Prepare features with ONLY 2 features (matching the retrained model)
        # Order: [product_category, brand]
        features = np.array([[cat_encoded, brand_encoded]])
        print(f"✅ Feature array shape: {features.shape} - should be (1, 2)")
        print(f"Feature array: {features[0]}")

        # Predict
        pred_encoded = model.predict(features)[0]
        age_group = le_agegroup.inverse_transform([pred_encoded])[0]
        print(f"✅ Predicted age group: {age_group}")

        return JsonResponse({'age_group': age_group})

    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON format'}, status=400)
    except Exception as e:
        traceback.print_exc()
        return JsonResponse({'error': str(e)}, status=500)


@require_GET
def get_valid_categories_brands(request):
    """Return all valid categories and brands from the encoders"""
    try:
        if not os.path.exists(ENCODERS_FILE):
            return JsonResponse({'error': f'Encoders file not found at {ENCODERS_FILE}'}, status=500)
        encoders = joblib.load(ENCODERS_FILE)
        categories = list(encoders["category"].classes_)
        brands = list(encoders["brand"].classes_)
        return JsonResponse({'categories': categories, 'brands': brands})
    except Exception as e:
        traceback.print_exc()
        return JsonResponse({'error': str(e)}, status=500)


@require_GET
def get_brands_for_category(request):
    """
    Return brands for a specific category.
    First tries to load from CSV, falls back to all brands from encoder.
    """
    category = request.GET.get('category', '').strip()
    print(f"=" * 50)
    print(f"🔍 get_brands_for_category called with category: '{category}'")

    if not category:
        print("⚠️ No category provided")
        return JsonResponse({'brands': []})

    brands = []

    # Try to get from CSV mapping first
    try:
        mapping = get_category_brands_mapping()
        brands = mapping.get(category, [])
        print(f"📊 Found {len(brands)} brands from CSV for '{category}'")
    except Exception as e:
        print(f"⚠️ Error getting brands from CSV: {e}")

    # If no brands found from CSV, fall back to all brands from encoder
    if not brands:
        print(f"⚠️ No brands found from CSV, falling back to encoder...")
        try:
            encoders = joblib.load(ENCODERS_FILE)
            brands = list(encoders["brand"].classes_)
            print(f"✅ Loaded {len(brands)} brands from encoder")
        except Exception as e:
            print(f"❌ Error loading brands from encoder: {e}")
            return JsonResponse({'error': 'Could not load brands'}, status=500)

    return JsonResponse({'brands': brands})


# ================== PRODUCT LIST (for reports) ==================
@login_required
def product_list(request):
    products = Product.objects.all().values(
        'serial_no',
        'product_name',
        'price',
        'quantity',
        'category',
        'subcategory'
    )
    return JsonResponse({'products': list(products)})


# ================== RANDOM INVENTORY ==================
@login_required
def get_random_inventory(request):
    products = list(Product.objects.all().values(
        'id', 'serial_no', 'product_name', 'price', 'quantity', 'category', 'subcategory'
    ))
    random.shuffle(products)
    return JsonResponse({'products': products})


# ================== PREDICTION HELPERS ==================
@login_required
def get_products_for_festival_api(request):
    festival = request.GET.get('festival', '')
    mock_products = {
        'Diwali': ['Fireworks', 'Sweets', 'Lights'],
        'Christmas': ['Tree', 'Gifts', 'Candles'],
        'Eid': ['Sweets', 'Clothes', 'Dates'],
    }
    products = mock_products.get(festival, [])
    return JsonResponse({'products': products})


@login_required
def predict_sales_api(request):
    product_name = request.GET.get('product')
    predicted_units = random.randint(50, 200)
    product = Product.objects.filter(product_name=product_name).first()
    price = product.price if product else 100
    predicted_revenue = predicted_units * price
    return JsonResponse({
        'predicted_units': predicted_units,
        'predicted_revenue': predicted_revenue,
        'date': request.GET.get('date')
    })

# ============================================
# MODULE 2: AGE SEGMENTATION FROM AGE INPUT (DECISION TREE MODEL)
# ============================================
# This module uses a Decision Tree model trained on:
# - age
# It predicts age group and provides product/brand preferences.
# 
# Model files:
# - age_group_model.pkl          : Trained Decision Tree
# - age_group_encoder.pkl        : Label encoder for age groups
# - product_preferences.pkl      : DataFrame of top products per age group
# - brand_preferences.pkl        : DataFrame of top brands per age group
# ============================================

# Path to Decision Tree model files
DT_MODEL_PATH = os.path.join(settings.BASE_DIR, 'RetailX', 'trained_models', 'age_segmentation')
DT_MODEL_FILE = os.path.join(DT_MODEL_PATH, 'age_group_model.pkl')
DT_ENCODER_FILE = os.path.join(DT_MODEL_PATH, 'age_group_encoder.pkl')
DT_PRODUCT_PREFS_FILE = os.path.join(DT_MODEL_PATH, 'product_preferences.pkl')
DT_BRAND_PREFS_FILE = os.path.join(DT_MODEL_PATH, 'brand_preferences.pkl')

# Global variables to cache loaded data for Module 2
_dt_model = None
_dt_encoder = None
_dt_product_prefs = None
_dt_brand_prefs = None

print(f"=== MODULE 2: Decision Tree Age Segmentation Model ===")
print(f"Model path: {DT_MODEL_PATH}")
print(f"Model file exists: {os.path.exists(DT_MODEL_FILE)}")
print(f"Encoder file exists: {os.path.exists(DT_ENCODER_FILE)}")
print(f"Product prefs exists: {os.path.exists(DT_PRODUCT_PREFS_FILE)}")
print(f"Brand prefs exists: {os.path.exists(DT_BRAND_PREFS_FILE)}")
print(f"======================================================")


def load_dt_models():
    """
    Load all Decision Tree models and preference data
    
    Returns:
        bool: True if loaded successfully, False otherwise
    """
    global _dt_model, _dt_encoder, _dt_product_prefs, _dt_brand_prefs
    
    try:
        # Load model and encoder
        if os.path.exists(DT_MODEL_FILE):
            with open(DT_MODEL_FILE, 'rb') as f:
                _dt_model = pickle.load(f)
            print(f"✅ Loaded Decision Tree model from {DT_MODEL_FILE}")
        
        if os.path.exists(DT_ENCODER_FILE):
            with open(DT_ENCODER_FILE, 'rb') as f:
                _dt_encoder = pickle.load(f)
            print(f"✅ Loaded age encoder from {DT_ENCODER_FILE}")
        
        # Load preference DataFrames
        if os.path.exists(DT_PRODUCT_PREFS_FILE):
            with open(DT_PRODUCT_PREFS_FILE, 'rb') as f:
                _dt_product_prefs = pickle.load(f)
            print(f"✅ Loaded product preferences from {DT_PRODUCT_PREFS_FILE}")
        
        if os.path.exists(DT_BRAND_PREFS_FILE):
            with open(DT_BRAND_PREFS_FILE, 'rb') as f:
                _dt_brand_prefs = pickle.load(f)
            print(f"✅ Loaded brand preferences from {DT_BRAND_PREFS_FILE}")
        
        return True
    except Exception as e:
        print(f"❌ Error loading Decision Tree models: {e}")
        traceback.print_exc()
        return False

# Load Module 2 models on startup
load_dt_models()


@csrf_exempt
@require_POST
def predict_age_segmentation_api(request):
    """
    MODULE 2: Age segmentation from age input (Decision Tree model)
    
    Expected JSON:
        {"age": 24}
    
    Returns:
        JsonResponse: {
            "age_group": "18-25",
            "products": {"Electronics": "Headphones", ...},
            "brands": {"Electronics": "Sony", ...}
        }
    """
    try:
        print("=" * 50)
        print("📊 MODULE 2: Age Segmentation API called")
        
        # Check if models are loaded
        if _dt_model is None or _dt_encoder is None:
            if not load_dt_models():
                return JsonResponse({
                    'error': 'Decision Tree models not loaded properly. Check server logs.'
                }, status=500)
        
        # Parse request
        data = json.loads(request.body)
        age = data.get('age')
        
        print(f"📥 Received age: {age}")
        
        # Validate input
        if age is None:
            return JsonResponse({'error': 'Age is required'}, status=400)
        
        try:
            age = int(age)
            if age < 18 or age > 100:
                return JsonResponse({'error': 'Age must be between 18 and 100'}, status=400)
        except ValueError:
            return JsonResponse({'error': 'Age must be a valid number'}, status=400)
        
        # Predict age group
        age_pred_encoded = _dt_model.predict([[age]])[0]
        age_group = _dt_encoder.inverse_transform([age_pred_encoded])[0]
        print(f"🎯 Predicted age group: {age_group}")
        
        # Get product preferences
        products_dict = {}
        if _dt_product_prefs is not None:
            age_products = _dt_product_prefs[_dt_product_prefs['age_group'] == age_group]
            for _, row in age_products.iterrows():
                products_dict[row['product_category']] = row['product_name']
        
        # Get brand preferences
        brands_dict = {}
        if _dt_brand_prefs is not None:
            age_brands = _dt_brand_prefs[_dt_brand_prefs['age_group'] == age_group]
            for _, row in age_brands.iterrows():
                brands_dict[row['product_category']] = row['brand']
        
        print(f"📦 Found {len(products_dict)} product categories")
        print(f"🏷️ Found {len(brands_dict)} brand categories")
        
        return JsonResponse({
            'age_group': age_group,
            'products': products_dict,
            'brands': brands_dict
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON format'}, status=400)
    except Exception as e:
        print("❌ Error in MODULE 2:")
        traceback.print_exc()
        return JsonResponse({'error': str(e)}, status=500)


@require_GET
def get_age_segmentation_info(request):
    """
    MODULE 2 helper: Returns metadata about the age segmentation model
    
    Returns:
        JsonResponse: Model information including type, age groups, and status
    """
    return JsonResponse({
        'model_type': 'DecisionTreeClassifier',
        'age_groups': list(_dt_encoder.classes_) if _dt_encoder else [],
        'accuracy': '100%',
        'description': 'Predicts age group from age and shows product/brand preferences',
        'status': 'loaded' if _dt_model is not None else 'not loaded'
    })

# ================== FESTIVAL SALES PREDICTION (old models) ==================
BASE_DIR = settings.BASE_DIR
MODEL_FOLDER = os.path.join(BASE_DIR, 'RetailX', 'trained_models')
FESTIVAL_MODEL_FOLDER = os.path.join(BASE_DIR, 'RetailX', 'trained_models', 'festival')

FESTIVAL_CHOICES = [
    "Diwali", "Holi", "Christmas", "Eid", "Navratri", "Raksha Bandhan",
    "Ganesh Chaturthi", "Makar Sankranti", "Onam", "Pongal", "Karva Chauth",
    "Valentine", "New Year"
]


def get_festival_from_date(date_obj):
    month = date_obj.month
    day = date_obj.day

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

    festival = date_mapping.get((month, day))
    if festival:
        return festival

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


def get_festival_sales(festival_name):
    if not os.path.exists(MODEL_FOLDER):
        return {
            'error': 'Model folder not found.',
            'top_products': [],
            'least_products': [],
            'festival': festival_name
        }

    festival_clean = festival_name.strip()
    possible_formats = [
        festival_clean,
        festival_clean.lower(),
        festival_clean.title(),
        festival_clean.replace(' ', '_'),
        festival_clean.replace(' ', '_').lower(),
        festival_clean.replace(' ', '_').title(),
    ]

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

    seen = set()
    possible_formats = [x for x in possible_formats if not (x.lower() in seen or seen.add(x.lower()))]

    festival_models = []

    for fname in os.listdir(MODEL_FOLDER):
        if not fname.endswith('.pkl'):
            continue
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
        return {
            'error': f'No models found for festival "{festival_name}".',
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

    predictions.sort(key=lambda x: x['predicted_sales'], reverse=True)
    top_products = predictions[:10]
    least_products = predictions[-10:] if len(predictions) >= 10 else predictions[::-1]

    return {
        'festival': festival_name,
        'top_products': top_products,
        'least_products': least_products,
        'error': None
    }


# ================== EMAIL OTP FUNCTION ==================
def send_email_otp(receiver_email, otp, user_type="admin"):
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
    elif user_type == "cashier":
        subject = "Your OTP Verification Code - RetailX Cashier Registration"
        body = f"""Dear Cashier,

This is an official email verification message from RetailX Team.

Your One-Time Password (OTP) for cashier registration is: {otp}

Please use this code to verify your email address.

This OTP is valid for 5 minutes.

Thank you,
RetailX Team"""
    elif user_type == "supplier":
        subject = "Your OTP Verification Code - RetailX Supplier Registration"
        body = f"""Dear Supplier,

This is an official email verification message from RetailX Team.

Your One-Time Password (OTP) for supplier registration is: {otp}

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


def send_password_reset_email(email, temp_password, user_type):
    sender_email = "retailx.connect@gmail.com"
    sender_password = "kalk fnar rmnz imwj"
    subject = "Your RetailX Password Has Been Reset"
    body = f"""Dear {user_type.capitalize()},

Your password has been reset by an administrator.

Your temporary password is: {temp_password}

Please log in and change your password immediately.

Thank you,
RetailX Team"""
    msg = MIMEText(body)
    msg['Subject'] = subject
    msg['From'] = sender_email
    msg['To'] = email
    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, email, msg.as_string())
    except Exception as e:
        print(f"Failed to send email: {e}")


# ================== PUBLIC PAGES ==================
def index(request):
    if request.session.get('manager_username'):
        request.session.flush()
    return render(request, 'index.html')


def test(request):
    e = Product.objects.all()
    dic = {'sku': '101', 'p_name': 'hello'}
    print(e.sku)
    return render(request, 'test.html', dic)


def about(request):
    return render(request, 'about.html')


def help(request):
    return render(request, 'help.html')


def privacy_policy(request):
    return render(request, 'privacy_policy.html')


def terms(request):
    return render(request, 'terms.html')


# ================== ADMIN AUTH ==================
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
    if request.method == 'POST' and request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        try:
            data = json.loads(request.body)
            action = data.get('action')
            email = data.get('email')

            if action == 'send_otp':
                if not email:
                    return JsonResponse({'status': 'error', 'message': 'Email is required'}, status=400)

                if Admin.objects.filter(email=email).exists():
                    return JsonResponse({'status': 'error', 'message': 'This email is already registered'}, status=400)

                otp = str(random.randint(100000, 999999))
                if send_email_otp(email, otp, "admin"):
                    otp_storage[f'email_{email}'] = otp
                    return JsonResponse({'status': 'success', 'message': f'OTP sent to {email}'})
                return JsonResponse({'status': 'error', 'message': 'Failed to send OTP'}, status=500)

            elif action == 'verify_otp':
                user_otp = data.get('otp')
                email = data.get('email')

                if not user_otp or not email:
                    return JsonResponse({'status': 'error', 'message': 'OTP and email are required'}, status=400)

                stored_otp = otp_storage.get(f'email_{email}')

                if stored_otp and stored_otp == user_otp:
                    del otp_storage[f'email_{email}']
                    return JsonResponse({'status': 'success', 'message': 'Email verified successfully'})

                return JsonResponse({'status': 'error', 'message': 'Incorrect OTP. Please check and try again.'}, status=400)

            else:
                return JsonResponse({'status': 'error', 'message': 'Invalid action'}, status=400)

        except json.JSONDecodeError:
            return JsonResponse({'status': 'error', 'message': 'Invalid request data'}, status=400)
        except Exception as e:
            print("Error:", str(e))
            return JsonResponse({'status': 'error', 'message': 'Server error'}, status=500)

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


# ================== MANAGER AUTH ==================
def manager_login(request):
    if request.method == 'POST':
        username = request.POST.get('username', '')
        password = request.POST.get('password', '')

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
    if request.method == 'POST' and request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        try:
            data = json.loads(request.body)
            action = data.get('action')
            email = data.get('email')

            if action == 'send_otp':
                if not email:
                    return JsonResponse({'status': 'error', 'message': 'Email is required'}, status=400)

                if Manager.objects.filter(email=email).exists():
                    return JsonResponse({'status': 'error', 'message': 'This email is already registered'}, status=400)

                otp = str(random.randint(100000, 999999))
                if send_email_otp(email, otp, "manager"):
                    manager_otp_storage[f'email_{email}'] = otp
                    return JsonResponse({'status': 'success', 'message': f'OTP sent to {email}'})
                return JsonResponse({'status': 'error', 'message': 'Failed to send OTP'}, status=500)

            elif action == 'verify_otp':
                user_otp = data.get('otp')
                email = data.get('email')

                if not user_otp or not email:
                    return JsonResponse({'status': 'error', 'message': 'OTP and email are required'}, status=400)

                stored_otp = manager_otp_storage.get(f'email_{email}')

                if stored_otp and stored_otp == user_otp:
                    del manager_otp_storage[f'email_{email}']
                    return JsonResponse({'status': 'success', 'message': 'Email verified successfully'})

                return JsonResponse({'status': 'error', 'message': 'Incorrect OTP. Please check and try again.'}, status=400)

            else:
                return JsonResponse({'status': 'error', 'message': 'Invalid action'}, status=400)

        except json.JSONDecodeError:
            return JsonResponse({'status': 'error', 'message': 'Invalid request data'}, status=400)
        except Exception as e:
            print("Error:", str(e))
            return JsonResponse({'status': 'error', 'message': 'Server error'}, status=500)

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


# ================== CASHIER AUTH ==================
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
    if request.method == 'POST' and request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        try:
            data = json.loads(request.body)
            action = data.get('action')
            email = data.get('email')

            if action == 'send_otp':
                if not email:
                    return JsonResponse({'status': 'error', 'message': 'Email is required'}, status=400)

                if Cashier.objects.filter(email=email).exists():
                    return JsonResponse({'status': 'error', 'message': 'This email is already registered'}, status=400)

                otp = str(random.randint(100000, 999999))
                if send_email_otp(email, otp, "cashier"):
                    cashier_otp_storage[f'email_{email}'] = otp
                    return JsonResponse({'status': 'success', 'message': f'OTP sent to {email}'})
                return JsonResponse({'status': 'error', 'message': 'Failed to send OTP'}, status=500)

            elif action == 'verify_otp':
                user_otp = data.get('otp')
                email = data.get('email')

                if not user_otp or not email:
                    return JsonResponse({'status': 'error', 'message': 'OTP and email are required'}, status=400)

                stored_otp = cashier_otp_storage.get(f'email_{email}')

                if stored_otp and stored_otp == user_otp:
                    del cashier_otp_storage[f'email_{email}']
                    return JsonResponse({'status': 'success', 'message': 'Email verified successfully'})

                return JsonResponse({'status': 'error', 'message': 'Incorrect OTP. Please check and try again.'}, status=400)

            else:
                return JsonResponse({'status': 'error', 'message': 'Invalid action'}, status=400)

        except json.JSONDecodeError:
            return JsonResponse({'status': 'error', 'message': 'Invalid request data'}, status=400)
        except Exception as e:
            print("Error:", str(e))
            return JsonResponse({'status': 'error', 'message': 'Server error'}, status=500)

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


# ================== SUPPLIER AUTH ==================
def supplier_login(request):
    if request.method == 'POST':
        username = request.POST.get('username', '').lower()
        password = request.POST.get('password', '')

        try:
            user = Supplier.objects.get(username=username)
        except Supplier.DoesNotExist:
            return render(request, 'supplier_login.html', {'error': 'Invalid username'})

        if check_password(password, user.password):
            request.session['supplier_username'] = user.username
            request.session['supplier_email'] = user.email
            return redirect('/supplier_home')
        else:
            return render(request, 'supplier_login.html', {'error': 'Invalid username or password'})

    return render(request, 'supplier_login.html')


@csrf_exempt
def supplier_registration(request):
    """Handle supplier registration with OTP verification"""

    if request.method == 'POST' and request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        try:
            data = json.loads(request.body)
            action = data.get('action')
            email = data.get('email')

            if action == 'send_otp':
                if not email:
                    return JsonResponse({'status': 'error', 'message': 'Email is required'}, status=400)

                if Supplier.objects.filter(email=email).exists():
                    return JsonResponse({'status': 'error', 'message': 'This email is already registered'}, status=400)

                otp = str(random.randint(100000, 999999))
                if send_email_otp(email, otp, "supplier"):
                    supplier_otp_storage[f'email_{email}'] = otp
                    return JsonResponse({'status': 'success', 'message': f'OTP sent to {email}'})
                return JsonResponse({'status': 'error', 'message': 'Failed to send OTP'}, status=500)

            elif action == 'verify_otp':
                user_otp = data.get('otp')
                email = data.get('email')

                if not user_otp or not email:
                    return JsonResponse({'status': 'error', 'message': 'OTP and email are required'}, status=400)

                stored_otp = supplier_otp_storage.get(f'email_{email}')

                if stored_otp and stored_otp == user_otp:
                    del supplier_otp_storage[f'email_{email}']
                    return JsonResponse({'status': 'success', 'message': 'Email verified successfully'})

                return JsonResponse({'status': 'error', 'message': 'Incorrect OTP. Please check and try again.'}, status=400)

            else:
                return JsonResponse({'status': 'error', 'message': 'Invalid action'}, status=400)

        except json.JSONDecodeError:
            return JsonResponse({'status': 'error', 'message': 'Invalid request data'}, status=400)
        except Exception as e:
            print("Error:", str(e))
            return JsonResponse({'status': 'error', 'message': 'Server error'}, status=500)

    if request.method == 'POST':
        fullname = request.POST.get('fullname')
        email = request.POST.get('email')
        username = request.POST.get('username', '').lower()
        password = request.POST.get('password')
        confirm_password = request.POST.get('confirm_password')
        location = request.POST.get('location')
        contact = request.POST.get('contact')
        category = request.POST.get('category')

        if password != confirm_password:
            messages.error(request, "Passwords do not match!")
            return render(request, 'supplier_register.html')

        if Supplier.objects.filter(username=username).exists():
            messages.error(request, "Username already exists!")
            return render(request, 'supplier_register.html')

        if Supplier.objects.filter(email=email).exists():
            messages.error(request, "Email already registered!")
            return render(request, 'supplier_register.html')

        hashed_password = make_password(password)

        supplier = Supplier(
            fullname=fullname,
            email=email,
            username=username,
            password=hashed_password,
            confirm_password=hashed_password,
            location=location,
            contact=contact,
            category=category
        )
        supplier.save()

        messages.success(request, "Registration successful! Please login.")
        return redirect('/supplier_login')

    return render(request, 'supplier_register.html')


# ================== SUPPLIER DASHBOARD ==================
@never_cache
def supplier_home(request):
    if not request.session.get('supplier_username'):
        return redirect('/supplier_login')

    supplier_username = request.session.get('supplier_username')
    try:
        supplier = Supplier.objects.get(username=supplier_username)
        context = {
            'supplier_name': supplier.fullname,
            'supplier_username': supplier.username,
            'supplier_email': supplier.email,
            'supplier_location': supplier.location,
            'supplier_contact': supplier.contact,
            'supplier_category': supplier.category,
        }
    except Supplier.DoesNotExist:
        context = {
            'supplier_name': 'Supplier',
            'supplier_username': 'Unknown',
        }
    return render(request, 'supplier_home.html', context)


# ================== DASHBOARD VIEWS ==================
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
            'last_login': admin.last_login.strftime('%Y-%m-%d %H:%M') if admin.last_login else 'Never'
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
            'last_login': manager.last_login.strftime('%Y-%m-%d %H:%M') if manager.last_login else 'Never'
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
            'last_login': cashier.last_login.strftime('%Y-%m-%d %H:%M') if cashier.last_login else 'Never'
        })

    all_products = Product.objects.all().values(
        'id', 'name', 'category', 'price', 'in_stock', 'min_stock_level', 'sku'
    )
    low_stock_count = Product.objects.filter(in_stock__lt=10).count()

    festival_input = (request.GET.get('festival') or '').strip()
    detected_festival = None
    top_products = []
    least_products = []
    festival_error = None

    if festival_input:
        try:
            input_date = datetime.strptime(festival_input, '%d-%m-%Y')
            festival_name = get_festival_from_date(input_date)
            if festival_name:
                festival_result = get_festival_sales(festival_name)
                top_products = festival_result.get("top_products", [])
                least_products = festival_result.get("least_products", [])
                detected_festival = festival_name
                festival_error = festival_result.get("error")
            else:
                festival_error = f"No festival found for date {festival_input}"
        except ValueError:
            festival_result = get_festival_sales(festival_input)
            top_products = festival_result.get("top_products", [])
            least_products = festival_result.get("least_products", [])
            detected_festival = festival_result.get("festival")
            festival_error = festival_result.get("error")

    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        response_data = {
            'detected_festival': detected_festival,
            'top_products': top_products,
            'least_products': least_products,
            'festival_error': festival_error,
        }
        return JsonResponse(response_data)

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

    cashier_username = request.session.get('cashier_username')
    try:
        cashier = Cashier.objects.get(username=cashier_username)
        products_queryset = Product.objects.filter(is_available=True).values(
            'id', 'name', 'sku', 'category', 'brand', 'price', 'in_stock'
        )
        products_list = []
        for p in products_queryset:
            products_list.append({
                'id': p['id'],
                'name': p['name'],
                'sku': p['sku'],
                'category': p['category'] or 'General',
                'brand': p['brand'] or 'N/A',
                'price': float(p['price']),
                'in_stock': p['in_stock']
            })
        context = {
            'cashier_name': cashier.fullname,
            'cashier_username': cashier.username,
            'products_data': products_list
        }
    except Cashier.DoesNotExist:
        context = {
            'cashier_name': 'Cashier',
            'cashier_username': 'Unknown',
            'products_data': []
        }
    return render(request, 'cashier_home.html', context)


@never_cache
def manager_home(request):
    if not request.session.get('manager_username'):
        return redirect('/')

    manager_username = request.session.get('manager_username')
    try:
        manager = Manager.objects.get(username=manager_username)
        festival_input = (request.GET.get('festival') or '').strip()
        detected_festival = None
        top_products = []
        least_products = []
        festival_error = None

        if festival_input:
            try:
                input_date = datetime.strptime(festival_input, '%d-%m-%Y')
                festival_name = get_festival_from_date(input_date)
                if festival_name:
                    festival_result = get_festival_sales(festival_name)
                    top_products = festival_result.get("top_products", [])
                    least_products = festival_result.get("least_products", [])
                    detected_festival = festival_name
                    festival_error = festival_result.get("error")
                else:
                    festival_error = f"No festival found for date {festival_input}"
            except ValueError:
                festival_result = get_festival_sales(festival_input)
                top_products = festival_result.get("top_products", [])
                least_products = festival_result.get("least_products", [])
                detected_festival = festival_result.get("festival")
                festival_error = festival_result.get("error")

        all_cashiers = Cashier.objects.all().order_by('-id')
        cashiers_list = []
        for cashier in all_cashiers:
            cashiers_list.append({
                'id': cashier.id,
                'fullname': cashier.fullname,
                'email': cashier.email,
                'username': cashier.username,
            })

        import json
        top_products_json = json.dumps(list(top_products)) if top_products else '[]'
        least_products_json = json.dumps(list(least_products)) if least_products else '[]'
        today_date = date_type.today().isoformat()

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
            'today_date': today_date,
        }
    except Manager.DoesNotExist:
        today_date = date_type.today().isoformat()
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
            'today_date': today_date,
        }
    return render(request, 'manager_home.html', context)


# ================== CASHIER MANAGEMENT API ==================
@csrf_exempt
@never_cache
def get_all_cashiers(request):
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
        return JsonResponse({'success': True, 'cashiers': cashiers_data, 'total': len(cashiers_data)})
    return JsonResponse({'error': 'Method not allowed'}, status=405)


@csrf_exempt
@never_cache
def add_cashier(request):
    if not request.session.get('manager_username'):
        return JsonResponse({'error': 'Unauthorized'}, status=401)

    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            fullname = data.get('fullname', '')
            email = data.get('email', '')
            username = data.get('username', '').lower()
            password = data.get('password', '')

            if not fullname or not email or not username or not password:
                return JsonResponse({'success': False, 'error': 'All required fields must be filled'}, status=400)

            if Cashier.objects.filter(username=username).exists():
                return JsonResponse({'success': False, 'error': 'Username already exists'}, status=400)

            if Cashier.objects.filter(email=email).exists():
                return JsonResponse({'success': False, 'error': 'Email already registered'}, status=400)

            hashed_password = make_password(password)
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
        except IntegrityError:
            return JsonResponse({'success': False, 'error': 'Database error. Username or email may already exist.'}, status=400)
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=500)
    return JsonResponse({'error': 'Method not allowed'}, status=405)


@csrf_exempt
@never_cache
def edit_cashier(request, cashier_id):
    if not request.session.get('manager_username'):
        return JsonResponse({'error': 'Unauthorized'}, status=401)

    if request.method == 'PUT':
        try:
            data = json.loads(request.body)
            cashier = get_object_or_404(Cashier, id=cashier_id)
            fullname = data.get('fullname', '')
            email = data.get('email', '')
            username = data.get('username', '').lower()
            password = data.get('password', '')

            if not fullname or not email or not username:
                return JsonResponse({'success': False, 'error': 'Required fields cannot be empty'}, status=400)

            if Cashier.objects.filter(username=username).exclude(id=cashier_id).exists():
                return JsonResponse({'success': False, 'error': 'Username already taken by another cashier'}, status=400)

            if Cashier.objects.filter(email=email).exclude(id=cashier_id).exists():
                return JsonResponse({'success': False, 'error': 'Email already registered to another cashier'}, status=400)

            cashier.fullname = fullname
            cashier.email = email
            cashier.username = username

            if password and password.strip():
                cashier.password = make_password(password)
                cashier.confirm_password = cashier.password

            cashier.save()
            return JsonResponse({'success': True, 'message': 'Cashier updated successfully'})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=500)
    return JsonResponse({'error': 'Method not allowed'}, status=405)


@csrf_exempt
@never_cache
def delete_cashier(request, cashier_id):
    if not request.session.get('manager_username'):
        return JsonResponse({'error': 'Unauthorized'}, status=401)

    if request.method == 'DELETE':
        try:
            cashier = get_object_or_404(Cashier, id=cashier_id)
            cashier_name = cashier.fullname
            cashier.delete()
            return JsonResponse({'success': True, 'message': f'Cashier {cashier_name} deleted successfully'})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=500)
    return JsonResponse({'error': 'Method not allowed'}, status=405)


@csrf_exempt
@never_cache
def get_cashier_details(request, cashier_id):
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
            return JsonResponse({'success': False, 'error': str(e)}, status=500)
    return JsonResponse({'error': 'Method not allowed'}, status=405)


# ================== LOGOUT ==================
def logout_view(request):
    request.session.flush()
    response = redirect('/')
    response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response['Pragma'] = 'no-cache'
    response['Expires'] = '0'
    return response


def admin_logout(request):
    """Admin-specific logout: clears session and redirects to admin login."""
    request.session.flush()
    response = redirect('/admin_login')
    response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response['Pragma'] = 'no-cache'
    response['Expires'] = '0'
    return response

def cashier_logout(request):
    """Cashier-specific logout: clears session and redirects to cashier login."""
    request.session.flush()
    response = redirect('/cashier_login')
    response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response['Pragma'] = 'no-cache'
    response['Expires'] = '0'
    return response




def supplier_logout(request):
    """Supplier-specific logout: clears session and redirects to supplier login with cache prevention."""
    # Clear all session data
    request.session.flush()
    
    # Create response that redirects to supplier login
    response = redirect('/supplier_login/')
    
    # Add headers to prevent caching of the dashboard page
    response['Cache-Control'] = 'no-cache, no-store, must-revalidate, private, max-age=0'
    response['Pragma'] = 'no-cache'
    response['Expires'] = '0'
    
    # Add headers to prevent browser from storing the page
    response['X-Frame-Options'] = 'DENY'
    
    return response




# ================== CHATBOT API ==================
@csrf_exempt
def chatbot_api(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            message = data.get("message", "")
            if not message:
                return JsonResponse({"reply": "Please send a message."}, status=400)
            reply = ask_gemini(message)
            return JsonResponse({"reply": reply})
        except json.JSONDecodeError:
            return JsonResponse({"reply": "Invalid request format."}, status=400)
        except Exception as e:
            return JsonResponse({"reply": "Server error. Please try again."}, status=500)
    return JsonResponse({"reply": "Only POST requests are allowed."}, status=405)


# ================== NEW PREDICTION API (festival subfolder) ==================
@csrf_exempt
def get_products_for_festival_api(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    festival = request.GET.get('festival')
    if not festival:
        return JsonResponse({'error': 'Festival parameter required'}, status=400)

    festival_clean = festival.strip().lower().replace(' ', '_')
    products = set()

    if not os.path.exists(FESTIVAL_MODEL_FOLDER):
        return JsonResponse({'products': []})

    for fname in os.listdir(FESTIVAL_MODEL_FOLDER):
        if not fname.endswith('.pkl'):
            continue
        if fname.lower().startswith(festival_clean):
            prod = fname[len(festival_clean):].replace('.pkl', '').replace('_', ' ').strip()
            if prod:
                products.add(prod)

    return JsonResponse({'products': list(products)})


@csrf_exempt
def predict_sales_api(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    festival = request.GET.get('festival')
    product = request.GET.get('product')
    date_str = request.GET.get('date')

    if not all([festival, product, date_str]):
        return JsonResponse({'error': 'Missing parameters'}, status=400)

    try:
        target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        predicted_units = predict_single_product(festival, product, target_date)
        price = 100
        try:
            product_obj = Product.objects.filter(name__icontains=product).first()
            if product_obj:
                price = float(product_obj.price)
        except:
            pass
        predicted_revenue = predicted_units * price
        return JsonResponse({
            'festival': festival,
            'product': product,
            'date': date_str,
            'predicted_units': round(predicted_units, 2),
            'predicted_revenue': round(predicted_revenue, 2)
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


def predict_single_product(festival_name, product_name, target_date):
    if not os.path.exists(FESTIVAL_MODEL_FOLDER):
        raise FileNotFoundError("Festival model folder not found.")

    festival_clean = festival_name.strip().lower().replace(' ', '_')
    product_clean = product_name.strip().replace(' ', '_')

    model_filename = None
    for fname in os.listdir(FESTIVAL_MODEL_FOLDER):
        if not fname.endswith('.pkl'):
            continue
        if fname.lower().startswith(festival_clean) and product_clean.lower() in fname.lower():
            model_filename = fname
            break

    if not model_filename:
        for fname in os.listdir(FESTIVAL_MODEL_FOLDER):
            if not fname.endswith('.pkl'):
                continue
            if fname.lower().startswith(festival_clean) and product_clean.lower().replace(' ', '_') in fname.lower():
                model_filename = fname
                break

    if not model_filename:
        raise ValueError(f"No model found for {festival_name} - {product_name}")

    model_path = os.path.join(FESTIVAL_MODEL_FOLDER, model_filename)
    try:
        model = joblib.load(model_path)
    except Exception as e:
        raise RuntimeError(f"Error loading model: {e}")

    future = pd.DataFrame({'ds': [pd.Timestamp(target_date)]})
    forecast = model.predict(future)
    predicted_sales = forecast['yhat'].iloc[0]
    if np.isnan(predicted_sales) or predicted_sales < 0:
        predicted_sales = 0
    return predicted_sales


# ================== INVENTORY CSV ENDPOINT ==================
INVENTORY_CSV_PATH = os.path.join(BASE_DIR, 'static', 'Dataset_CSV', 'updated_product_dataset.csv')


def _normalize_column_name(col):
    return col.strip().lower().replace(' ', '').replace('_', '')


@csrf_exempt
@never_cache
def get_random_inventory(request):
    if not os.path.exists(INVENTORY_CSV_PATH):
        return JsonResponse({'error': 'CSV file not found'}, status=404)

    products = []
    try:
        with open(INVENTORY_CSV_PATH, mode='r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            field_mapping = {}
            for col in reader.fieldnames:
                norm = _normalize_column_name(col)
                if norm in ('serialno', 'serial', 'sno', 'serial_no'):
                    field_mapping['serial_no'] = col
                elif norm in ('productname', 'product', 'name', 'product_name'):
                    field_mapping['product_name'] = col
                elif norm in ('category', 'cat'):
                    field_mapping['category'] = col
                elif norm in ('price', 'cost', 'sellingprice'):
                    field_mapping['price'] = col
                elif norm in ('quantity', 'qty', 'stock', 'in_stock'):
                    field_mapping['quantity'] = col
                elif norm in ('subcategory', 'subcat', 'sub_category'):
                    field_mapping['subcategory'] = col

            for idx, row in enumerate(reader, start=1):
                def get_val(key, default=''):
                    actual_col = field_mapping.get(key)
                    return row.get(actual_col, '').strip() if actual_col else default

                serial_no = get_val('serial_no', str(idx))
                product_name = get_val('product_name', 'Unknown')
                category = get_val('category', 'General')
                subcategory = get_val('subcategory', '')

                price_str = get_val('price', '0').replace('$', '').replace(',', '').strip()
                try:
                    price = float(price_str) if price_str else 0.0
                except ValueError:
                    price = 0.0

                qty_str = get_val('quantity', '0').replace(',', '').strip()
                try:
                    quantity = int(float(qty_str)) if qty_str else 0
                except ValueError:
                    quantity = 0

                product = {
                    'serial_no': serial_no,
                    'product_name': product_name,
                    'category': category,
                    'price': price,
                    'quantity': quantity,
                    'subcategory': subcategory,
                }
                products.append(product)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

    random.shuffle(products)
    selected = products[:50]
    for idx, p in enumerate(selected):
        p['id'] = idx + 1

    return JsonResponse({'products': selected})


# ================== USER MANAGEMENT API ==================
@require_GET
def get_user(request, user_type, user_id):
    if not request.session.get('username'):
        return JsonResponse({'success': False, 'error': 'Unauthorized'}, status=401)

    model_map = {'admin': Admin, 'manager': Manager, 'cashier': Cashier}
    model = model_map.get(user_type.lower())
    if not model:
        return JsonResponse({'success': False, 'error': 'Invalid user type'}, status=400)

    try:
        user = model.objects.get(id=user_id)
        data = {
            'id': user.id,
            'fullname': user.fullname,
            'email': user.email,
            'username': user.username,
        }
        return JsonResponse({'success': True, 'user': data})
    except model.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'User not found'}, status=404)


@require_POST
def edit_user(request, user_type, user_id):
    if not request.session.get('username'):
        return JsonResponse({'success': False, 'error': 'Unauthorized'}, status=401)

    model_map = {'admin': Admin, 'manager': Manager, 'cashier': Cashier}
    model = model_map.get(user_type.lower())
    if not model:
        return JsonResponse({'success': False, 'error': 'Invalid user type'}, status=400)

    try:
        user = model.objects.get(id=user_id)
        fullname = request.POST.get('fullname')
        email = request.POST.get('email')
        username = request.POST.get('username')
        password = request.POST.get('password')

        if username != user.username and model.objects.filter(username=username).exists():
            return JsonResponse({'success': False, 'error': 'Username already taken'})
        if email != user.email and model.objects.filter(email=email).exists():
            return JsonResponse({'success': False, 'error': 'Email already registered'})

        user.fullname = fullname
        user.email = email
        user.username = username
        if password:
            user.password = make_password(password)
            user.confirm_password = user.password
        user.save()

        return JsonResponse({'success': True, 'message': 'User updated successfully'})
    except model.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'User not found'}, status=404)
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


import logging
logger = logging.getLogger(__name__)


@require_POST
def delete_user(request, user_type, user_id):
    if not request.session.get('username'):
        return JsonResponse({'success': False, 'error': 'Unauthorized'}, status=401)

    logger.info(f"Delete attempt: user_type={user_type}, user_id={user_id}")
    model_map = {'admin': Admin, 'manager': Manager, 'cashier': Cashier}
    model = model_map.get(user_type.lower())
    if not model:
        return JsonResponse({'success': False, 'error': 'Invalid user type'}, status=400)

    try:
        user = model.objects.get(id=user_id)
        name = user.fullname
        user.delete()
        logger.info(f"User {name} deleted")
        return JsonResponse({'success': True, 'message': f'User {name} deleted successfully'})
    except model.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'User not found'}, status=404)
    except Exception as e:
        logger.exception("Delete user error")
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


@require_POST
def reset_password(request, user_type, user_id):
    if not request.session.get('username'):
        return JsonResponse({'success': False, 'error': 'Unauthorized'}, status=401)

    model_map = {'admin': Admin, 'manager': Manager, 'cashier': Cashier}
    model = model_map.get(user_type.lower())
    if not model:
        return JsonResponse({'success': False, 'error': 'Invalid user type'}, status=400)

    try:
        user = model.objects.get(id=user_id)
        temp_password = ''.join(random.choices(string.ascii_letters + string.digits, k=10))
        user.password = make_password(temp_password)
        user.confirm_password = user.password
        user.save()
        send_password_reset_email(user.email, temp_password, user_type)
        return JsonResponse({'success': True, 'message': f'Temporary password sent to {user.email}'})
    except model.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'User not found'}, status=404)
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


@require_GET
def export_users(request):
    if not request.session.get('username'):
        return redirect('/admin_login')

    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="users_export.csv"'

    writer = csv.writer(response)
    writer.writerow(['Type', 'Full Name', 'Email', 'Username'])

    for admin in Admin.objects.all():
        writer.writerow(['Admin', admin.fullname, admin.email, admin.username])
    for manager in Manager.objects.all():
        writer.writerow(['Manager', manager.fullname, manager.email, manager.username])
    for cashier in Cashier.objects.all():
        writer.writerow(['Cashier', cashier.fullname, cashier.email, cashier.username])

    return response


@require_POST
def bulk_reset_passwords(request):
    if not request.session.get('username'):
        return JsonResponse({'success': False, 'error': 'Unauthorized'}, status=401)

    try:
        data = json.loads(request.body)
        users = data.get('users', [])
        model_map = {'admin': Admin, 'manager': Manager, 'cashier': Cashier}
        results = []

        for u in users:
            model = model_map.get(u['type'].lower())
            if model:
                try:
                    user = model.objects.get(id=u['id'])
                    temp_password = ''.join(random.choices(string.ascii_letters + string.digits, k=10))
                    user.password = make_password(temp_password)
                    user.confirm_password = user.password
                    user.save()
                    send_password_reset_email(user.email, temp_password, u['type'])
                    results.append(f"{user.fullname} (OK)")
                except Exception as e:
                    results.append(f"ID {u['id']} failed: {str(e)}")

        return JsonResponse({'success': True, 'message': f'Processed {len(results)} users.'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)