from flask import Flask, render_template

app = Flask(__name__)


@app.route('/')
def login():
    return render_template('login.html')


@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')


@app.route('/staff/dashboard')
def staff_dashboard():
    return render_template('staff_dashboard.html')


@app.route('/admin/dashboard')
def admin_dashboard():
    return render_template('admin_dashboard.html')


if __name__ == '__main__':
    app.run(debug=True)