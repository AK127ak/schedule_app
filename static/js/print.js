const DAYS = [
    { id: 1, name: "Понедельник" },
    { id: 2, name: "Вторник" },
    { id: 3, name: "Среда" },
    { id: 4, name: "Четверг" },
    { id: 5, name: "Пятница" },
    { id: 6, name: "Суббота" },
];
const PAIRS = [1, 2, 3, 4, 5, 6];

const groupId = Number(document.currentScript.dataset.groupId);

function buildWeekTable(lessons, weekField, weekLabel) {
    const table = document.createElement("table");
    table.className = "print-grid";

    const thead = document.createElement("thead");
    thead.innerHTML = "<tr><th>День</th><th>Пара</th><th>Занятие</th></tr>";
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    DAYS.forEach((day) => {
        PAIRS.forEach((pair, idx) => {
            const lesson = lessons.find((l) => l.day === day.id && l[weekField] === pair);
            // Пропускаем полностью пустые строки, чтобы не печатать лишнее
            if (!lesson) return;

            const tr = document.createElement("tr");
            const dayTd = document.createElement("td");
            dayTd.className = "day-cell";
            dayTd.textContent = day.name;
            tr.appendChild(dayTd);

            const pairTd = document.createElement("td");
            pairTd.className = "pair-cell";
            pairTd.textContent = pair;
            tr.appendChild(pairTd);

            const infoTd = document.createElement("td");
            infoTd.innerHTML = `<strong>${lesson.subject_name}</strong> — ${lesson.teacher_name}` +
                (lesson.classroom_number ? `, каб. ${lesson.classroom_number}` : "") +
                (lesson.lesson_type ? ` (${lesson.lesson_type})` : "");
            tr.appendChild(infoTd);

            tbody.appendChild(tr);
        });
    });

    if (tbody.children.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="empty">Занятий нет</td></tr>';
    }

    table.appendChild(tbody);

    const wrapper = document.createElement("div");
    const title = document.createElement("div");
    title.className = "week-title";
    title.textContent = weekLabel;
    wrapper.appendChild(title);
    wrapper.appendChild(table);
    return wrapper;
}

async function init() {
    const [groups, lessons] = await Promise.all([
        api.get("/api/groups"),
        api.get("/api/lessons"),
    ]);

    const group = groups.find((g) => g.id === groupId);
    const header = document.getElementById("printHeader");

    if (!group) {
        header.innerHTML = "<p>Группа не найдена</p>";
        return;
    }

    header.innerHTML = `
        <h1>Расписание группы ${group.name}</h1>
        <p>${group.speciality}, ${group.course} курс</p>
    `;
    document.title = `Расписание ${group.name}`;

    const groupLessons = lessons.filter((l) => l.group_id === groupId);

    const container = document.getElementById("printTables");
    container.appendChild(buildWeekTable(groupLessons, "week1_lesson", "1-я учебная неделя"));
    container.appendChild(buildWeekTable(groupLessons, "week2_lesson", "2-я учебная неделя"));
}

init().catch((err) => {
    console.error(err);
    document.getElementById("printHeader").innerHTML = "<p>Ошибка загрузки данных</p>";
});
