import os
import pandas as pd
import numpy as np
import joblib

# -----------------------------
# Correct paths (project root = parent of app folder)
# -----------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))          # = .../RETAILX/RetailX
DATASET_PATH = os.path.join(BASE_DIR, "festival_sales_CLEAN.csv")
MODEL_FOLDER = os.path.join(BASE_DIR, "trained_models")     # folder name must match exactly


def get_festival_sales(festival_input):
    """
    Returns top 10 and least 10 selling products for a given festival name or date.
    """
    # ========== DEBUGGING LINES ==========
    print("CSV exists?", os.path.exists(DATASET_PATH))
    print("Model folder exists?", os.path.exists(MODEL_FOLDER))
    if os.path.exists(MODEL_FOLDER):
        print("Models found:", os.listdir(MODEL_FOLDER))
    # ======================================
    
    if not os.path.exists(DATASET_PATH):
        return {"top_products": [], "least_products": [], "festival": None, "error": f"CSV file not found at {DATASET_PATH}"}

    # Load dataset
    df = pd.read_csv(DATASET_PATH)
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df = df.dropna(subset=["date", "festival", "product"])
    df["festival_lower"] = df["festival"].str.lower()

    user_input = festival_input.lower().strip()
    festival_name = None
    target_date = None

    # 1️⃣ Try to match festival name (partial match allowed)
    matches = df[df["festival_lower"].str.contains(user_input)]
    if not matches.empty:
        festival_name = matches["festival_lower"].iloc[0]
        target_date = matches[matches["festival_lower"] == festival_name]["date"].max()
    else:
        # 2️⃣ Try to match date
        try:
            target_date = pd.to_datetime(user_input, dayfirst=True)
            festivals_on_date = df[df["date"].dt.date == target_date.date()]["festival_lower"].unique()
            if len(festivals_on_date) > 0:
                festival_name = festivals_on_date[0]
            else:
                # Take first festival in that month if exact date not found
                festivals_in_month = df[df["date"].dt.month == target_date.month]["festival_lower"].unique()
                if len(festivals_in_month) > 0:
                    festival_name = festivals_in_month[0]
        except Exception:
            return {"top_products": [], "least_products": [], "festival": None, "error": "Invalid input. Enter a valid festival name or date."}

    if festival_name is None or target_date is None:
        return {"top_products": [], "least_products": [], "festival": None, "error": "Festival not found in dataset."}

    # Prepare input for model
    future_df = pd.DataFrame({"ds": [target_date]})

    # Standardize festival name to match model filenames
    festival_safe = festival_name.replace(" ", "_").replace("&", "and").lower()

    if not os.path.exists(MODEL_FOLDER):
        return {"top_products": [], "least_products": [], "festival": festival_name.title(), "error": f"Model folder not found at {MODEL_FOLDER}"}

    # List all models for this festival
    models = [f for f in os.listdir(MODEL_FOLDER) if f.lower().startswith(festival_safe)]
    if len(models) == 0:
        return {"top_products": [], "least_products": [], "festival": festival_name.title(), "error": f"No trained models found for festival '{festival_name}'."}

    predictions = []
    for model_file in models:
        product = (
            model_file.replace(".pkl", "")
            .lower()
            .replace(festival_safe + "_", "")
            .replace("_", " ")
        )
        model_path = os.path.join(MODEL_FOLDER, model_file)
        try:
            model = joblib.load(model_path)
            forecast = model.predict(future_df)
            yhat = forecast["yhat"].values[0]
            if np.isnan(yhat):
                yhat = 0
            predictions.append((product.title(), int(round(yhat))))
        except Exception as e:
            print(f"[DEBUG] Error predicting {product}: {e}")
            predictions.append((product.title(), 0))

    # Sort predictions
    predictions_sorted = sorted(predictions, key=lambda x: x[1], reverse=True)

    # Ensure at least 10 items are returned for top and least
    top_products = predictions_sorted[:10]
    least_products = predictions_sorted[-10:] if len(predictions_sorted) > 10 else predictions_sorted[::-1]

    return {
        "festival": festival_name.title(),
        "top_products": top_products,
        "least_products": least_products,
        "error": None
    }