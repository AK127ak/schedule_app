let subjects = [];
let teachers = [];

restrictToLetters(document.getElementById("fieldName"));
restrictToLetters(document.getElementById("fieldShortName"));

async function load() {
    [subjects, teachers] = await Promise.all([
        api.get("/api/subjects"),
        api.get("/api/teachers"),
    ]);
    render();
}

function render() {
    const body = document.getElementById("tableBody");
    if (subjects.length === 0) {
        body.innerHTML = '<tr><td colspan="4" class="loading">Дисциплины ещё не добавлены</td></tr>';
        return;
    }
    body.innerHTML = subjects.map((s) => `
        <tr>
            <td>${s.name}</td>
            <td>${s.short_name}</td>
            <td><div class="chip-list">${
                s.teachers.length
                    ? s.teachers.map((t) => `<span class="chip">${t.short_name}</span>`).join("")
                    : '<span style="color:#94a3b8;">—</span>'
            }</div></td>
            <td class="actions-cell">
                <button onclick="openEdit(${s.id})">Изменить</button>
                <button class="danger" onclick="removeItem(${s.id})">Удалить</button>
            </td>
        </tr>
    `).join("");
}

function renderCheckboxes(selectedIds) {
    const container = document.getElementById("teacherCheckboxes");
    if (teachers.length === 0) {
        container.innerHTML = '<span style="color:#94a3b8;font-size:12px;">Сначала добавьте преподавателей</span>';
        return;
    }
    container.innerHTML = teachers.map((t) => `
        <label>
            <input type="checkbox" value="${t.id}" ${selectedIds.includes(t.id) ? "checked" : ""}>
            ${t.short_name} — ${t.name}
        </label>
    `).join("");
}

function getCheckedTeacherIds() {
    return Array.from(document.querySelectorAll("#teacherCheckboxes input:checked")).map((el) => Number(el.value));
}

const modal = document.getElementById("itemModal");
const errorBox = document.getElementById("errorBox");

function openAdd() {
    document.getElementById("modalTitle").textContent = "Добавление дисциплины";
    document.getElementById("itemId").value = "";
    document.getElementById("fieldName").value = "";
    document.getElementById("fieldShortName").value = "";
    renderCheckboxes([]);
    document.getElementById("deleteBtn").classList.add("hidden");
    errorBox.classList.add("hidden");
    modal.classList.remove("hidden");
}

function openEdit(id) {
    const s = subjects.find((x) => x.id === id);
    if (!s) return;
    document.getElementById("modalTitle").textContent = "Редактирование дисциплины";
    document.getElementById("itemId").value = s.id;
    document.getElementById("fieldName").value = s.name;
    document.getElementById("fieldShortName").value = s.short_name;
    renderCheckboxes(s.teachers.map((t) => t.id));
    document.getElementById("deleteBtn").classList.remove("hidden");
    errorBox.classList.add("hidden");
    modal.classList.remove("hidden");
}

async function removeItem(id) {
    if (!confirm("Удалить дисциплину? Все связанные занятия в расписании тоже будут удалены.")) return;
    await api.del(`/api/subjects/${id}`);
    await load();
}

document.getElementById("addBtn").addEventListener("click", openAdd);
document.getElementById("cancelBtn").addEventListener("click", () => modal.classList.add("hidden"));
modal.addEventListener("click", (e) => { if (e.target === modal) modal.classList.add("hidden"); });

document.getElementById("deleteBtn").addEventListener("click", async () => {
    const id = document.getElementById("itemId").value;
    if (!id) return;
    await removeItem(Number(id));
    modal.classList.add("hidden");
});

document.getElementById("itemForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("itemId").value;
    const payload = {
        name: document.getElementById("fieldName").value.trim(),
        short_name: document.getElementById("fieldShortName").value.trim(),
        teacher_ids: getCheckedTeacherIds(),
    };

    const result = id
        ? await api.put(`/api/subjects/${id}`, payload)
        : await api.post("/api/subjects", payload);

    if (result.ok) {
        modal.classList.add("hidden");
        await load();
    } else {
        errorBox.textContent = result.data?.error || "Ошибка сохранения";
        errorBox.classList.remove("hidden");
    }
});

load();
