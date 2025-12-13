from django.http import HttpResponse
from django.shortcuts import render, HttpResponseRedirect, redirect
from AccountsDB.models import Admin, Cashier, Manager
from django.contrib.auth.hashers import make_password, check_password
from django.shortcuts import render, redirect
from django.contrib.auth.hashers import check_password
from django.views.decorators.csrf import csrf_exempt



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
    else:
        print("------------------->  Login Successfull !! <-------------------")
    # print("Admin Logged-in uname:",request.session.get('username'))       # bro here i try to fetch admin username
   
    admin_detail={
            'uname':request.session.get('username'),
            'email':request.session.get('email')
        }
    
    if(request.method=='POST' and request.POST['formType']=='userModal'):                      #formType use kia gya hai as a hidden data which will show that the POST method came from which 'Form' 🐦‍⬛       

        print("--------> New User Details: ")                #bro this print statements are not mcompulsory we can comment it later 
        print('Role:    ',request.POST['userRole'])
        print('Full Name:   ',request.POST['fullName'])
        print('Emmail:  ',request.POST['userEmail'])
        print('User Name:   ',request.POST['userName'])
        print('Pass:',request.POST['userPassword'])
        print('CFM Pass:',request.POST['confirmUserPassword'])

        if request.POST['userRole']=='admin':
            fullname = request.POST['fullName']
            email = request.POST['userEmail']
            username = request.POST.get('userName','').lower()
            password = request.POST['userPassword']
            confirm_password = request.POST['confirmUserPassword']

            if(password==confirm_password):
                hashed_password = make_password(confirm_password)
                UDO = Admin(fullname=fullname, email=email, username=username, password=hashed_password, confirm_password=hashed_password)
                UDO.save()
            else:
                print("Plss Enter correct Password !")
                print("Try Again !!!")
        elif request.POST['userRole']=='manager':
            fullname = request.POST['fullName']
            email = request.POST['userEmail']
            username = request.POST.get('userName', '').lower()
            password = request.POST['userPassword']
            confirm_password = request.POST['confirmUserPassword']

            if(password==confirm_password):
                hashed_password = make_password(confirm_password)
                UDO = Manager(fullname=fullname, email=email, username=username, password=hashed_password, confirm_password=hashed_password)
                UDO.save()
            else:
                print("Plss Enter correct Password !")
                print("Try Again !!!")
        else:
            fullname = request.POST['fullName']
            email = request.POST['userEmail']
            username = request.POST.get('userName', '').lower()
            password = request.POST['userPassword']
            confirm_password = request.POST['confirmUserPassword']

            if(password==confirm_password):
                hashed_password = make_password(confirm_password)
                UDO = Cashier(fullname=fullname, email=email, username=username, password=hashed_password, confirm_password=hashed_password)
                UDO.save()
            else:
                print("Plss Enter correct Password !")
                print("Try Again !!!")
    return render(request, 'admin_home.html',admin_detail)

def cashier_home(request):
    # Check if cashier is logged in
    if not request.session.get('cashier_username'):
        return redirect('/cashier_login')   # redirect to cashier login
    
    return render(request, 'cashier_home.html')

def manager_home(request):
    # Only allow access if manager is logged in
    if not request.session.get('manager_username'):
        return redirect('/manager_login')  # redirect to login page
    
    return render(request, 'manager_home.html')

def logout_view(request):
    request.session.flush()  # clears all session data
    return redirect('manager_login')  # or 'manager_login', 'cashier_login', etc.

