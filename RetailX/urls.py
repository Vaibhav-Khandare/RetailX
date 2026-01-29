"""
URL configuration for RetailX project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from RetailX import views
from . import views_api


urlpatterns = [

    path('admin/', admin.site.urls),
    path('',views.index, name='home'),
    path('index/',views.index),

    path('admin/', admin.site.urls),
    path('', views.index, name='index'),
    # path('index/',views.index),

    path('test/', views.test),
    path('admin_registration/',views.admin_registration),
    path('manager_login/',views.manager_login,name='manager_login'),
    path('manager_registration/',views.manager_registration),
    path('cashier_login/',views.cashier_login),
    path('cashier_registration/',views.cashier_registration),
    path('admin_login/', views.admin_login, name='admin_login'),
    path('admin_home/', views.admin_home, name='admin_home'),
    path('cashier_home/',views.cashier_home,name='cashier_home'),
    path('manager_home/',views.manager_home,name='manager_home'),
    path('logout/', views.logout_view, name='logout'),
    path('api/manager/dashboard/kpi/', views_api.dashboard_kpi, name='dashboard_kpi'),
    path('api/manager/dashboard/revenue-chart/', views_api.dashboard_revenue_chart, name='revenue_chart'),
    path('api/manager/dashboard/category-chart/', views_api.dashboard_category_chart, name='category_chart'),
    path('api/manager/dashboard/activities/', views_api.dashboard_activities, name='dashboard_activities'),
    path('api/manager/dashboard/alerts/', views_api.dashboard_alerts, name='dashboard_alerts'),
    path('api/manager/dashboard/quick-stats/', views_api.dashboard_quick_stats, name='quick_stats'),
    
    # Store Overview APIs
    path('api/manager/overview/performance/', views_api.overview_performance, name='overview_performance'),
    path('api/manager/overview/staff-performance/', views_api.overview_staff_performance, name='staff_performance'),
    path('api/manager/overview/live-sales/', views_api.overview_live_sales, name='live_sales'),
    
    # Inventory APIs
    path('api/manager/inventory/', views_api.inventory_list, name='inventory_list'),
    path('api/manager/inventory/add/', views_api.inventory_add, name='inventory_add'),
    
    # Staff APIs
    path('api/manager/staff/summary/', views_api.staff_summary, name='staff_summary'),
    path('api/manager/staff/list/', views_api.staff_list, name='staff_list'),
    path('api/manager/staff/add/', views_api.staff_add, name='staff_add'),
    path('api/manager/staff/schedule/', views_api.staff_schedule, name='staff_schedule'),
    
    # Reports APIs
    path('api/manager/reports/', views_api.reports_data, name='reports_data'),
    
    # Notifications API
    path('api/manager/notifications/', views_api.notifications_list, name='notifications_list'),
    
    # Logout API
    path('api/manager/logout/', views_api.manager_logout, name='manager_logout'),
   
   
    path('about/', views.about, name='about'),
    path('contact/', views.contact, name='contact'),
    path('base/', views.base, name = 'base'),
    

]


