// ---------- Константы ----------
const DAYS = [
    { id: 1, name: "Понедельник" },
    { id: 2, name: "Вторник" },
    { id: 3, name: "Среда" },
    { id: 4, name: "Четверг" },
    { id: 5, name: "Пятница" },
    { id: 6, name: "Суббота" },
];
const PAIRS = [1, 2, 3, 4, 5, 6]; // номера пар в расписании

// ---------- Состояние приложения ----------
const state = {
    currentWeek: 1,
    groups: [],
    teachers: [],
    subjects: [],
    classrooms: [],
    lessons: [],
};

// ---------- Загрузка данных ----------
async function loadAll() {
    const [groups, teachers, subjects, classrooms, lessons] = await Promise.all([
        api.get("/api/groups"),
        api.get("/api/teachers"),
        api.get("/api/subjects"),
        api.get("/api/classrooms"),
        api.get("/api/lessons"),
    ]);
    state.groups = groups;
    state.teachers = teachers;
    state.subjects = subjects;
    state.classrooms = classrooms;
    state.lessons = lessons;

    renderTable();
    renderTeachersPanel();
}

// ---------- Отрисовка таблицы расписания ----------
function findLesson(groupId, day, pair) {
    const field = state.currentWeek === 1 ? "week1_lesson" : "week2_lesson";
    return state.lessons.find(
        (l) => l.group_id === groupId && l.day === day && l[field] === pair
    );
}

function renderLessonCard(lesson) {
    const div = document.createElement("div");
    div.className = "lesson-card";
    div.style.background = lesson.teacher_color || "#3B82F6";
    div.draggable = true;
    div.dataset.lessonId = lesson.id;

    const w1 = lesson.week1_lesson ?? "—";
    const w2 = lesson.week2_lesson ?? "—";

    div.innerHTML = `
        <div class="teacher-line">${lesson.teacher_short_name} · ${lesson.teacher_name}</div>
        <div class="subject-line">${lesson.subject_name}</div>
        <div class="weeks-line">1 нед: ${w1} пара &nbsp; 2 нед: ${w2} пара</div>
        <div class="room-line">${lesson.classroom_number ? "Каб. " + lesson.classroom_number : ""} ${lesson.lesson_type || ""}</div>
    `;

    div.addEventListener("click", (e) => {
        e.stopPropagation();
        openEditModal(lesson);
    });

    div.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", JSON.stringify({ type: "move", lessonId: lesson.id }));
        e.dataTransfer.effectAllowed = "move";
    });

    return div;
}

function renderTable() {
    const container = document.getElementById("scheduleTable");
    if (state.groups.length === 0) {
        container.innerHTML = '<p class="loading">Сначала добавьте хотя бы одну группу.</p>';
        return;
    }

    const table = document.createElement("table");
    table.className = "grid";

    // Заголовок: пусто, пусто, группы...
    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    headRow.innerHTML = `<th>День</th><th>Пара</th>` +
        state.groups.map((g) =>
            `<th>${g.name} <a href="/print/${g.id}" target="_blank" title="Печать расписания группы" class="print-link">🖨</a></th>`
        ).join("");
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    DAYS.forEach((day) => {
        PAIRS.forEach((pair, pairIndex) => {
            const tr = document.createElement("tr");

            if (pairIndex === 0) {
                const dayTd = document.createElement("td");
                dayTd.className = "day-cell";
                dayTd.rowSpan = PAIRS.length;
                dayTd.textContent = day.name;
                tr.appendChild(dayTd);
            }

            const pairTd = document.createElement("td");
            pairTd.className = "pair-cell";
            pairTd.textContent = pair;
            tr.appendChild(pairTd);

            state.groups.forEach((group) => {
                const td = document.createElement("td");
                td.className = "slot";
                td.dataset.groupId = group.id;
                td.dataset.day = day.id;
                td.dataset.pair = pair;

                const inner = document.createElement("div");
                inner.className = "slot-inner";

                const lesson = findLesson(group.id, day.id, pair);
                if (lesson) {
                    inner.appendChild(renderLessonCard(lesson));
                } else {
                    const btn = document.createElement("button");
                    btn.className = "add-slot-btn";
                    btn.type = "button";
                    btn.textContent = "+";
                    btn.addEventListener("click", () => openCreateModal(group.id, day.id, pair));
                    inner.appendChild(btn);
                }
                td.appendChild(inner);

                td.addEventListener("dragover", (e) => {
                    e.preventDefault();
                    td.classList.add("drag-over");
                });
                td.addEventListener("dragleave", () => {
                    td.classList.remove("drag-over");
                });
                td.addEventListener("drop", (e) => {
                    e.preventDefault();
                    td.classList.remove("drag-over");
                    handleDrop(e, group.id, day.id, pair);
                });

                tr.appendChild(td);
            });

            tbody.appendChild(tr);
        });
    });

    table.appendChild(tbody);
    container.innerHTML = "";
    container.appendChild(table);
}

