from django.http import HttpResponse
from django.shortcuts import render, HttpResponseRedirect

def index(request):
    return render(request,'index.html')

def test(request):
    return render(request,'test.html')