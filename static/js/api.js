const api = {
    async get(url) {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
        return res.json();
    },

    async send(method, url, body) {
        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body || {}),
        });
        const data = res.status === 204 ? null : await res.json();
        return { ok: res.ok, status: res.status, data };
    },

    post(url, body) { return this.send("POST", url, body); },
    put(url, body) { return this.send("PUT", url, body); },

    async del(url) {
        const res = await fetch(url, { method: "DELETE" });
        return res.ok;
    },
};

// ---------- Фильтры ввода: только цифры / только буквы ----------
// Применяются к полям форм, чтобы нельзя было ввести лишние символы.
function restrictToDigits(el) {
    if (!el) return;
    el.addEventListener("input", () => {
        el.value = el.value.replace(/[^0-9]/g, "");
    });
}

function restrictToLetters(el) {
    if (!el) return;
    el.addEventListener("input", () => {
        // Буквы (рус/лат), пробелы и дефис — для составных названий вроде «Информационные системы»
        el.value = el.value.replace(/[^a-zA-Zа-яА-ЯёЁ\s-]/g, "");
    });
}