// ---------- Панель преподавателей ----------
function renderTeachersPanel() {
    const container = document.getElementById("teachersList");
    if (state.teachers.length === 0) {
        container.innerHTML = '<p class="loading">Преподавателей пока нет.</p>';
        return;
    }

    container.innerHTML = "";
    state.teachers.forEach((teacher) => {
        const block = document.createElement("div");
        block.className = "teacher-block";

        const header = document.createElement("div");
        header.className = "teacher-header";
        header.innerHTML = `
            <span class="teacher-color-dot" style="background:${teacher.color}"></span>
            <span>${teacher.short_name} · ${teacher.name}</span>
        `;
        header.addEventListener("click", () => block.classList.toggle("expanded"));

        const subjectsDiv = document.createElement("div");
        subjectsDiv.className = "teacher-subjects";
        if (teacher.subjects.length === 0) {
            subjectsDiv.innerHTML = '<span style="color:#94a3b8;font-size:12px;">Нет дисциплин</span>';
        } else {
            teacher.subjects.forEach((s) => {
                const chip = document.createElement("div");
                chip.className = "subject-chip";
                chip.textContent = s.name;
                chip.draggable = true;
                chip.title = "Перетащи на нужную ячейку расписания";
                chip.addEventListener("dragstart", (e) => {
                    e.dataTransfer.setData("text/plain", JSON.stringify({
                        type: "new",
                        teacherId: teacher.id,
                        subjectId: s.id,
                    }));
                    e.dataTransfer.effectAllowed = "copy";
                });
                subjectsDiv.appendChild(chip);
            });
        }

        block.appendChild(header);
        block.appendChild(subjectsDiv);
        container.appendChild(block);
    });
}

// ---------- Обработка Drag & Drop ----------
function handleDrop(e, targetGroupId, targetDay, targetPair) {
    let payload;
    try {
        payload = JSON.parse(e.dataTransfer.getData("text/plain"));
    } catch {
        return;
    }

    if (payload.type === "new") {
        // Перетащили дисциплину преподавателя из панели — открываем форму
        // с уже выбранными преподавателем и дисциплиной, чтобы указать кабинет и тип.
        openCreateModal(targetGroupId, targetDay, targetPair, {
            teacherId: payload.teacherId,
            subjectId: payload.subjectId,
        });
    } else if (payload.type === "move") {
        moveLesson(payload.lessonId, targetGroupId, targetDay, targetPair, false);
    }
}

async function moveLesson(lessonId, groupId, day, pair, force) {
    const lesson = state.lessons.find((l) => l.id === lessonId);
    if (!lesson) return;

    // Меняем позицию только для активной недели, вторую неделю не трогаем
    const payload = {
        group_id: groupId,
        day: day,
        week1_lesson: state.currentWeek === 1 ? pair : lesson.week1_lesson,
        week2_lesson: state.currentWeek === 2 ? pair : lesson.week2_lesson,
    };
    if (force) payload.force = true;

    const result = await api.put(`/api/lessons/${lessonId}/move`, payload);

    if (result.ok) {
        await loadAll();
        return;
    }

    if (result.status === 409 && result.data.conflicts) {
        const messages = result.data.conflicts.map((c) => c.message).join("\n");
        if (confirm(`⚠ Обнаружен конфликт:\n${messages}\n\nВсё равно переместить?`)) {
            await moveLesson(lessonId, groupId, day, pair, true);
        }
    } else {
        alert(result.data?.error || "Не удалось переместить занятие");
    }
}


