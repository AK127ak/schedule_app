let teachers = [];
let subjects = [];

restrictToLetters(document.getElementById("fieldName"));
restrictToLetters(document.getElementById("fieldShortName"));

async function load() {
    [teachers, subjects] = await Promise.all([
        api.get("/api/teachers"),
        api.get("/api/subjects"),
    ]);
    render();
}

function render() {
    const body = document.getElementById("tableBody");
    if (teachers.length === 0) {
        body.innerHTML = '<tr><td colspan="5" class="loading">Преподаватели ещё не добавлены</td></tr>';
        return;
    }
    body.innerHTML = teachers.map((t) => `
        <tr>
            <td><span class="color-dot-inline" style="background:${t.color}"></span></td>
            <td>${t.short_name}</td>
            <td>${t.name}</td>
            <td><div class="chip-list">${
                t.subjects.length
                    ? t.subjects.map((s) => `<span class="chip">${s.short_name}</span>`).join("")
                    : '<span style="color:#94a3b8;">—</span>'
            }</div></td>
            <td class="actions-cell">
                <button onclick="openEdit(${t.id})">Изменить</button>
                <button class="danger" onclick="removeItem(${t.id})">Удалить</button>
            </td>
        </tr>
    `).join("");
}

function renderCheckboxes(selectedIds) {
    const container = document.getElementById("subjectCheckboxes");
    if (subjects.length === 0) {
        container.innerHTML = '<span style="color:#94a3b8;font-size:12px;">Сначала добавьте дисциплины</span>';
        return;
    }
    container.innerHTML = subjects.map((s) => `
        <label>
            <input type="checkbox" value="${s.id}" ${selectedIds.includes(s.id) ? "checked" : ""}>
            ${s.name}
        </label>
    `).join("");
}

function getCheckedSubjectIds() {
    return Array.from(document.querySelectorAll("#subjectCheckboxes input:checked")).map((el) => Number(el.value));
}

const modal = document.getElementById("itemModal");
const errorBox = document.getElementById("errorBox");

function openAdd() {
    document.getElementById("modalTitle").textContent = "Добавление преподавателя";
    document.getElementById("itemId").value = "";
    document.getElementById("fieldName").value = "";
    document.getElementById("fieldShortName").value = "";
    document.getElementById("fieldColor").value = "#3B82F6";
    renderCheckboxes([]);
    document.getElementById("deleteBtn").classList.add("hidden");
    errorBox.classList.add("hidden");
    modal.classList.remove("hidden");
}

function openEdit(id) {
    const t = teachers.find((x) => x.id === id);
    if (!t) return;
    document.getElementById("modalTitle").textContent = "Редактирование преподавателя";
    document.getElementById("itemId").value = t.id;
    document.getElementById("fieldName").value = t.name;
    document.getElementById("fieldShortName").value = t.short_name;
    document.getElementById("fieldColor").value = t.color;
    renderCheckboxes(t.subjects.map((s) => s.id));
    document.getElementById("deleteBtn").classList.remove("hidden");
    errorBox.classList.add("hidden");
    modal.classList.remove("hidden");
}

async function removeItem(id) {
    if (!confirm("Удалить преподавателя? Все его занятия в расписании тоже будут удалены.")) return;
    await api.del(`/api/teachers/${id}`);
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
        color: document.getElementById("fieldColor").value,
        subject_ids: getCheckedSubjectIds(),
    };

    const result = id
        ? await api.put(`/api/teachers/${id}`, payload)
        : await api.post("/api/teachers", payload);

    if (result.ok) {
        modal.classList.add("hidden");
        await load();
    } else {
        errorBox.textContent = result.data?.error || "Ошибка сохранения";
        errorBox.classList.remove("hidden");
    }
});

load();
