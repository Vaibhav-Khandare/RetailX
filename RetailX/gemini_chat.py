import google.generativeai as genai
from django.conf import settings
import traceback

# ------------------------------------------------------------
# Load API key directly from Django settings
# ------------------------------------------------------------
API_KEY = getattr(settings, 'GENAI_API_KEY', None)

# List of models to try, in order of preference (newest first)
MODEL_NAMES = [
    "gemini-2.5-flash",          # Fast, latest generation
    "gemini-2.5-pro",            # More capable, latest generation
    "gemini-2.0-flash",          # Widely available, good performance
    "gemini-2.0-flash-lite",     # Lighter version
    "gemini-pro-latest",         # Alias for latest stable Pro
    "gemini-1.5-flash",          # Older but still supported
    "gemini-1.5-pro",            # Older Pro
    "gemini-1.0-pro",            # Last resort
]

model = None

# ------------------------------------------------------------
# Try to configure a working model
# ------------------------------------------------------------
if API_KEY:
    try:
        genai.configure(api_key=API_KEY)
        for model_name in MODEL_NAMES:
            try:
                candidate = genai.GenerativeModel(model_name)
                # Quick test to ensure the model is usable
                test_response = candidate.generate_content("Test")
                if test_response and hasattr(test_response, 'text'):
                    model = candidate
                    print(f"✅ Gemini configured with model: {model_name}")
                    break
            except Exception as e:
                print(f"⚠️ Model {model_name} failed: {e}")
                continue
        else:
            print("❌ No working Gemini model found.")
            model = None
    except Exception as e:
        print(f"❌ Gemini configuration error: {e}")
        model = None
else:
    print("⚠️ GENAI_API_KEY not set in settings. Chatbot will not work.")

def ask_gemini(message):
    """
    Send a message to Gemini and return the response.
    """
    if not model:
        return (
            "⚠️ AI model not configured.\n"
            "Please add GENAI_API_KEY to your Django settings.py file.\n"
            "Contact your project admin for the key."
        )

    try:
        # Add context for retail/festival sales
        context = (
            "You are a helpful retail assistant for RetailX. "
            "Answer questions about retail, sales, inventory, and festivals. "
            "Keep responses concise and helpful.\n\n"
        )
        full_message = context + "User: " + message

        print(f"🔄 Sending to Gemini: {message[:50]}...")
        response = model.generate_content(full_message)

        if hasattr(response, "text") and response.text:
            print("✅ Gemini response received")
            return response.text.strip()

        print("⚠️ Gemini returned empty response")
        return "I couldn't generate a response. Please try again."

    except Exception as e:
        print(f"❌ GEMINI ERROR: {str(e)}")
        print(traceback.format_exc())
        return f"Sorry, I encountered an error: {str(e)[:100]}"