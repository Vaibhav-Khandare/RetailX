import google.generativeai as genai

genai.configure(api_key='AIzaSyCwLDoPKEUXWsmZ4PF-_Zac1XBMvE92i-w')  # Replace with your actual key

for model in genai.list_models():
    print(model.name)