const modal = document.getElementById("lessonModal");
const form = document.getElementById("lessonForm");
const conflictBox = document.getElementById("conflictWarning");

function populateSelects() {
    const groupSel = document.getElementById("fieldGroup");
    groupSel.innerHTML = state.groups.map((g) => `<option value="${g.id}">${g.name}</option>`).join("");

    const daySel = document.getElementById("fieldDay");
    daySel.innerHTML = DAYS.map((d) => `<option value="${d.id}">${d.name}</option>`).join("");

    const teacherSel = document.getElementById("fieldTeacher");
    teacherSel.innerHTML = state.teachers.map((t) => `<option value="${t.id}">${t.short_name} — ${t.name}</option>`).join("");

    const classroomSel = document.getElementById("fieldClassroom");
    classroomSel.innerHTML = '<option value="">—</option>' +
        state.classrooms.map((c) => `<option value="${c.id}">${c.number} (${c.name || ""})</option>`).join("");

    const pairOptions = '<option value="">—</option>' + PAIRS.map((p) => `<option value="${p}">${p}</option>`).join("");
    document.getElementById("fieldWeek1").innerHTML = pairOptions;
    document.getElementById("fieldWeek2").innerHTML = pairOptions;

    updateSubjectOptionsForTeacher();
}

function updateSubjectOptionsForTeacher() {
    const teacherId = Number(document.getElementById("fieldTeacher").value);
    const teacher = state.teachers.find((t) => t.id === teacherId);
    const subjectSel = document.getElementById("fieldSubject");
    const subjects = teacher ? teacher.subjects : [];
    subjectSel.innerHTML = subjects.map((s) => `<option value="${s.id}">${s.name}</option>`).join("");
}

document.getElementById("fieldTeacher").addEventListener("change", updateSubjectOptionsForTeacher);

function dayName(dayId) {
    const d = DAYS.find((x) => x.id === dayId);
    return d ? d.name : "";
}

function openCreateModal(groupId, day, pair, prefill) {
    populateSelects();
    document.getElementById("modalTitle").textContent = "Добавление занятия";
    document.getElementById("lessonId").value = "";
    document.getElementById("fieldGroup").value = groupId;
    document.getElementById("fieldDay").value = day;

    if (prefill && prefill.teacherId) {
        document.getElementById("fieldTeacher").value = prefill.teacherId;
        updateSubjectOptionsForTeacher();
        if (prefill.subjectId) {
            document.getElementById("fieldSubject").value = prefill.subjectId;
        }
    }

    const group = state.groups.find((g) => g.id === groupId);

    // Группа, день и пара уже определены кликом по ячейке — прячем эти поля
    // и показываем их текстом, чтобы не заставлять выбирать повторно.
    document.getElementById("labelGroup").classList.add("hidden");
    document.getElementById("labelDay").classList.add("hidden");

    if (state.currentWeek === 1) {
        document.getElementById("fieldWeek1").value = pair;
        document.getElementById("fieldWeek2").value = "";
        document.getElementById("labelWeek1").classList.add("hidden");
        document.getElementById("labelWeek2").classList.remove("hidden");
    } else {
        document.getElementById("fieldWeek2").value = pair;
        document.getElementById("fieldWeek1").value = "";
        document.getElementById("labelWeek2").classList.add("hidden");
        document.getElementById("labelWeek1").classList.remove("hidden");
    }

    document.getElementById("modalContext").innerHTML =
        `<strong>${group ? group.name : ""}</strong> · ${dayName(day)}, ${state.currentWeek} неделя, ${pair} пара` +
        `<br><span style="font-size:11px;">Если занятие идёт и на второй неделе — укажи её пару ниже.</span>`;
    document.getElementById("modalContext").classList.remove("hidden");

    document.getElementById("deleteLessonBtn").classList.add("hidden");
    conflictBox.classList.add("hidden");
    modal.classList.remove("hidden");
}

