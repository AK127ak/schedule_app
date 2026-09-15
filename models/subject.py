from extensions import db
from models.teacher import teacher_subjects


class Subject(db.Model):
    __tablename__ = "subjects"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False, unique=True)   # Информатика
    short_name = db.Column(db.String(15), nullable=False)           # ИНФ

    teachers = db.relationship(
        "Teacher", secondary=teacher_subjects, back_populates="subjects"
    )
    lessons = db.relationship("Lesson", backref="subject", cascade="all, delete-orphan")

    def to_dict(self, with_teachers=True):
        data = {
            "id": self.id,
            "name": self.name,
            "short_name": self.short_name,
        }
        if with_teachers:
            data["teachers"] = [t.to_dict(with_subjects=False) for t in self.teachers]
        return data
