from extensions import db


class Classroom(db.Model):
    __tablename__ = "classrooms"

    id = db.Column(db.Integer, primary_key=True)
    number = db.Column(db.String(10), nullable=False, unique=True)   # 305
    name = db.Column(db.String(100))                                 # Компьютерный класс
    room_type = db.Column(db.String(50))                             # лаборатория
    seats = db.Column(db.SmallInteger)                               # 25

    lessons = db.relationship("Lesson", backref="classroom")

    def to_dict(self):
        return {
            "id": self.id,
            "number": self.number,
            "name": self.name,
            "room_type": self.room_type,
            "seats": self.seats,
        }
