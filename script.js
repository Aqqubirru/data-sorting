const PAGE_SIZE = 10;

const BENTUK_KOSONG_TOKENS = ["", "-", "tidak tercantum", "tidak ada", "belum ada", "n/a", "na", "kosong"];

function isBentukKosong(value) {
  if (!value) return true;
  const normalized = String(value).trim().toLowerCase();
  return BENTUK_KOSONG_TOKENS.includes(normalized);
}

const state = {
  all: [],
  filtered: [],
  search: "",
  status: "",
  bentukUsaha: "",
  sort: "status-latest",
  page: 1,
};

const els = {
  search: document.getElementById("searchInput"),
  status: document.getElementById("statusFilter"),
  bentukUsaha: document.getElementById("bentukUsahaFilter"),
  sort: document.getElementById("sortSelect"),
  resetBtn: document.getElementById("resetBtn"),
  summary: document.getElementById("resultSummary"),
  tableBody: document.getElementById("tableBody"),
  tableWrap: document.getElementById("tableWrap"),
  cardList: document.getElementById("cardList"),
  emptyState: document.getElementById("emptyState"),
  firstPage: document.getElementById("firstPage"),
  prevPage: document.getElementById("prevPage"),
  nextPage: document.getElementById("nextPage"),
  lastPage: document.getElementById("lastPage"),
  pageNumbers: document.getElementById("pageNumbers"),
  modalOverlay: document.getElementById("modalOverlay"),
  modalClose: document.getElementById("modalClose"),
  modalNama: document.getElementById("modalNama"),
  modalBentukUsaha: document.getElementById("modalBentukUsaha"),
  modalStatus: document.getElementById("modalStatus"),
  modalNoKta: document.getElementById("modalNoKta"),
  modalPenanggungJawab: document.getElementById("modalPenanggungJawab"),
  modalMasaAktif: document.getElementById("modalMasaAktif"),
  modalHandphone: document.getElementById("modalHandphone"),
  modalEmail: document.getElementById("modalEmail"),
  modalAlamat: document.getElementById("modalAlamat"),
  modalSbuNon: document.getElementById("modalSbuNon"),
  modalSbuKonstruksi: document.getElementById("modalSbuKonstruksi"),
};

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function normalize(str) {
  return (str || "").toLowerCase().trim();
}

function applyFiltersAndSort() {
  const q = normalize(state.search);

  let result = state.all.filter((m) => {
    const matchesSearch =
      !q ||
      normalize(m.namaPerusahaan).includes(q) ||
      normalize(m.penanggungJawab).includes(q) ||
      normalize(m.lokasi).includes(q);

    const matchesBentuk =
      !state.bentukUsaha ||
      (state.bentukUsaha === "TIDAK_TERCANTUM"
        ? isBentukKosong(m.bentukUsaha)
        : normalize(m.bentukUsaha) === normalize(state.bentukUsaha));

    const matchesStatus = !state.status || m.status === state.status;

    return matchesSearch && matchesBentuk && matchesStatus;
  });

  result = result.slice().sort((a, b) => {
    switch (state.sort) {
      case "abjad-desc":
        return b.namaPerusahaan.localeCompare(a.namaPerusahaan);
      case "terbaru":
        return b.registeredAt.localeCompare(a.registeredAt);
      case "terlama":
        return a.registeredAt.localeCompare(b.registeredAt);
      case "abjad-asc":
        return a.namaPerusahaan.localeCompare(b.namaPerusahaan);
      case "status-latest":
      default: {
        // Aktif tampil duluan, di dalam masing-masing grup diurutkan
        // dari yang paling baru (registeredAt terbaru duluan)
        const statusRank = (s) => (s === "Aktif" ? 0 : 1);
        const rankDiff = statusRank(a.status) - statusRank(b.status);
        if (rankDiff !== 0) return rankDiff;
        return (b.registeredAt || "").localeCompare(a.registeredAt || "");
      }
    }
  });

  state.filtered = result;

  const totalPages = Math.max(1, Math.ceil(result.length / PAGE_SIZE));
  if (state.page > totalPages) state.page = totalPages;
  if (state.page < 1) state.page = 1;

  render();
}

function currentPageItems() {
  const start = (state.page - 1) * PAGE_SIZE;
  return state.filtered.slice(start, start + PAGE_SIZE);
}

function statusPillHtml(status) {
  const cls = status === "Aktif" ? "pill-active" : "pill-inactive";
  return `<span class="pill ${cls}">${status}</span>`;
}