function openEditModal(lesson) {
    populateSelects();
    document.getElementById("modalTitle").textContent = "Редактирование занятия";
    document.getElementById("lessonId").value = lesson.id;
    document.getElementById("fieldDay").value = lesson.day;
    document.getElementById("fieldGroup").value = lesson.group_id;
    document.getElementById("fieldTeacher").value = lesson.teacher_id;
    updateSubjectOptionsForTeacher();
    document.getElementById("fieldSubject").value = lesson.subject_id;
    document.getElementById("fieldWeek1").value = lesson.week1_lesson ?? "";
    document.getElementById("fieldWeek2").value = lesson.week2_lesson ?? "";
    document.getElementById("fieldClassroom").value = lesson.classroom_id ?? "";
    document.getElementById("fieldType").value = lesson.lesson_type || "Лекция";

    // При редактировании показываем все поля — можно поменять группу, день и обе недели (п.12 ТЗ)
    document.getElementById("labelGroup").classList.remove("hidden");
    document.getElementById("labelDay").classList.remove("hidden");
    document.getElementById("labelWeek1").classList.remove("hidden");
    document.getElementById("labelWeek2").classList.remove("hidden");
    document.getElementById("modalContext").classList.add("hidden");

    document.getElementById("deleteLessonBtn").classList.remove("hidden");
    conflictBox.classList.add("hidden");
    modal.classList.remove("hidden");
}

function closeModal() {
    modal.classList.add("hidden");
}

document.getElementById("cancelBtn").addEventListener("click", closeModal);
modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

function buildPayload() {
    const week1 = document.getElementById("fieldWeek1").value;
    const week2 = document.getElementById("fieldWeek2").value;
    const classroom = document.getElementById("fieldClassroom").value;
    return {
        group_id: Number(document.getElementById("fieldGroup").value),
        teacher_id: Number(document.getElementById("fieldTeacher").value),
        subject_id: Number(document.getElementById("fieldSubject").value),
        classroom_id: classroom ? Number(classroom) : null,
        day: Number(document.getElementById("fieldDay").value),
        week1_lesson: week1 ? Number(week1) : null,
        week2_lesson: week2 ? Number(week2) : null,
        lesson_type: document.getElementById("fieldType").value,
    };
}

async function submitLesson(force = false) {
    const payload = buildPayload();
    if (force) payload.force = true;
    const lessonId = document.getElementById("lessonId").value;

    const result = lessonId
        ? await api.put(`/api/lessons/${lessonId}`, payload)
        : await api.post("/api/lessons", payload);

    if (result.ok) {
        closeModal();
        await loadAll();
        return;
    }

    if (result.status === 409 && result.data.conflicts) {
        const messages = result.data.conflicts.map((c) => c.message).join("<br>");
        conflictBox.innerHTML = `⚠ ${messages}<br><button type="button" id="forceBtn" class="btn-danger" style="margin-top:6px;">Всё равно сохранить</button>`;
        conflictBox.classList.remove("hidden");
        document.getElementById("forceBtn").addEventListener("click", () => submitLesson(true));
    } else {
        conflictBox.textContent = result.data?.error || "Ошибка сохранения";
        conflictBox.classList.remove("hidden");
    }
}

form.addEventListener("submit", (e) => {
    e.preventDefault();
    submitLesson(false);
});

document.getElementById("deleteLessonBtn").addEventListener("click", async () => {
    const lessonId = document.getElementById("lessonId").value;
    if (!lessonId) return;
    if (!confirm("Удалить занятие?")) return;
    await api.del(`/api/lessons/${lessonId}`);
    closeModal();
    await loadAll();
});

// ---------- Переключатель недель ----------
document.querySelectorAll(".week-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".week-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        state.currentWeek = Number(btn.dataset.week);
        renderTable();
    });
});

// ---------- Старт ----------
loadAll().catch((err) => {
    console.error(err);
    document.getElementById("scheduleTable").innerHTML =
        '<p class="loading">Не удалось загрузить данные. Проверь консоль (F12) и работу сервера.</p>';
});
