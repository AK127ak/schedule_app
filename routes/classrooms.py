from flask import Blueprint, jsonify, request
from extensions import db
from models import Classroom

bp = Blueprint("classrooms", __name__, url_prefix="/api/classrooms")


@bp.get("")
def list_classrooms():
    classrooms = Classroom.query.order_by(Classroom.number).all()
    return jsonify([c.to_dict() for c in classrooms])


@bp.post("")
def create_classroom():
    data = request.get_json(force=True) or {}
    number = (data.get("number") or "").strip()

    if not number:
        return jsonify({"error": "Поле number обязательно"}), 400

    if Classroom.query.filter_by(number=number).first():
        return jsonify({"error": f"Кабинет {number} уже существует"}), 409

    classroom = Classroom(
        number=number,
        name=(data.get("name") or "").strip() or None,
        room_type=(data.get("room_type") or "").strip() or None,
        seats=data.get("seats"),
    )
    db.session.add(classroom)
    db.session.commit()
    return jsonify(classroom.to_dict()), 201


@bp.put("/<int:classroom_id>")
def update_classroom(classroom_id):
    classroom = Classroom.query.get_or_404(classroom_id)
    data = request.get_json(force=True) or {}

    if "number" in data:
        classroom.number = data["number"].strip()
    if "name" in data:
        classroom.name = data["name"].strip()
    if "room_type" in data:
        classroom.room_type = data["room_type"].strip()
    if "seats" in data:
        classroom.seats = data["seats"]

    db.session.commit()
    return jsonify(classroom.to_dict())


@bp.delete("/<int:classroom_id>")
def delete_classroom(classroom_id):
    classroom = Classroom.query.get_or_404(classroom_id)
    db.session.delete(classroom)
    db.session.commit()
    return "", 204
