
# views_api.py
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.utils import timezone
from datetime import datetime, timedelta
import json
# from .models import Manager, Cashier, Product
from AccountsDB.models import Manager, Cashier
from productsDB.models import Product

import random

# Helper function to check if user is manager
def is_manager(request):
    return request.session.get('manager_username') is not None

# Dashboard API Views
@csrf_exempt
def dashboard_kpi(request):
    if not is_manager(request):
        return JsonResponse({'error': 'Unauthorized'}, status=401)
    
    # Calculate KPIs from database
    total_products = Product.objects.count()
    total_revenue = sum([p.price * p.in_stock for p in Product.objects.all()]) * 0.3  # Example calculation
    inventory_value = sum([p.price * p.in_stock for p in Product.objects.all()])
    active_staff = Cashier.objects.count() + Manager.objects.count()
    
    return JsonResponse({
        'total_revenue': round(total_revenue, 2),
        'inventory_value': round(inventory_value, 2),
        'active_staff': active_staff,
        'customer_satisfaction': random.randint(85, 98)  # Example
    })

@csrf_exempt
def dashboard_revenue_chart(request):
    if not is_manager(request):
        return JsonResponse({'error': 'Unauthorized'}, status=401)
    
    period = request.GET.get('period', '7d')
    
    # Generate sample data - in real app, fetch from Sales/Transaction models
    if period == '7d':
        labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        values = [random.randint(1000, 5000) for _ in range(7)]
    elif period == '30d':
        labels = [f'Day {i+1}' for i in range(30)]
        values = [random.randint(800, 6000) for _ in range(30)]
    else:  # 90d
        labels = [f'Week {i+1}' for i in range(13)]
        values = [random.randint(5000, 30000) for _ in range(13)]
    
    return JsonResponse({
        'labels': labels,
        'values': values
    })

@csrf_exempt 
def dashboard_category_chart(request):
    if not is_manager(request):
        return JsonResponse({'error': 'Unauthorized'}, status=401)
    
    # Get categories from products
    categories = {}
    products = Product.objects.all()
    
    for product in products:
        category = product.category or 'Uncategorized'
        if category in categories:
            categories[category] += product.in_stock * product.price
        else:
            categories[category] = product.in_stock * product.price
    
    # If no categories, use sample data
    if not categories:
        categories = {
            'Electronics': 50000,
            'Clothing': 35000,
            'Groceries': 25000,
            'Home & Garden': 15000
        }
    
    return JsonResponse({
        'labels': list(categories.keys()),
        'values': list(categories.values())
    })

@csrf_exempt
def dashboard_activities(request):
    if not is_manager(request):
        return JsonResponse({'error': 'Unauthorized'}, status=401)
    
    # Generate sample activities - in real app, fetch from ActivityLog model
    activities = []
    activity_types = ['sale', 'return', 'inventory', 'staff', 'system']
    times = ['2 min ago', '15 min ago', '1 hour ago', '3 hours ago', 'Yesterday']
    
    for i in range(5):
        activities.append({
            'type': random.choice(activity_types),
            'title': f'Sample Activity {i+1}',
            'time': random.choice(times)
        })
    
    return JsonResponse(activities, safe=False)

@csrf_exempt
def dashboard_alerts(request):
    if not is_manager(request):
        return JsonResponse({'error': 'Unauthorized'}, status=401)
    
    # Check for low stock
    low_stock_products = Product.objects.filter(in_stock__lt=10)
    alerts = []
    
    for product in low_stock_products[:3]:  # Limit to 3 alerts
        alerts.append({
            'type': 'inventory',
            'priority': 'critical' if product.in_stock < 5 else 'warning',
            'message': f'Low stock alert: {product.name} (Stock: {product.in_stock})',
            'time': 'Today'
        })
    
    # Add sample alerts if none
    if not alerts:
        alerts = [
            {
                'type': 'inventory',
                'priority': 'warning',
                'message': 'Electronics category running low',
                'time': '2 hours ago'
            },
            {
                'type': 'sales',
                'priority': 'info',
                'message': 'High sales volume detected',
                'time': 'Today'
            }
        ]
    
    return JsonResponse(alerts, safe=False)

@csrf_exempt
def dashboard_quick_stats(request):
    if not is_manager(request):
        return JsonResponse({'error': 'Unauthorized'}, status=401)
    
    today = timezone.now().date()
    
    # Calculate today's revenue (sample)
    today_revenue = random.randint(500, 5000)
    
    return JsonResponse({
        'today_revenue': today_revenue,
        'online_orders': random.randint(10, 100)
    })