function bentukPillHtml(bentuk) {
  const label = isBentukKosong(bentuk) ? "Tidak Tercantum" : bentuk;
  return `<span class="pill pill-outline">${label}</span>`;
}

function render() {
  const items = currentPageItems();

  els.emptyState.hidden = items.length !== 0;
  els.tableWrap.style.display = items.length === 0 ? "none" : "";
  els.cardList.style.display = items.length === 0 ? "none" : "";

  // desktop table rows
  els.tableBody.innerHTML = items
    .map(
      (m) => `
    <tr data-id="${m.id}">
      <td><a href="#" class="company-link" data-id="${m.id}">${m.namaPerusahaan}</a></td>
      <td class="muted-cell">${m.noKta}</td>
      <td class="muted-cell">${m.lokasi}</td>
      <td>${statusPillHtml(m.status)}</td>
      <td>${bentukPillHtml(m.bentukUsaha)}</td>
      <td class="muted-cell">${m.penanggungJawab}</td>
    </tr>
  `
    )
    .join("");

  // mobile cards
  els.cardList.innerHTML = items
    .map(
      (m) => `
    <div class="member-card" data-id="${m.id}">
      <div class="member-card-head">
        <a href="#" class="company-link" data-id="${m.id}">${m.namaPerusahaan}</a>
        ${statusPillHtml(m.status)}
      </div>
      <dl class="member-card-grid">
        <dt>No KTA</dt><dd>${m.noKta}</dd>
        <dt>Lokasi</dt><dd>${m.lokasi}</dd>
        <dt>Bentuk Usaha</dt><dd>${bentukPillHtml(m.bentukUsaha)}</dd>
        <dt>Penanggung Jawab</dt><dd>${m.penanggungJawab}</dd>
      </dl>
    </div>
  `
    )
    .join("");

  renderSummary();
  renderPagination();
}

function renderSummary() {
  const total = state.filtered.length;
  if (total === 0) {
    els.summary.textContent = "Menampilkan 0 dari 0 anggota";
    return;
  }
  const start = (state.page - 1) * PAGE_SIZE + 1;
  const end = Math.min(state.page * PAGE_SIZE, total);
  els.summary.textContent = `Menampilkan ${start}-${end} dari ${total} anggota`;
}

function renderPagination() {
  const totalPages = Math.max(1, Math.ceil(state.filtered.length / PAGE_SIZE));
  const page = state.page;

  els.firstPage.disabled = page === 1;
  els.prevPage.disabled = page === 1;
  els.nextPage.disabled = page === totalPages;
  els.lastPage.disabled = page === totalPages;

  const pages = getPageWindow(page, totalPages);
  let ellipsisCount = 0;

  els.pageNumbers.innerHTML = pages
    .map((p) => {
      if (p === "...") {
        ellipsisCount += 1;
        return `<button class="page-btn page-ellipsis-btn" data-ellipsis="${ellipsisCount}" type="button" title="Lompat ke halaman...">…</button>`;
      }
      const activeCls = p === page ? "active" : "";
      return `<button class="page-btn" data-page="${p}" ${activeCls ? 'data-active="1"' : ""}>${p}</button>`;
    })
    .join("");

  els.pageNumbers.querySelectorAll("[data-page]").forEach((btn) => {
    if (btn.dataset.active) btn.classList.add("active");
  });

  els.pageNumbers.dataset.totalPages = String(totalPages);
}

function openPageJumpInput(ellipsisBtn) {
  const totalPages = Number(els.pageNumbers.dataset.totalPages || 1);
  const input = document.createElement("input");
  input.type = "text";
  input.inputMode = "numeric";
  input.className = "page-jump-input";
  input.placeholder = "?";

  ellipsisBtn.replaceWith(input);
  input.focus();

  let committed = false;
  const commit = () => {
    if (committed) return;
    committed = true;
    const val = Number(input.value);
    if (val >= 1 && val <= totalPages) {
      state.page = val;
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      render();
    }
  };

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") commit();
    if (e.key === "Escape") {
      committed = true;
      render();
    }
  });
  input.addEventListener("blur", commit);
}

