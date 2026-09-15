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

    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=app.config["DEBUG"], port=5050)
