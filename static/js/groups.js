let groups = [];

restrictToDigits(document.getElementById("fieldCourse"));
restrictToLetters(document.getElementById("fieldSpeciality"));

async function load() {
    groups = await api.get("/api/groups");
    render();
}

function render() {
    const body = document.getElementById("tableBody");
    if (groups.length === 0) {
        body.innerHTML = '<tr><td colspan="4" class="loading">Группы ещё не добавлены</td></tr>';
        return;
    }
    body.innerHTML = groups.map((g) => `
        <tr>
            <td>${g.name}</td>
            <td>${g.speciality}</td>
            <td>${g.course}</td>
            <td class="actions-cell">
                <button onclick="openEdit(${g.id})">Изменить</button>
                <button class="danger" onclick="removeItem(${g.id})">Удалить</button>
            </td>
        </tr>
    `).join("");
}

const modal = document.getElementById("itemModal");
const errorBox = document.getElementById("errorBox");

function openAdd() {
    document.getElementById("modalTitle").textContent = "Добавление группы";
    document.getElementById("itemId").value = "";
    document.getElementById("fieldName").value = "";
    document.getElementById("fieldSpeciality").value = "";
    document.getElementById("fieldCourse").value = "";
    document.getElementById("deleteBtn").classList.add("hidden");
    errorBox.classList.add("hidden");
    modal.classList.remove("hidden");
}

function openEdit(id) {
    const g = groups.find((x) => x.id === id);
    if (!g) return;
    document.getElementById("modalTitle").textContent = "Редактирование группы";
    document.getElementById("itemId").value = g.id;
    document.getElementById("fieldName").value = g.name;
    document.getElementById("fieldSpeciality").value = g.speciality;
    document.getElementById("fieldCourse").value = g.course;
    document.getElementById("deleteBtn").classList.remove("hidden");
    errorBox.classList.add("hidden");
    modal.classList.remove("hidden");
}

async function removeItem(id) {
    if (!confirm("Удалить группу? Все занятия этой группы в расписании тоже будут удалены.")) return;
    await api.del(`/api/groups/${id}`);
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
        speciality: document.getElementById("fieldSpeciality").value.trim(),
        course: Number(document.getElementById("fieldCourse").value),
    };

    const result = id
        ? await api.put(`/api/groups/${id}`, payload)
        : await api.post("/api/groups", payload);

    if (result.ok) {
        modal.classList.add("hidden");
        await load();
    } else {
        errorBox.textContent = result.data?.error || "Ошибка сохранения";
        errorBox.classList.remove("hidden");
    }
});

load();
