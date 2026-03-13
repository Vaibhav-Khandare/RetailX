"""
URL configuration for RetailX project.
"""
from django.contrib import admin
from django.urls import path
from RetailX import views
from . import views_api

urlpatterns = [

    # Admin
    path('admin/', admin.site.urls),

    path('api/cashiers/', views.get_all_cashiers, name='get_all_cashiers'),
    path('api/cashiers/add/', views.add_cashier, name='add_cashier'),
    path('api/cashiers/<int:cashier_id>/', views.get_cashier_details, name='get_cashier_details'),
    path('api/cashiers/<int:cashier_id>/edit/', views.edit_cashier, name='edit_cashier'),
    path('api/cashiers/<int:cashier_id>/delete/', views.delete_cashier, name='delete_cashier'),

    # Public Pages
    path('', views.index, name='home'),
    path('about/', views.about, name='about'),

    # Authentication
    path('admin_login/', views.admin_login, name='admin_login'),
    path('admin_registration/', views.admin_registration),

    path('manager_login/', views.manager_login, name='manager_login'),
    path('manager_registration/', views.manager_registration),

    path('cashier_login/', views.cashier_login),
    path('cashier_registration/', views.cashier_registration),

    path('logout/', views.logout_view, name='logout'),

    # Dashboards
    path('admin_home/', views.admin_home, name='admin_home'),
    path('manager_home/', views.manager_home, name='manager_home'),
    path('cashier_home/', views.cashier_home, name='cashier_home'),

    # Test
    path('test/', views.test),

    # ================= API ROUTES =================

    # Manager Dashboard APIs
    path('api/manager/dashboard/kpi/', views_api.dashboard_kpi),
    path('api/manager/dashboard/revenue-chart/', views_api.dashboard_revenue_chart),
    path('api/manager/dashboard/category-chart/', views_api.dashboard_category_chart),
    path('api/manager/dashboard/activities/', views_api.dashboard_activities),
    path('api/manager/dashboard/alerts/', views_api.dashboard_alerts),
    path('api/manager/dashboard/quick-stats/', views_api.dashboard_quick_stats),

    # Store Overview APIs
    path('api/manager/overview/performance/', views_api.overview_performance),
    path('api/manager/overview/staff-performance/', views_api.overview_staff_performance),
    path('api/manager/overview/live-sales/', views_api.overview_live_sales),

    # Inventory APIs
    path('api/manager/inventory/', views_api.inventory_list),
    path('api/manager/inventory/add/', views_api.inventory_add),

    # Staff APIs
    path('api/manager/staff/summary/', views_api.staff_summary),
    path('api/manager/staff/list/', views_api.staff_list),
    path('api/manager/staff/add/', views_api.staff_add),
    path('api/manager/staff/schedule/', views_api.staff_schedule),

    # Reports APIs
    path('api/manager/reports/', views_api.reports_data),

    # Notifications API
    path('api/manager/notifications/', views_api.notifications_list),

    # Logout API
    path('api/manager/logout/', views_api.manager_logout),
     
    #help page
    path('help/', views.help, name='help'),
    
    path('privacy-policy/', views.privacy_policy, name='privacy_policy'),
    
    path('terms/', views.terms, name='terms'),
    
    path("chatbot/", views.chatbot_api, name="chatbot_api"),

    path('api/products-for-festival/', views.get_products_for_festival_api),
    path('api/predict/', views.predict_sales_api),
    path('api/inventory/random/', views.get_random_inventory, name='random_inventory'),
    path('logout/', views.logout_view, name='logout'),  # duplicate, but kept as is

    # ================== USER MANAGEMENT ENDPOINTS ==================
    path('delete-user/<str:user_type>/<int:user_id>/', views.delete_user, name='delete_user'),
    path('get-user/<str:user_type>/<int:user_id>/', views.get_user, name='get_user'),
    path('edit-user/<str:user_type>/<int:user_id>/', views.edit_user, name='edit_user'),
    path('reset-password/<str:user_type>/<int:user_id>/', views.reset_password, name='reset_password'),
    path('export-users/', views.export_users, name='export_users'),
    path('bulk-reset-passwords/', views.bulk_reset_passwords, name='bulk_reset_passwords'),
]