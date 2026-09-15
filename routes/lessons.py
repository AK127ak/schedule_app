from flask import Blueprint, jsonify, request
from extensions import db
from models import Lesson, Group, Teacher, Subject, Classroom

bp = Blueprint("lessons", __name__, url_prefix="/api")


@bp.get("/lessons")
def list_lessons():
    """Отдаёт все занятия плоским списком — фронтенд сам раскладывает по ячейкам таблицы."""
    lessons = Lesson.query.all()
    return jsonify([l.to_dict() for l in lessons])


@bp.get("/lessons/<int:lesson_id>")
def get_lesson(lesson_id):
    lesson = Lesson.query.get_or_404(lesson_id)
    return jsonify(lesson.to_dict())


def _validate_lesson_payload(data):
    """Общая проверка данных занятия. Возвращает (ok, error_message)."""
    required = ["group_id", "teacher_id", "subject_id", "day"]
    for field in required:
        if data.get(field) is None:
            return False, f"Поле {field} обязательно"

    week1 = data.get("week1_lesson")
    week2 = data.get("week2_lesson")
    if week1 is None and week2 is None:
        return False, "Нужно указать хотя бы одну неделю (week1_lesson или week2_lesson)"

    if not Group.query.get(data["group_id"]):
        return False, "Группа не найдена"
    if not Teacher.query.get(data["teacher_id"]):
        return False, "Преподаватель не найден"
    if not Subject.query.get(data["subject_id"]):
        return False, "Дисциплина не найдена"

    classroom_id = data.get("classroom_id")
    if classroom_id and not Classroom.query.get(classroom_id):
        return False, "Кабинет не найден"

    return True, None


def _find_conflicts(data, exclude_lesson_id=None):
    """
    Проверка конфликтов (п.13 ТЗ):
    - преподаватель уже занят в этот день/пару/неделю
    - группа уже занята в этот день/пару/неделю
    - кабинет уже занят в этот день/пару/неделю
    Конфликт считается ТОЛЬКО если совпадает номер пары НА ОДНОЙ И ТОЙ ЖЕ неделе.
    """
    conflicts = []
    day = data["day"]
    week1 = data.get("week1_lesson")
    week2 = data.get("week2_lesson")

    query = Lesson.query.filter(Lesson.day == day)
    if exclude_lesson_id:
        query = query.filter(Lesson.id != exclude_lesson_id)

    candidates = query.all()

    for other in candidates:
        # Проверяем пересечение по каждой неделе отдельно
        for week_num, my_pair in ((1, week1), (2, week2)):
            if my_pair is None:
                continue
            other_pair = other.week1_lesson if week_num == 1 else other.week2_lesson
            if other_pair != my_pair:
                continue

            if other.teacher_id == data["teacher_id"]:
                conflicts.append({
                    "type": "teacher",
                    "message": f"Преподаватель {other.teacher.name} уже занят: "
                               f"{other.group.name}, {week_num} неделя, {my_pair} пара",
                    "lesson_id": other.id,
                })
            if other.group_id == data["group_id"]:
                conflicts.append({
                    "type": "group",
                    "message": f"Группа {other.group.name} уже имеет занятие: "
                               f"{week_num} неделя, {my_pair} пара",
                    "lesson_id": other.id,
                })
            classroom_id = data.get("classroom_id")
            if classroom_id and other.classroom_id == classroom_id:
                conflicts.append({
                    "type": "classroom",
                    "message": f"Кабинет {other.classroom.number} уже занят: "
                               f"{other.group.name}, {week_num} неделя, {my_pair} пара",
                    "lesson_id": other.id,
                })

    return conflicts


