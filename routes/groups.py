from flask import Blueprint, jsonify, request
from extensions import db
from models import Group

bp = Blueprint("groups", __name__, url_prefix="/api/groups")


@bp.get("")
def list_groups():
    groups = Group.query.order_by(Group.name).all()
    return jsonify([g.to_dict() for g in groups])


@bp.post("")
def create_group():
    data = request.get_json(force=True) or {}
    name = (data.get("name") or "").strip()
    speciality = (data.get("speciality") or "").strip()
    course = data.get("course")

    if not name or not speciality or not course:
        return jsonify({"error": "Поля name, speciality и course обязательны"}), 400

    if Group.query.filter_by(name=name).first():
        return jsonify({"error": f"Группа {name} уже существует"}), 409

    group = Group(name=name, speciality=speciality, course=course)
    db.session.add(group)
    db.session.commit()
    return jsonify(group.to_dict()), 201


@bp.put("/<int:group_id>")
def update_group(group_id):
    group = Group.query.get_or_404(group_id)
    data = request.get_json(force=True) or {}

    if "name" in data:
        group.name = data["name"].strip()
    if "speciality" in data:
        group.speciality = data["speciality"].strip()
    if "course" in data:
        group.course = data["course"]

    db.session.commit()
    return jsonify(group.to_dict())


@bp.delete("/<int:group_id>")
def delete_group(group_id):
    group = Group.query.get_or_404(group_id)
    db.session.delete(group)
    db.session.commit()
    return "", 204
