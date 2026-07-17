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

// ==================== CUSTOM DATE PARSER SMART ====================
// Berfungsi mengenali format: YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY, & DD NamaBulan YYYY
function parseDateCustom(dateStr) {
  if (!dateStr) return null;
  
  let str = dateStr.trim().replace(/\s+/g, ' ');
  
  // Kamus Bulan Indonesia & Inggris
  const monthMap = {
    jan: 0, januari: 0, january: 0,
    feb: 1, februari: 1, february: 1,
    mar: 2, maret: 2, march: 2,
    apr: 3, april: 3,
    mei: 4, may: 4,
    jun: 5, juni: 5, june: 5,
    jul: 6, juli: 6, july: 6,
    agu: 7, agustus: 7, august: 7, aug: 7,
    sep: 8, september: 8,
    okt: 9, oktober: 9, october: 9, oct: 9,
    nov: 10, november: 10,
    des: 11, desember: 11, december: 11, dec: 11
  };

  // 1. Cek format ISO (YYYY-MM-DD atau YYYY/MM/DD)
  const isoMatch = str.match(/^(\d{4})[\-\/](\d{1,2})[\-\/](\d{1,2})$/);
  if (isoMatch) {
    return new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]));
  }

  // 2. Cek format Lokal (DD/MM/YYYY atau DD-MM-YYYY)
  const localMatch = str.match(/^(\d{1,2})[\-\/](\d{1,2})[\-\/](\d{4})$/);
  if (localMatch) {
    return new Date(parseInt(localMatch[3]), parseInt(localMatch[2]) - 1, parseInt(localMatch[1]));
  }

  // 3. Cek format Teks Huruf (Contoh: 02 Juli 2025 atau 2 August 2026)
  const textMatch = str.match(/^(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})$/);
  if (textMatch) {
    const day = parseInt(textMatch[1]);
    const monthIndex = monthMap[textMatch[2].toLowerCase()];
    const year = parseInt(textMatch[3]);
    
    if (monthIndex !== undefined) {
      return new Date(year, monthIndex, day);
    }
  }

  // Fallback terakhir jika tidak masuk kriteria di atas
  const fallbackDate = new Date(str);
  return isNaN(fallbackDate.getTime()) ? null : fallbackDate;
}

// ==================== STATUS DARI TANGGAL ====================
function computeStatus(masaAktifRaw) {
  if (!masaAktifRaw) return "Tidak Aktif";
  
  // Menggunakan parser kustom kita yang baru
  const expiry = parseDateCustom(masaAktifRaw);
  if (!expiry) return "Tidak Aktif";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);

  return expiry.getTime() >= today.getTime() ? "Aktif" : "Tidak Aktif";
}

function formatTanggalIndo(raw) {
  if (!raw) return "";
  const d = parseDateCustom(raw);
  if (!d) return raw;
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

  const keyByColumn = headers.map((header) => KNOWN_KEYS_BY_HEADER(header.toLowerCase()));
  const alreadyHasPhoneColumn = keyByColumn.includes("nomorHandphone");
  const alreadyHasEmailColumn = keyByColumn.includes("email");

  headers.forEach((header, colIndex) => {
    if (keyByColumn[colIndex]) return;

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

  // Pengurutan juga disesuaikan menggunakan custom parser agar aman
  members.sort((a, b) => {
    const dateB = parseDateCustom(b.registeredAt) || new Date(0);
    const dateA = parseDateCustom(a.registeredAt) || new Date(0);
    return dateB - dateA;
  });

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
