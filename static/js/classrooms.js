let classrooms = [];

restrictToDigits(document.getElementById("fieldNumber"));
restrictToDigits(document.getElementById("fieldSeats"));
restrictToLetters(document.getElementById("fieldName"));
restrictToLetters(document.getElementById("fieldType"));

async function load() {
    classrooms = await api.get("/api/classrooms");
    render();
}

function render() {
    const body = document.getElementById("tableBody");
    if (classrooms.length === 0) {
        body.innerHTML = '<tr><td colspan="5" class="loading">Кабинеты ещё не добавлены</td></tr>';
        return;
    }
    body.innerHTML = classrooms.map((c) => `
        <tr>
            <td>${c.number}</td>
            <td>${c.name || "—"}</td>
            <td>${c.room_type || "—"}</td>
            <td>${c.seats ?? "—"}</td>
            <td class="actions-cell">
                <button onclick="openEdit(${c.id})">Изменить</button>
                <button class="danger" onclick="removeItem(${c.id})">Удалить</button>
            </td>
        </tr>
    `).join("");
}

const modal = document.getElementById("itemModal");
const errorBox = document.getElementById("errorBox");

function openAdd() {
    document.getElementById("modalTitle").textContent = "Добавление кабинета";
    document.getElementById("itemId").value = "";
    document.getElementById("fieldNumber").value = "";
    document.getElementById("fieldName").value = "";
    document.getElementById("fieldType").value = "";
    document.getElementById("fieldSeats").value = "";
    document.getElementById("deleteBtn").classList.add("hidden");
    errorBox.classList.add("hidden");
    modal.classList.remove("hidden");
}

function openEdit(id) {
    const c = classrooms.find((x) => x.id === id);
    if (!c) return;
    document.getElementById("modalTitle").textContent = "Редактирование кабинета";
    document.getElementById("itemId").value = c.id;
    document.getElementById("fieldNumber").value = c.number;
    document.getElementById("fieldName").value = c.name || "";
    document.getElementById("fieldType").value = c.room_type || "";
    document.getElementById("fieldSeats").value = c.seats ?? "";
    document.getElementById("deleteBtn").classList.remove("hidden");
    errorBox.classList.add("hidden");
    modal.classList.remove("hidden");
}

async function removeItem(id) {
    if (!confirm("Удалить кабинет? У связанных занятий кабинет будет очищен.")) return;
    await api.del(`/api/classrooms/${id}`);
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
    const seats = document.getElementById("fieldSeats").value;
    const payload = {
        number: document.getElementById("fieldNumber").value.trim(),
        name: document.getElementById("fieldName").value.trim(),
        room_type: document.getElementById("fieldType").value.trim(),
        seats: seats ? Number(seats) : null,
    };

    const result = id
        ? await api.put(`/api/classrooms/${id}`, payload)
        : await api.post("/api/classrooms", payload);

    if (result.ok) {
        modal.classList.add("hidden");
        await load();
    } else {
        errorBox.textContent = result.data?.error || "Ошибка сохранения";
        errorBox.classList.remove("hidden");
    }
});

load();