@bp.post("/lessons")
def create_lesson():
    data = request.get_json(force=True) or {}

    ok, error = _validate_lesson_payload(data)
    if not ok:
        return jsonify({"error": error}), 400

    conflicts = _find_conflicts(data)
    # Если пришёл флаг force=true — сохраняем несмотря на конфликты (пользователь подтвердил)
    if conflicts and not data.get("force"):
        return jsonify({"error": "Обнаружен конфликт расписания", "conflicts": conflicts}), 409

    lesson = Lesson(
        group_id=data["group_id"],
        teacher_id=data["teacher_id"],
        subject_id=data["subject_id"],
        classroom_id=data.get("classroom_id"),
        day=data["day"],
        week1_lesson=data.get("week1_lesson"),
        week2_lesson=data.get("week2_lesson"),
        lesson_type=data.get("lesson_type", "Лекция"),
        note=data.get("note"),
    )
    db.session.add(lesson)
    db.session.commit()
    return jsonify(lesson.to_dict()), 201


@bp.put("/lessons/<int:lesson_id>")
def update_lesson(lesson_id):
    lesson = Lesson.query.get_or_404(lesson_id)
    data = request.get_json(force=True) or {}

    # Собираем полную картину занятия (старые значения + новые) для проверки конфликтов
    merged = {
        "group_id": data.get("group_id", lesson.group_id),
        "teacher_id": data.get("teacher_id", lesson.teacher_id),
        "subject_id": data.get("subject_id", lesson.subject_id),
        "classroom_id": data.get("classroom_id", lesson.classroom_id),
        "day": data.get("day", lesson.day),
        "week1_lesson": data.get("week1_lesson", lesson.week1_lesson),
        "week2_lesson": data.get("week2_lesson", lesson.week2_lesson),
    }

    ok, error = _validate_lesson_payload(merged)
    if not ok:
        return jsonify({"error": error}), 400

    conflicts = _find_conflicts(merged, exclude_lesson_id=lesson.id)
    if conflicts and not data.get("force"):
        return jsonify({"error": "Обнаружен конфликт расписания", "conflicts": conflicts}), 409

    lesson.group_id = merged["group_id"]
    lesson.teacher_id = merged["teacher_id"]
    lesson.subject_id = merged["subject_id"]
    lesson.classroom_id = merged["classroom_id"]
    lesson.day = merged["day"]
    lesson.week1_lesson = merged["week1_lesson"]
    lesson.week2_lesson = merged["week2_lesson"]
    if "lesson_type" in data:
        lesson.lesson_type = data["lesson_type"]
    if "note" in data:
        lesson.note = data["note"]

    db.session.commit()
    return jsonify(lesson.to_dict())


@bp.delete("/lessons/<int:lesson_id>")
def delete_lesson(lesson_id):
    lesson = Lesson.query.get_or_404(lesson_id)
    db.session.delete(lesson)
    db.session.commit()
    return "", 204


@bp.put("/lessons/<int:lesson_id>/move")
def move_lesson(lesson_id):
    """
    Отдельный эндпоинт под Drag & Drop: меняет только группу/день/пару,
    не трогая преподавателя и дисциплину — так короче запрос с фронтенда.
    """
    lesson = Lesson.query.get_or_404(lesson_id)
    data = request.get_json(force=True) or {}

    merged = {
        "group_id": data.get("group_id", lesson.group_id),
        "teacher_id": lesson.teacher_id,
        "subject_id": lesson.subject_id,
        "classroom_id": lesson.classroom_id,
        "day": data.get("day", lesson.day),
        "week1_lesson": data.get("week1_lesson", lesson.week1_lesson),
        "week2_lesson": data.get("week2_lesson", lesson.week2_lesson),
    }

    conflicts = _find_conflicts(merged, exclude_lesson_id=lesson.id)
    if conflicts and not data.get("force"):
        return jsonify({"error": "Обнаружен конфликт расписания", "conflicts": conflicts}), 409

    lesson.group_id = merged["group_id"]
    lesson.day = merged["day"]
    lesson.week1_lesson = merged["week1_lesson"]
    lesson.week2_lesson = merged["week2_lesson"]

    db.session.commit()
    return jsonify(lesson.to_dict())
