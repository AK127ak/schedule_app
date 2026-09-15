from flask import Blueprint, jsonify, request
from extensions import db
from models import Subject, Teacher

bp = Blueprint("subjects", __name__, url_prefix="/api/subjects")


@bp.get("")
def list_subjects():
    subjects = Subject.query.order_by(Subject.name).all()
    return jsonify([s.to_dict() for s in subjects])


@bp.post("")
def create_subject():
    data = request.get_json(force=True) or {}
    name = (data.get("name") or "").strip()
    short_name = (data.get("short_name") or "").strip()
    teacher_ids = data.get("teacher_ids", [])

    if not name or not short_name:
        return jsonify({"error": "Поля name и short_name обязательны"}), 400

    if Subject.query.filter_by(name=name).first():
        return jsonify({"error": f"Дисциплина «{name}» уже существует"}), 409

    subject = Subject(name=name, short_name=short_name)

    if teacher_ids:
        subject.teachers = Teacher.query.filter(Teacher.id.in_(teacher_ids)).all()

    db.session.add(subject)
    db.session.commit()
    return jsonify(subject.to_dict()), 201


@bp.put("/<int:subject_id>")
def update_subject(subject_id):
    subject = Subject.query.get_or_404(subject_id)
    data = request.get_json(force=True) or {}

    if "name" in data:
        subject.name = data["name"].strip()
    if "short_name" in data:
        subject.short_name = data["short_name"].strip()
    if "teacher_ids" in data:
        subject.teachers = Teacher.query.filter(Teacher.id.in_(data["teacher_ids"])).all()

    db.session.commit()
    return jsonify(subject.to_dict())


@bp.delete("/<int:subject_id>")
def delete_subject(subject_id):
    subject = Subject.query.get_or_404(subject_id)
    db.session.delete(subject)
    db.session.commit()
    return "", 204
