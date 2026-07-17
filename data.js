const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQYQ7CDVL2TIwyQEBTWjwmVR1k8X2acOTLgOxUIAaJgcwvSLDm-W6GGU7o5Sr3IeQ/pub?output=csv";

// ==================== DUMMY DATA (Fallback) ====================
const BENTUK_USAHA = ["PT", "CV"];
const LOKASI = ["Kota Serang", "Kab. Pandeglang", "Kota Tangerang Selatan", "Kab. Tangerang", "Kota Tangerang", "Kab. Lebak", "Kota Cilegon"];
const NAMA_DEPAN = ["Abi", "Abyakta", "Adhikari", "Adik", "Adipura", "Adriella", "Adriyan", "Adzra", "Ajisaka", "Ajitzama", "Bina", "Cipta", "Dwipa", "Eka", "Fajar", "Graha", "Harum", "Inti", "Jaya", "Kirana", "Lestari", "Mandala", "Nirwana", "Oksigen", "Prisma", "Ragam", "Sentosa", "Tunas", "Utama", "Wahana"];
const NAMA_BELAKANG = ["Karya Mandiri", "Sinergi Nusantara", "Konsultan Enjiniring", "Karya Konsultan", "Legon Persada", "Wijaya Konsultan", "Cipta Mandiri", "Kurnia Karya", "Teknik Konsultan", "Raya Consultan", "Guna Persada", "Abadi Sejahtera", "Utama Konsultan", "Prima Teknik", "Global Enjiniring"];
const NAMA_ORANG = ["Syamsudin", "Dimas Irman Anugrah, A.Md", "Asep Satriawan", "Muhamad Adik Hannurdin", "Didin Miftahudin", "Hilal Hariri", "Yayang Dwi. A. A", "Riyal Afrizal, ST", "Darmawan Setiaji", "Deny Deputra, SH", "Nurul Fajriah", "Bambang Setiawan", "Rina Marlina, S.T.", "Agus Purnomo", "Siti Rahmawati"];

function pad(num, len) {
  return String(num).padStart(len, "0");
}

function generateDummyMembers(count) {
  const members = [];
  for (let i = 0; i < count; i++) {
    const depan = NAMA_DEPAN[i % NAMA_DEPAN.length];
    const belakang = NAMA_BELAKANG[(i * 3 + 1) % NAMA_BELAKANG.length];
    const nama = `${depan} ${belakang}`.toUpperCase();
    const bentuk = BENTUK_USAHA[i % BENTUK_USAHA.length];
    const lokasi = LOKASI[(i * 2) % LOKASI.length];
    const penanggungJawab = NAMA_ORANG[(i * 5 + 2) % NAMA_ORANG.length];
    const aktif = i % 6 !== 0;

    const year = 2023 + (i % 3);
    const month = pad((i % 12) + 1, 2);
    const seq = pad(((i * 7) % 400) + 1, 4);
    const day = pad((i % 28) + 1, 2);

    // masaAktif: sebagian di masa lalu (Tidak Aktif), sebagian di masa depan (Aktif)
    const expiryYear = aktif ? 2026 + (i % 2) : 2024;
    const masaAktif = `${expiryYear}-${month}-${day}`;

    members.push({
      id: i + 1,
      namaPerusahaan: nama,
      noKta: `${seq}.36.${month}.${year}`,
      lokasi,
      bentukUsaha: bentuk,
      penanggungJawab,
      registeredAt: `${year}-${month}-${day}`,
      masaAktif,
      alamatLengkap: `Komp. Contoh No. ${i + 1}, ${lokasi}`,
      nomorHandphone: `08${1000000000 + i * 37}`,
      email: `${depan.toLowerCase()}${i}@gmail.com`,
      sbuNonKonstruksi: "",
      sbuKonstruksi: "",
    });
  }
  return members;
}

const DUMMY_MEMBERS = generateDummyMembers(48);

// ==================== STATUS DARI TANGGAL ====================
// Sheet tidak punya kolom status literal, jadi dihitung dari
// tanggal masa aktif dibanding hari ini, mirip formula Excel:
// =IF(tanggal>=TODAY(); "Aktif"; "Tidak Aktif")
function computeStatus(masaAktifRaw) {
  if (!masaAktifRaw) return "Tidak Aktif";
  const expiry = new Date(masaAktifRaw);
  if (isNaN(expiry.getTime())) return "Tidak Aktif";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);

  return expiry.getTime() >= today.getTime() ? "Aktif" : "Tidak Aktif";
}

function formatTanggalIndo(raw) {
  if (!raw) return "";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  const bulan = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  return `${pad(d.getDate(), 2)}-${bulan[d.getMonth()]}-${d.getFullYear()}`;
}

// ==================== PARSE CSV ====================