# Store Overview API
@csrf_exempt
def overview_performance(request):
    if not is_manager(request):
        return JsonResponse({'error': 'Unauthorized'}, status=401)
    
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    
    # Calculate metrics - in real app, use date range
    total_products = Product.objects.count()
    
    return JsonResponse({
        'total_orders': random.randint(100, 1000),
        'new_customers': random.randint(10, 100),
        'return_rate': round(random.uniform(1.0, 5.0), 1),
        'avg_order_value': round(random.uniform(25.0, 150.0), 2)
    })

@csrf_exempt
def overview_staff_performance(request):
    if not is_manager(request):
        return JsonResponse({'error': 'Unauthorized'}, status=401)
    
    cashiers = Cashier.objects.all()
    staff_list = []
    
    for cashier in cashiers:
        staff_list.append({
            'id': cashier.username,
            'name': cashier.fullname,
            'role': 'Cashier',
            'sales': round(random.uniform(500, 5000), 2),
            'customers': random.randint(10, 100),
            'rating': round(random.uniform(3.5, 5.0), 1)
        })
    
    # Add managers
    managers = Manager.objects.all()
    for manager in managers:
        staff_list.append({
            'id': manager.username,
            'name': manager.fullname,
            'role': 'Manager',
            'sales': round(random.uniform(1000, 10000), 2),
            'customers': random.randint(50, 200),
            'rating': round(random.uniform(4.0, 5.0), 1)
        })
    
    return JsonResponse(staff_list, safe=False)

@csrf_exempt
def overview_live_sales(request):
    if not is_manager(request):
        return JsonResponse({'error': 'Unauthorized'}, status=401)
    
    # Generate live sales data
    sales = []
    products = Product.objects.all()[:5]  # Get 5 products
    
    for product in products:
        sales.append({
            'product_name': product.name,
            'amount': round(product.price * random.randint(1, 5), 2),
            'time': f'{random.randint(1, 60)} min ago',
            'status': 'completed'
        })
    
    return JsonResponse(sales, safe=False)

# Inventory API
@csrf_exempt
def inventory_list(request):
    if not is_manager(request):
        return JsonResponse({'error': 'Unauthorized'}, status=401)
    
    products = Product.objects.all()
    
    # Apply filters
    search = request.GET.get('search', '')
    category = request.GET.get('category', '')
    stock_level = request.GET.get('stock_level', '')
    
    if search:
        products = products.filter(name__icontains=search)
    
    if category:
        products = products.filter(category=category)
    
    if stock_level == 'low':
        products = products.filter(in_stock__lt=10)
    elif stock_level == 'out':
        products = products.filter(in_stock=0)
    elif stock_level == 'high':
        products = products.filter(in_stock__gt=50)
    
    product_list = []
    for product in products:
        product_list.append({
            'id': product.id,
            'name': product.name,
            'sku': product.sku,
            'category': product.category,
            'price': float(product.price),
            'in_stock': product.in_stock,
            'min_stock_level': product.min_stock_level,
            'description': product.description
        })
    
    # Get low stock alerts
    low_stock_alerts = []
    low_stock_products = Product.objects.filter(in_stock__lt=10)[:5]
    
    for product in low_stock_products:
        low_stock_alerts.append({
            'product_id': product.id,
            'product_name': product.name,
            'sku': product.sku,
            'current_stock': product.in_stock,
            'min_stock': product.min_stock_level
        })
    
    return JsonResponse({
        'products': product_list,
        'low_stock_alerts': low_stock_alerts
    })

@csrf_exempt
def inventory_add(request):
    if not is_manager(request):
        return JsonResponse({'error': 'Unauthorized'}, status=401)
    
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            product = Product.objects.create(
                name=data.get('name'),
                sku=data.get('sku'),
                category=data.get('category'),
                price=data.get('selling_price'),
                in_stock=data.get('stock_quantity'),
                min_stock_level=data.get('reorder_level', 10),
                description=data.get('description', '')
            )
            
            return JsonResponse({
                'success': True,
                'message': 'Product added successfully',
                'product_id': product.id
            })
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)
    
    return JsonResponse({'error': 'Invalid request method'}, status=405)

# Staff API
@csrf_exempt
def staff_summary(request):
    if not is_manager(request):
        return JsonResponse({'error': 'Unauthorized'}, status=401)
    
    total_staff = Cashier.objects.count() + Manager.objects.count()
    
    return JsonResponse({
        'total_active_staff': total_staff,
        'on_duty_today': random.randint(1, total_staff),
        'avg_hours_week': random.randint(20, 40),
        'payroll_due': round(random.uniform(1000, 10000), 2)
    })

