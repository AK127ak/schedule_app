from flask import Blueprint, render_template, request, redirect, url_for, session
from werkzeug.security import generate_password_hash, check_password_hash
from extensions import db
from models import User

bp = Blueprint("auth", __name__)


@bp.route("/register", methods=["GET", "POST"])
def register_page():
    error = None
    if request.method == "POST":
        username = (request.form.get("username") or "").strip()
        password = request.form.get("password") or ""
        password2 = request.form.get("password2") or ""

        if not username or not password:
            error = "Заполните логин и пароль"
        elif password != password2:
            error = "Пароли не совпадают"
        elif len(password) < 4:
            error = "Пароль слишком короткий (минимум 4 символа)"
        elif User.query.filter_by(username=username).first():
            error = f"Пользователь «{username}» уже существует"
        else:
            user = User(username=username, password_hash=generate_password_hash(password))
            db.session.add(user)
            db.session.commit()
            session["user_id"] = user.id
            session["username"] = user.username
            return redirect(url_for("index"))

    return render_template("register.html", error=error)


@bp.route("/login", methods=["GET", "POST"])
def login_page():
    error = None
    if request.method == "POST":
        username = (request.form.get("username") or "").strip()
        password = request.form.get("password") or ""

        user = User.query.filter_by(username=username).first()
        if user and check_password_hash(user.password_hash, password):
            session["user_id"] = user.id
            session["username"] = user.username
            return redirect(url_for("index"))
        error = "Неверный логин или пароль"

    return render_template("login.html", error=error)


@bp.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("auth.login_page"))