const KNOWN_KEYS_BY_HEADER = (lower) => {
  if (lower.includes("perusahaan") || lower === "nama" || lower.includes("nama perusahaan")) return "namaPerusahaan";
  if (lower.includes("kta")) return "noKta";
  if (lower.includes("alamat")) return "alamatLengkap";
  if (lower.includes("lokasi") || lower.includes("kota") || lower.includes("kab")) return "lokasi";
  if (lower.includes("bentuk") || (lower.includes("usaha") && !lower.includes("sbu"))) return "bentukUsaha";
  if (lower.includes("penanggung") || lower === "pj") return "penanggungJawab";
  if (lower.includes("handphone") || lower.includes("hp") || lower.includes("telepon") || lower.includes("telp") || lower.includes("whatsapp") || lower === "wa" || lower.includes(" wa") || lower.includes("kontak")) return "nomorHandphone";
  if (lower.includes("email")) return "email";
  if (lower.includes("sbu") && lower.includes("non")) return "sbuNonKonstruksi";
  if (lower.includes("sbu") && lower.includes("konstruksi")) return "sbuKonstruksi";
  if (lower.includes("masa") || lower.includes("berlaku") || lower.includes("expired") || lower.includes("expire")) return "masaAktif";
  if (lower.includes("tanggal") || lower.includes("tgl") || lower.includes("register") || lower.includes("daftar")) return "registeredAt";
  if (lower.includes("status")) return "statusMentah";
  return null;
};

function looksLikePhone(value) {
  if (!value) return false;
  const cleaned = value.replace(/[\s\-()]/g, "");
  return /^(\+?62|0)\d{8,13}$/.test(cleaned);
}

function looksLikeEmail(value) {
  if (!value) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function parseCsvToMembers(csvText) {
  const rows = csvText.trim().split("\n").map(parseCSVLine);
  if (rows.length < 2) return [];

  const headers = rows[0].map(h => h.trim().replace(/^"|"$/g, ""));
  console.log("Header kolom terdeteksi dari sheet:", headers);

  // tahap 1: mapping key berdasarkan nama header
  const keyByColumn = headers.map((header) => KNOWN_KEYS_BY_HEADER(header.toLowerCase()));

  const alreadyHasPhoneColumn = keyByColumn.includes("nomorHandphone");
  const alreadyHasEmailColumn = keyByColumn.includes("email");

  // tahap 2: untuk kolom yang headernya gak ketebak, sniff isinya
  // di beberapa baris pertama—kalau polanya kayak no. HP / email, pakai itu
  headers.forEach((header, colIndex) => {
    if (keyByColumn[colIndex]) return; // sudah ketebak dari nama header

    const sampleValues = rows
      .slice(1, 6)
      .map((r) => (r[colIndex] || "").trim().replace(/^"|"$/g, ""))
      .filter(Boolean);

    if (sampleValues.length === 0) return;

    if (!alreadyHasPhoneColumn && sampleValues.every(looksLikePhone)) {
      keyByColumn[colIndex] = "nomorHandphone";
    } else if (!alreadyHasEmailColumn && sampleValues.every(looksLikeEmail)) {
      keyByColumn[colIndex] = "email";
    }
  });

  console.log(
    "Pemetaan kolom -> field:",
    headers.map((h, i) => `${h} -> ${keyByColumn[i] || "(diabaikan)"}`)
  );

  const members = [];

  for (let i = 1; i < rows.length; i++) {
    const values = rows[i];
    if (!values || values.every((v) => !v || !v.trim())) continue;

    const member = {};

    headers.forEach((header, index) => {
      const key = keyByColumn[index] || header.trim();
      const raw = values[index] ? values[index].trim().replace(/^"|"$/g, "") : "";
      // jangan sampai kolom belakangan menimpa field yang sudah keisi duluan
      if (member[key] === undefined || member[key] === "") {
        member[key] = raw;
      }
    });

    member.status = computeStatus(member.masaAktif);
    member.masaAktifFormatted = formatTanggalIndo(member.masaAktif);

    if (member.namaPerusahaan) {
      if (!member.id) member.id = members.length + 1;
      members.push(member);
    }
  }

  members.sort((a, b) => new Date(b.registeredAt || 0) - new Date(a.registeredAt || 0));

  if (members[0]) console.log("Contoh data anggota pertama setelah di-parse:", members[0]);

  return members;
}

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

// ==================== FETCH DATA ====================

async function getMembers() {
  try {
    console.log("Mengambil data dari Google Sheets...");

    const res = await fetch(SHEET_CSV_URL);
    if (!res.ok) throw new Error(`HTTP error: ${res.status}`);

    const csvText = await res.text();
    const members = parseCsvToMembers(csvText);

    console.log(`Berhasil memuat ${members.length} data anggota dari Google Sheets`);
    return members;

  } catch (error) {
    console.error("Gagal fetch dari Google Sheets:", error);
    console.warn("Menggunakan dummy data sebagai fallback...");

    await new Promise(r => setTimeout(r, 400));
    return DUMMY_MEMBERS.map(m => ({
      ...m,
      status: computeStatus(m.masaAktif),
      masaAktifFormatted: formatTanggalIndo(m.masaAktif),
    }));
  }
}