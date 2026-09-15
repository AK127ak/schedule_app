from extensions import db

# Дни недели — используются и в валидации, и на фронтенде
DAYS = {
    1: "Понедельник",
    2: "Вторник",
    3: "Среда",
    4: "Четверг",
    5: "Пятница",
    6: "Суббота",
}


class Lesson(db.Model):
    __tablename__ = "lessons"

    id = db.Column(db.Integer, primary_key=True)
    group_id = db.Column(db.Integer, db.ForeignKey("groups.id", ondelete="CASCADE"), nullable=False)
    teacher_id = db.Column(db.Integer, db.ForeignKey("teachers.id", ondelete="CASCADE"), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    classroom_id = db.Column(db.Integer, db.ForeignKey("classrooms.id", ondelete="SET NULL"), nullable=True)

    day = db.Column(db.SmallInteger, nullable=False)             # 1..6
    week1_lesson = db.Column(db.SmallInteger, nullable=True)     # номер пары на 1-й неделе или NULL
    week2_lesson = db.Column(db.SmallInteger, nullable=True)     # номер пары на 2-й неделе или NULL
    lesson_type = db.Column(db.String(30), nullable=False, default="Лекция")
    note = db.Column(db.String(255), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "group_id": self.group_id,
            "group_name": self.group.name if self.group else None,
            "teacher_id": self.teacher_id,
            "teacher_name": self.teacher.name if self.teacher else None,
            "teacher_short_name": self.teacher.short_name if self.teacher else None,
            "teacher_color": self.teacher.color if self.teacher else None,
            "subject_id": self.subject_id,
            "subject_name": self.subject.name if self.subject else None,
            "subject_short_name": self.subject.short_name if self.subject else None,
            "classroom_id": self.classroom_id,
            "classroom_number": self.classroom.number if self.classroom else None,
            "day": self.day,
            "day_name": DAYS.get(self.day),
            "week1_lesson": self.week1_lesson,
            "week2_lesson": self.week2_lesson,
            "lesson_type": self.lesson_type,
            "note": self.note,
        }