// Event delegation permanen di kontainer nomor halaman — dipasang sekali
// di bindModalEvents/bindEvents, bukan tiap render, supaya klik selalu kebaca
// meskipun tombolnya di-render ulang.
function bindPaginationEvents() {
  els.pageNumbers.addEventListener("click", (e) => {
    const ellipsisBtn = e.target.closest(".page-ellipsis-btn");
    if (ellipsisBtn) {
      openPageJumpInput(ellipsisBtn);
      return;
    }
    const pageBtn = e.target.closest("[data-page]");
    if (pageBtn) {
      state.page = Number(pageBtn.dataset.page);
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });
}

function getPageWindow(current, total) {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const firstFour = [1, 2, 3, 4];
  if (current > 4 && current < total) {
    return [...firstFour, "...", current, "...", total].filter(
      (v, i, arr) => !(v === "..." && arr[i - 1] === "...")
    );
  }

  return [...firstFour, "...", total];
}

function goToPage(delta) {
  const totalPages = Math.max(1, Math.ceil(state.filtered.length / PAGE_SIZE));
  state.page = Math.min(totalPages, Math.max(1, state.page + delta));
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setBoxText(el, value) {
  el.textContent = value && String(value).trim() ? value : "";
}

function openModalById(id) {
  const member = state.filtered.find((m) => String(m.id) === String(id))
    || state.all.find((m) => String(m.id) === String(id));
  if (!member) return;

  els.modalNama.textContent = member.namaPerusahaan || "";
  els.modalNoKta.textContent = member.noKta || "-";

  els.modalBentukUsaha.className = "pill pill-outline";
  els.modalBentukUsaha.textContent = member.bentukUsaha || "-";

  els.modalStatus.className = `pill ${member.status === "Aktif" ? "pill-active" : "pill-inactive"}`;
  els.modalStatus.textContent = member.status || "-";

  setBoxText(els.modalPenanggungJawab, member.penanggungJawab);

  const masaAktifText = member.masaAktifFormatted
    ? `Aktif sampai dengan ${member.masaAktifFormatted}`
    : "";
  setBoxText(els.modalMasaAktif, masaAktifText);

  setBoxText(els.modalHandphone, member.nomorHandphone);
  setBoxText(els.modalEmail, member.email);
  setBoxText(els.modalAlamat, member.alamatLengkap);
  setBoxText(els.modalSbuNon, member.sbuNonKonstruksi);
  setBoxText(els.modalSbuKonstruksi, member.sbuKonstruksi);

  els.modalOverlay.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeModal() {
  els.modalOverlay.hidden = true;
  document.body.style.overflow = "";
}

function bindModalEvents() {
  els.tableBody.addEventListener("click", (e) => {
    const target = e.target.closest("[data-id]");
    if (!target) return;
    e.preventDefault();
    openModalById(target.dataset.id);
  });

  els.cardList.addEventListener("click", (e) => {
    const target = e.target.closest("[data-id]");
    if (!target) return;
    e.preventDefault();
    openModalById(target.dataset.id);
  });

  els.modalClose.addEventListener("click", closeModal);

  els.modalOverlay.addEventListener("click", (e) => {
    if (e.target === els.modalOverlay) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !els.modalOverlay.hidden) closeModal();
  });
}

function resetFilters() {
  state.search = "";
  state.status = "";
  state.bentukUsaha = "";
  state.sort = "status-latest";
  state.page = 1;
  els.search.value = "";
  els.status.value = "";
  els.bentukUsaha.value = "";
  els.sort.value = "status-latest";
  applyFiltersAndSort();
}

function bindEvents() {
  const debouncedSearch = debounce((val) => {
    state.search = val;
    state.page = 1;
    applyFiltersAndSort();
  }, 250);

  els.search.addEventListener("input", (e) => debouncedSearch(e.target.value));

  els.status.addEventListener("change", (e) => {
    state.status = e.target.value;
    state.page = 1;
    applyFiltersAndSort();
  });

  els.bentukUsaha.addEventListener("change", (e) => {
    state.bentukUsaha = e.target.value;
    state.page = 1;
    applyFiltersAndSort();
  });

  els.sort.addEventListener("change", (e) => {
    state.sort = e.target.value;
    state.page = 1;
    applyFiltersAndSort();
  });

  els.resetBtn.addEventListener("click", resetFilters);

  els.firstPage.addEventListener("click", () => {
    state.page = 1;
    render();
  });
  els.lastPage.addEventListener("click", () => {
    state.page = Math.max(1, Math.ceil(state.filtered.length / PAGE_SIZE));
    render();
  });
  els.prevPage.addEventListener("click", () => goToPage(-1));
  els.nextPage.addEventListener("click", () => goToPage(1));
}

async function init() {
  bindEvents();
  bindModalEvents();
  bindPaginationEvents();
  els.summary.textContent = "Memuat data…";
  state.all = await getMembers();
  applyFiltersAndSort();
}

init();