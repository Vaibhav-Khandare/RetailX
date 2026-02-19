import google.generativeai as genai
from django.conf import settings
import traceback

# Configure Gemini
try:
    genai.configure(api_key=settings.GENAI_API_KEY)
    model = genai.GenerativeModel("gemini-pro")
    print("✅ Gemini configured successfully")
except Exception as e:
    print(f"❌ Gemini configuration error: {e}")
    model = None

def ask_gemini(message):
    """
    Send a message to Gemini and return the response
    """
    if not model:
        return "⚠️ AI model not configured. Please check your API key."
    
    try:
        # Add context for retail/festival sales
        context = "You are a helpful retail assistant for RetailX. "
        context += "Answer questions about retail, sales, inventory, and festivals. "
        context += "Keep responses concise and helpful.\n\n"
        
        full_message = context + "User: " + message
        
        print(f"🔄 Sending to Gemini: {message[:50]}...")
        
        response = model.generate_content(full_message)

        if hasattr(response, "text") and response.text:
            print(f"✅ Gemini response received")
            return response.text.strip()
        
        print("⚠️ Gemini returned empty response")
        return "I couldn't generate a response. Please try again."

    except Exception as e:
        print(f"❌ GEMINI ERROR: {str(e)}")
        print(traceback.format_exc())
        return f"Sorry, I encountered an error: {str(e)[:100]}"