# SIPD Mod by Thio Van

Custom features untuk [SIPD Penatausahaan](https://sipd.kemendagri.go.id/penatausahaan/) dalam bentuk Tampermonkey/Greasemonkey UserScript.

## Fitur

### Filter Periode Bulan

Memfilter data realisasi berdasarkan rentang bulan yang dipilih.

- **Lihat** — Menampilkan tabel realisasi per dokumen (46 kolom lengkap) dengan total otomatis
- **Download** — Export data ke file Excel (`.xlsx`) dengan format rapi
- **Bersihkan** — Menghapus tabel yang ditampilkan

### Filter Per Sub Kegiatan

Menampilkan realisasi yang dikelompokkan berdasarkan sub kegiatan.

- **Ambil Data** — Mengambil data realisasi dari Januari s/d bulan berjalan
- **Filter** — Dropdown Sub SKPD & Sub Kegiatan (diurutkan abjad, dinamis)
- **Lihat** — Tabel ringkasan: Nama Sub SKPD, Sub Kegiatan, Kode & Nama Rekening, Nilai Realisasi (dijumlahkan per kode rekening, diurutkan)
- **Download** — Export tabel ringkasan ke Excel
- **Bersihkan** — Menghapus tabel tanpa mengambil ulang data

## Instalasi

### Prasyarat

- Browser modern (Chrome, Firefox, Edge)
- Extension [Tampermonkey](https://www.tampermonkey.net/) atau [Greasemonkey](https://www.greasespot.net/)

### Cara Install

1. Install extension Tampermonkey di browser
2. Klik link berikut untuk install script:

   **[Install SIPD Mod](https://raw.githubusercontent.com/thiovan/sipd-mod/main/script.user.js)**

3. Tampermonkey akan menampilkan konfirmasi — klik **Install**
4. Buka halaman [SIPD Penatausahaan > Laporan > Realisasi](https://sipd.kemendagri.go.id/penatausahaan/penatausahaan/pengeluaran/laporan/realisasi)
5. Scroll ke bawah, card fitur tambahan akan muncul otomatis

### Auto-Update

Script akan otomatis update ketika ada versi baru di GitHub. Tampermonkey mengecek update secara berkala (default: setiap hari).

## Screenshot

![Overview](screenshot/Module%20Realisasi%20-%20Overview%20.png)

![Filter Periode Bulan](screenshot/Filter%20Periode%20Bulan.png)

![Filter Per Sub Kegiatan](screenshot/Filter%20Per%20Sub%20Kegiatan.png)

## Tech Stack

- **Vanilla JavaScript** — Tanpa framework, ringan & cepat
- **[SheetJS (xlsx)](https://sheetjs.com/)** — Export Excel dengan format & styling
- **MutationObserver + SPA Navigation** — Kompatibel dengan navigasi SPA SIPD

## Lisensi

MIT © [Thio Van](https://github.com/thiovan)
