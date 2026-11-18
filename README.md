<div align="center">

# 🐾 MiawDo

**Aplikasi Mobile To-Do List & Pelacak Produktivitas (Clean & Cozy Cat Theme)**

[![React Native](https://img.shields.io/badge/React%20Native-0.88.1-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK%2058-000020?style=flat-square&logo=expo&logoColor=white)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![SQLite](https://img.shields.io/badge/Database-SQLite%20(Local)-003B57?style=flat-square&logo=sqlite&logoColor=white)](https://docs.expo.dev/versions/latest/sdk/sqlite/)
[![License: MIT](https://img.shields.io/badge/License-MIT-F09A4B?style=flat-square)](LICENSE)
[![Author](https://img.shields.io/badge/Author-Yenvys-D96B43?style=flat-square)](https://github.com/Yenvys)

*Tetap santai, satu per satu tugas pasti beres.* 🐾

---

</div>

## 📖 Tentang MiawDo

**MiawDo** adalah aplikasi *to-do list* dan pelacak produktivitas personal untuk perangkat bergerak (Android & iOS). Mengusung konsep desain **Clean Minimalist meets Cozy Feline**, MiawDo menghadirkan antarmuka yang tenang, bersih, serta bebas distraksi dengan sentuhan estetika kucing yang hangat dan menyenangkan.

Aplikasi ini dibangun secara **100% Offline-First** dengan database lokal berkinerja tinggi (`expo-sqlite`). Semua data tugas, kategori, riwayat, dan pengaturan tersimpan sepenuhnya di perangkat Anda — tanpa akun wajib, tanpa analitik pihak ketiga, dan tanpa server awan (*zero cloud dependency*).

---

## ✨ Fitur Utama

### 1. 🐱 Pengalaman Pengguna Hangat & Menggemaskan
- **Animasi Pembuka Mulus (*Animated Splash Screen*)**: Transisi memikat berbasis siluet ikon resmi aplikasi dengan gerakan *floating*, denyut aura lembut (*ambient glow*), dan jejak kaki (*paw prints*) yang rapi tanpa glitch.
- **Stempel Paw Selesai (*Paw-Print Completion*)**: Tiap tugas yang diselesaikan ditandai dengan stempel cetak kaki kucing yang interaktif.
- **Sapaan Dinamis & Maskot**: Maskot kucing yang menyapa sesuai waktu (pagi, siang, sore, malam) dan memberi respon hangat terhadap progres harian Anda.

### 2. 📱 100% Offline-First & Privasi Terjaga
- Didukung oleh **SQLite** lokal via library resmi `expo-sqlite`.
- Performa kilat, konsumsi memori hemat, dan dapat digunakan di mana saja tanpa koneksi internet.
- Data sepenuhnya menjadi milik pengguna di perangkat masing-masing.

### 3. 🌗 Dual Ambient Themes (Pagi & Malam)
- **Sunlit Catnap (Light Mode)**: Warna dasar krem hangat (`#FAF7F2`) dengan aksen terakota jahe (`#D96B43`), kontras tinggi (> 12:1) yang ramah di mata untuk siang hari.
- **Midnight Purr (Dark Mode)**: Warna batu tulis malam gelap (`#12151E`) dengan aksen kuning bulan (*moonlight amber* `#F09A4B`) yang nyaman untuk malam hari.

### 4. 📅 Manajemen Tugas Cerdas
- **Penjadwalan & Waktu Jatuh Tempo**: Atur tanggal, waktu pelaksanaan, serta prioritas tugas (Tinggi, Sedang, Rendah).
- **Pengulangan Otomatis (*Recurrence Engine*)**: Mendukung jadwal harian, mingguan, hari kerja (Senin–Jumat), hingga bulanan.
- **Subtasks (Langkah Pengerjaan)**: Bagi tugas besar menjadi daftar cek kecil yang mudah diselesaikan bertahap.
- **Fitur Tunda (*Smart Snooze*)**: Tunda tugas dengan cepat (+15 Menit, Nanti Malam, Besok Pagi, atau Tanggal Kustom).
- **Kategori Khusus**: Kelompokkan tugas ke dalam kategori seperti Kerja, Belanja, Pribadi, Belajar, dll. dengan ikon dan warna tersendiri.

### 5. 📊 Statistik & Analisis Produktivitas
- **Laju Penyelesaian 7 Hari**: Grafik batang visual interaktif untuk memantau performa harian Anda.
- **Kategori Teratas**: Analisis kategori mana yang paling aktif dan sering diselesaikan.
- **Riwayat Lengkap**: Arsip kegiatan yang telah diselesaikan dengan opsi penghapusan riwayat secara selektif.

### 6. ⏰ Pengingat & Notifikasi Lokal
- Pengingat jatuh tempo tugas langsung di perangkat (*local scheduled notifications*).
- Pengingat rangkuman harian (*Daily Digest*) yang dapat disesuaikan jam tayangnya.

---

## 🛠️ Tech Stack & Arsitektur

| Komponen | Teknologi |
| :--- | :--- |
| **Framework Utama** | [React Native](https://reactnative.dev/) `0.88.1` |
| **Platform Runtime** | [Expo SDK](https://expo.dev/) `~58.0.26` |
| **Bahasa Pemrograman** | [TypeScript](https://www.typescriptlang.org/) `~6.0.3` |
| **Basis Data Lokal** | [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/) `~58.0.18` |
| **Notifikasi Lokal** | [expo-notifications](https://docs.expo.dev/versions/latest/sdk/notifications/) `~58.1.9` |
| **Ikonografi** | [@expo/vector-icons (Feather)](https://icons.expo.fyi/) |
| **Styling & Tema** | React Native StyleSheet dengan Custom Dynamic Theme Engine |

---

## 📂 Struktur Direktori

```text
miawdo/
├── assets/                  # Aset gambar, ikon adaptif, dan splash screen
│   ├── icon.png             # Ikon resolusi tinggi resmi MiawDo
│   ├── splash-icon.png      # Ikon transisi splash
│   └── android-icon-*.png   # Ikon adaptif Android
├── src/
│   ├── components/          # Komponen UI modular
│   │   ├── cat/             # Grafis bertema kucing (PawPrintIcon, Maskot, Badge)
│   │   ├── loading/         # AnimatedAppLoader (Animasi pembuka aplikasi)
│   │   ├── nav/             # BottomTabBar kustom
│   │   └── tasks/           # TaskCard, TaskFormModal, CategoryManager, Snooze
│   ├── context/             # AppContext (Penyedia state global & aksi aplikasi)
│   ├── db/                  # Inisialisasi SQLite database, tabel, migrasi, dan seed
│   ├── engine/              # Logika tanggal, pengulangan (recurrence), status, notifikasi
│   ├── screens/             # Layar utama (Dashboard, MyTasks, Calendar, Statistics)
│   ├── theme/               # Palet tema Sunlit Catnap & Midnight Purr
│   └── types/               # Definisi tipe TypeScript
├── App.tsx                  # Root entrypoint aplikasi
├── app.json                 # Konfigurasi Expo & metadata aplikasi
├── package.json             # Manifest dependensi & skrip proyek
├── LICENSE                  # Lisensi Open Source (MIT)
└── README.md                # Dokumentasi proyek
```

---

## 🚀 Panduan Memulai (Getting Started)

### Prasyarat
Pastikan komputer Anda telah terinstal:
- [Node.js](https://nodejs.org/) (versi 18 LTS atau lebih baru)
- npm / yarn / bun
- Aplikasi **Expo Go** di ponsel (Android/iOS) atau **Android Studio** (untuk emulator / run native)

### Langkah Instalasi

1. **Clone repositori**:
   ```bash
   git clone https://github.com/Yenvys/MiawDo.git
   cd MiawDo
   ```

2. **Instal dependensi**:
   ```bash
   npm install
   ```

3. **Jalankan Development Server**:
   ```bash
   npx expo start
   ```
   - Scan **QR Code** yang muncul menggunakan aplikasi **Expo Go** pada ponsel Android Anda (atau kamera bawaan di iOS).
   - Tekan `a` untuk membuka di Android Emulator yang sedang berjalan.

4. **Menjalankan Langsung Mode Android Native**:
   ```bash
   npm run android
   ```

---

## 📦 Mengunduh File APK Langsung

File binary aplikasi Android siap pasang (**`MiawDo.apk`**) tersedia langsung di repositori ini. Anda dapat mengunduh dan memasangnya langsung ke perangkat Android tanpa perlu proses kompilasi lokal:

- Unduh file: [`MiawDo.apk`](./MiawDo.apk)

---

## 📜 Lisensi & Hak Cipta

Proyek ini dibuat dan dikembangkan oleh **Yenvys**.

Didistribusikan di bawah lisensi resmi **MIT License**. Silakan baca file [LICENSE](LICENSE) untuk informasi lebih lanjut mengenai hak penggunaan dan distribusi.

```text
Copyright (c) 2026 Yenvys. All rights reserved.
```

---

<div align="center">
  <b>Dibuat dengan ❤️ oleh Yenvys</b><br>
  <i>"Miaw! Semua tugas hari ini selesai."</i>
</div>
