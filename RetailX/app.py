from flask import Flask, render_template, request

app = Flask(__name__)

# --------------------
# Landing Page (Home)
# --------------------
@app.route("/")
def index():
    return render_template("index.html")

# --------------------
# Admin Login
# --------------------
@app.route("/admin_login", methods=["GET", "POST"])
def admin_login():
    return render_template("admin_login.html")

# --------------------
# Manager Login
# --------------------
@app.route("/manager_login", methods=["GET", "POST"])
def manager_login():
    return render_template("manager_login.html")

# --------------------
# Cashier Login
# --------------------
@app.route("/cashier_login", methods=["GET", "POST"])
def cashier_login():
    return render_template("cashier_login.html")

if __name__ == "__main__":
    app.run(debug=True)
