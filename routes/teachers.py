from flask import Blueprint, jsonify, request
from extensions import db
from models import Teacher, Subject

bp = Blueprint("teachers", __name__, url_prefix="/api/teachers")


@bp.get("")
def list_teachers():
    teachers = Teacher.query.order_by(Teacher.name).all()
    return jsonify([t.to_dict() for t in teachers])


@bp.get("/<int:teacher_id>")
def get_teacher(teacher_id):
    teacher = Teacher.query.get_or_404(teacher_id)
    return jsonify(teacher.to_dict())


@bp.post("")
def create_teacher():
    data = request.get_json(force=True) or {}
    name = (data.get("name") or "").strip()
    short_name = (data.get("short_name") or "").strip()
    color = (data.get("color") or "#3B82F6").strip()
    subject_ids = data.get("subject_ids", [])

    if not name or not short_name:
        return jsonify({"error": "Поля name и short_name обязательны"}), 400

    teacher = Teacher(name=name, short_name=short_name, color=color)

    if subject_ids:
        subjects = Subject.query.filter(Subject.id.in_(subject_ids)).all()
        teacher.subjects = subjects

    db.session.add(teacher)
    db.session.commit()
    return jsonify(teacher.to_dict()), 201


@bp.put("/<int:teacher_id>")
def update_teacher(teacher_id):
    teacher = Teacher.query.get_or_404(teacher_id)
    data = request.get_json(force=True) or {}

    if "name" in data:
        teacher.name = data["name"].strip()
    if "short_name" in data:
        teacher.short_name = data["short_name"].strip()
    if "color" in data:
        teacher.color = data["color"].strip()
    # Полная замена списка дисциплин преподавателя (если ключ передан)
    if "subject_ids" in data:
        subjects = Subject.query.filter(Subject.id.in_(data["subject_ids"])).all()
        teacher.subjects = subjects

    db.session.commit()
    return jsonify(teacher.to_dict())


@bp.delete("/<int:teacher_id>")
def delete_teacher(teacher_id):
    teacher = Teacher.query.get_or_404(teacher_id)
    db.session.delete(teacher)
    db.session.commit()
    return "", 204
