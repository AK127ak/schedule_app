from extensions import db

# Промежуточная таблица teacher_subjects (many-to-many, п.6 ТЗ)
teacher_subjects = db.Table(
    "teacher_subjects",
    db.Column("teacher_id", db.Integer, db.ForeignKey("teachers.id", ondelete="CASCADE"), primary_key=True),
    db.Column("subject_id", db.Integer, db.ForeignKey("subjects.id", ondelete="CASCADE"), primary_key=True),
)


class Teacher(db.Model):
    __tablename__ = "teachers"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)          # Иванов Сергей Владимирович
    short_name = db.Column(db.String(10), nullable=False)     # ИВ
    color = db.Column(db.String(7), nullable=False, default="#3B82F6")  # HEX-цвет карточки

    subjects = db.relationship(
        "Subject", secondary=teacher_subjects, back_populates="teachers"
    )
    lessons = db.relationship("Lesson", backref="teacher", cascade="all, delete-orphan")

    def to_dict(self, with_subjects=True):
        data = {
            "id": self.id,
            "name": self.name,
            "short_name": self.short_name,
            "color": self.color,
        }
        if with_subjects:
            data["subjects"] = [s.to_dict(with_teachers=False) for s in self.subjects]
        return data
