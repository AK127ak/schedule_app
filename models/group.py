from extensions import db


class Group(db.Model):
    __tablename__ = "groups"  # зарезервированное слово в MySQL, но SQLAlchemy сам его экранирует

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(20), nullable=False, unique=True)       # П-21
    speciality = db.Column(db.String(100), nullable=False)             # Программирование
    course = db.Column(db.SmallInteger, nullable=False)                # 2

    lessons = db.relationship("Lesson", backref="group", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "speciality": self.speciality,
            "course": self.course,
        }