@csrf_exempt
def staff_list(request):
    if not is_manager(request):
        return JsonResponse({'error': 'Unauthorized'}, status=401)
    
    staff_data = []
    
    # Add cashiers
    cashiers = Cashier.objects.all()
    for cashier in cashiers:
        staff_data.append({
            'id': cashier.username,
            'name': cashier.fullname,
            'email': cashier.email,
            'phone': 'N/A',  # Add phone field to model if needed
            'role': 'Cashier',
            'shift': random.choice(['Morning', 'Afternoon', 'Evening']),
            'status': 'Active',
            'performance': random.randint(70, 100)
        })
    
    # Add managers
    managers = Manager.objects.all()
    for manager in managers:
        staff_data.append({
            'id': manager.username,
            'name': manager.fullname,
            'email': manager.email,
            'phone': 'N/A',
            'role': 'Manager',
            'shift': 'Full Day',
            'status': 'Active',
            'performance': random.randint(80, 100)
        })
    
    return JsonResponse(staff_data, safe=False)

@csrf_exempt
def staff_add(request):
    if not is_manager(request):
        return JsonResponse({'error': 'Unauthorized'}, status=401)
    
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            # Create new cashier (for now, assuming all new staff are cashiers)
            cashier = Cashier.objects.create(
                fullname=f"{data.get('first_name')} {data.get('last_name')}",
                email=data.get('email'),
                username=data.get('email').split('@')[0],  # Simple username generation
                password='temp123',  # You should hash this
                confirm_password='temp123'
            )
            
            return JsonResponse({
                'success': True,
                'message': 'Staff member added successfully',
                'staff_id': cashier.id
            })
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)
    
    return JsonResponse({'error': 'Invalid request method'}, status=405)

@csrf_exempt
def staff_schedule(request):
    if not is_manager(request):
        return JsonResponse({'error': 'Unauthorized'}, status=401)
    
    # Generate sample schedule
    schedule = {
        'week': 'Week of Sep 1, 2024',
        'days': ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        'staff_schedule': []
    }
    
    cashiers = Cashier.objects.all()[:3]  # Get first 3 cashiers
    shifts = ['9AM-5PM', '1PM-9PM', '5PM-1AM']
    
    for cashier in cashiers:
        day_schedule = []
        for day in schedule['days']:
            day_schedule.append(random.choice(shifts + ['Off']))
        
        schedule['staff_schedule'].append({
            'name': cashier.fullname,
            'schedule': day_schedule
        })
    
    return JsonResponse(schedule)

# Reports API
@csrf_exempt
def reports_data(request):
    if not is_manager(request):
        return JsonResponse({'error': 'Unauthorized'}, status=401)
    
    report_type = request.GET.get('report_type', 'sales')
    period = request.GET.get('period', 'month')
    
    # Generate report based on type and period
    if report_type == 'sales':
        data = {
            'title': 'Sales Report',
            'period': 'This Month',
            'total_sales': round(random.uniform(50000, 150000), 2),
            'avg_order': round(random.uniform(75, 200), 2),
            'top_category': 'Electronics',
            'conversion_rate': round(random.uniform(2.5, 5.5), 1),
            'chart_data': {
                'type': 'bar',
                'labels': ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                'datasets': [{
                    'label': 'Sales',
                    'data': [random.randint(10000, 30000) for _ in range(4)],
                    'backgroundColor': '#4CAF50'
                }]
            },
            'table_data': {
                'headers': ['Date', 'Product', 'Quantity', 'Amount'],
                'rows': [
                    ['2024-09-01', 'Laptop', '5', '$5000'],
                    ['2024-09-02', 'Smartphone', '10', '$8000'],
                    ['2024-09-03', 'Headphones', '20', '$2000']
                ]
            }
        }
    else:
        data = {
            'title': f'{report_type.capitalize()} Report',
            'period': period.capitalize(),
            'total_sales': 0,
            'avg_order': 0,
            'top_category': 'N/A',
            'conversion_rate': 0
        }
    
    return JsonResponse(data)

# Notifications API
@csrf_exempt
def notifications_list(request):
    if not is_manager(request):
        return JsonResponse({'error': 'Unauthorized'}, status=401)
    
    notifications = [
        {
            'type': 'order',
            'title': 'New Order Received',
            'message': 'Order #1234 has been placed',
            'time': '10 min ago',
            'unread': True
        },
        {
            'type': 'inventory',
            'title': 'Low Stock Alert',
            'message': 'Product XYZ is running low',
            'time': '1 hour ago',
            'unread': True
        },
        {
            'type': 'staff',
            'title': 'Staff Update',
            'message': 'John Doe clocked in',
            'time': '2 hours ago',
            'unread': False
        }
    ]
    
    return JsonResponse(notifications, safe=False)

# Logout API
@csrf_exempt
def manager_logout(request):
    if request.method == 'POST':
        request.session.flush()
        return JsonResponse({'success': True})
    
    return JsonResponse({'error': 'Invalid request method'}, status=405)