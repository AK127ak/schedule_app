from flask import Flask, render_template

from config import Config
from extensions import db


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)

    # Регистрируем модели, чтобы SQLAlchemy знал о всех таблицах
    from models import Group, Teacher, Subject, Classroom, Lesson  # noqa: F401

    # Регистрируем REST API
    from routes.groups import bp as groups_bp
    from routes.teachers import bp as teachers_bp
    from routes.subjects import bp as subjects_bp
    from routes.classrooms import bp as classrooms_bp
    from routes.lessons import bp as lessons_bp
    app.register_blueprint(groups_bp)
    app.register_blueprint(teachers_bp)
    app.register_blueprint(subjects_bp)
    app.register_blueprint(classrooms_bp)
    app.register_blueprint(lessons_bp)

    @app.route("/")
    def index():
        return render_template("index.html")

    @app.route("/print/<int:group_id>")
    def print_group(group_id):
        return render_template("print.html", group_id=group_id)

    @app.route("/groups")
    def groups_page():
        return render_template("groups.html", page_title="Группы")

    @app.route("/teachers")
    def teachers_page():
        return render_template("teachers.html", page_title="Преподаватели")

    @app.route("/subjects")
    def subjects_page():
        return render_template("subjects.html", page_title="Дисциплины")

    @app.route("/classrooms")
    def classrooms_page():
        return render_template("classrooms.html", page_title="Кабинеты")

    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=app.config["DEBUG"], port=5050)
