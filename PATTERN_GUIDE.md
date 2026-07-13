# PATTERN_GUIDE.md — Standar UI/UX Modul Bidang Jaringan (SIGAP)

**Status:** Wajib dibaca dan diikuti untuk SEMUA modul baru/edit di Bidang Jaringan.
**Acuan baseline:** SAIDI (`KinerjaDetailModal.jsx`) — diverifikasi audit memiliki skor konsistensi tertinggi.
**Berlaku untuk:** SAIDI, SAIFI, ENS, Gangguan TM, Gangguan Switching, Rating Negatif, RPT G, SRDAG, MVOD, MTTR Siaga 1.

## 1. Prinsip Dasar
- Setiap modul KPI Jaringan harus punya satu komponen modal detail: `<NamaModul>DetailModal.jsx`.
- Modal tidak boleh dirender inline manual di `index.jsx` (seperti kasus ENS) — harus diekstrak jadi komponen sendiri.
- Modul baru wajib meniru struktur props, style tombol, dan alur konfirmasi dari SAIDI, kecuali ada alasan teknis kuat yang didiskusikan dan disetujui dulu.
- Perubahan pada modul yang sudah stabil (SAIDI, SAIFI) untuk mengejar "konsistensi" tetap harus lewat alur diagnosis → approval, bukan otomatis.

## 2. Struktur Props Baku
Semua `<NamaModul>DetailModal.jsx` wajib menerima props berikut (nama harus persis sama):

| Prop | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `open` | boolean | Ya | Kontrol visibility modal |
| `onOpenChange` | function | Ya | Setter untuk open |
| `rowData` | object | Ya | Data baris yang diklik, termasuk `id` jika berupa data tunggal (bukan hasil agregasi) |
| `year` | number | Ya | Tahun aktif dari filter dashboard |
| `onSuccess` | function | Ya | Callback dipanggil setelah edit/hapus berhasil, biasanya fetchData dari parent |

**Catatan migrasi:** SAIDI/SAIFI saat ini pakai `onDeleteSuccess` dan `titlePrefix/isCumulative` — ini boleh dipertahankan apa adanya (jangan diubah tanpa approval eksplisit), tapi modul baru ke depan pakai nama `onSuccess` yang lebih generik agar seragam dengan RPT G.

Field `id` di `rowData` wajib hanya diisi backend jika data tersebut adalah 1 record tunggal (bukan hasil agregasi multi-baris). Pola pengecekan di backend:
```php
'id' => $monthData->count() == 1 ? $monthData->first()->id : null,
```

## 3. Lokasi Form Edit
- **Pilihan resmi:** Inline di dalam modal (pola RPT G), bukan halaman terpisah (pola lama SAIDI/SAIFI).
- **Alasan:** sudah menjadi keputusan sebelumnya bahwa "Edit functionality: inline on same page, matching SAIDI pattern" — namun karena SAIDI aslinya pakai halaman terpisah dan RPT G sudah inline dan lebih ringkas untuk user, RPT G dijadikan acuan lokasi form ke depan, sementara SAIDI/SAIFI/Rating Negatif yang sudah pakai halaman terpisah tidak perlu diubah kecuali direncanakan sesi refactor khusus.
- **Jika ragu antar dua acuan (SAIDI vs RPT G) untuk modul baru, defaultnya:** inline di dalam modal, karena lebih sedikit navigasi dan sudah terbukti jalan di RPT G.

## 4. Style Tombol (Baku)
| Tombol | Warna | Style |
|---|---|---|
| Edit | Biru `#2563eb` | Outline, icon Edit2 (lucide-react), ukuran icon 16 |
| Hapus | Merah `#dc2626` | Outline, icon Trash2 (lucide-react), ukuran icon 16 |

- Tidak dipakai lagi untuk modul baru: warna kustom per-modul (ungu/oranye di Gangguan Switching, abu-abu/pink di Rating Negatif). Warna khusus hanya boleh dipakai untuk membedakan jenis data (misalnya Switching vs Trafo), bukan untuk tombol aksi Edit/Hapus itu sendiri.
- Tombol Edit dan Hapus disembunyikan (bukan disabled) jika:
  - `user.role === 'viewer'`, atau
  - `rowData.id` tidak ada (berarti data agregasi/kosong)

## 5. Konfirmasi Hapus
- **Standar baku:** Custom State UI di dalam modal (pola SAIDI/SAIFI/Rating Negatif) — bukan `window.confirm()`, dan bukan SweetAlert2.
- **Catatan:** RPT G saat ini pakai SweetAlert2 — ini penyimpangan yang tercatat, boleh dibiarkan jalan dulu (karena sudah berfungsi), tapi jangan dijadikan acuan untuk modul baru. Migrasi RPT G ke custom state UI dilakukan belakangan sebagai item cleanup terpisah, dengan approval eksplisit.

## 6. Alur Paska-Submit
Standar baku:
1. Tampilkan notifikasi sukses/gagal (boleh custom toast HTML manual seperti SAIDI, tidak wajib identik pixel-perfect).
2. Panggil `onSuccess()` / `fetchData()` dari parent agar tabel & grafik dashboard auto-refresh tanpa perlu reload manual oleh user.
3. Tutup modal (`onOpenChange(false)`) setelah proses selesai.

## 7. Validasi Input
- Validasi client-side minimal: field wajib tidak boleh kosong, angka tidak boleh negatif (kecuali memang KPI yang secara definisi bisa negatif, misal Rating Negatif — cek dulu domain masing-masing KPI).
- Tampilkan pesan error di bawah field terkait, bukan lewat `alert()`.
- Validasi format angka mengikuti satuan KPI masing-masing (menit, persen, Kali) — jangan hardcode asumsi satuan dari modul lain.

## 8. Checklist Wajib Sebelum Modul Dianggap "Selesai"
- [ ] Modal detail diekstrak jadi komponen terpisah (`<NamaModul>DetailModal.jsx`)
- [ ] Props sesuai tabel di Bagian 2
- [ ] Backend `dashboard()` mengembalikan `id` hanya untuk data tunggal, `null` untuk agregasi
- [ ] Tombol Edit/Hapus pakai warna & icon baku (Bagian 4)
- [ ] Tombol disembunyikan sesuai role & ketersediaan `id`
- [ ] Konfirmasi hapus pakai custom state UI (bukan `confirm()`/SweetAlert2) — kecuali modul lama yang belum dimigrasi
- [ ] Setelah submit sukses, dashboard/grafik auto-refresh via `onSuccess`
- [ ] Validasi input sesuai satuan KPI masing-masing

## 9. Status Migrasi per Modul (per audit terakhir)
| Modul | Status | Prioritas Perbaikan |
|---|---|---|
| SAIDI | Baseline, tidak disentuh | - |
| SAIFI | Sesuai baseline, tidak disentuh | - |
| Rating Negatif | 80% sesuai, warna tombol beda | Rendah |
| RPT G | Fungsional lengkap, tapi pakai SweetAlert2 + form inline | Sedang (migrasi konfirmasi hapus) |
| Gangguan TM | Tidak ada fitur Hapus | Sedang |
| Gangguan Switching | Tidak ada fitur Hapus, warna tombol tidak baku | Sedang |
| ENS | Modal tidak diekstrak, tanpa tombol aksi | Tinggi |
| SRDAG | Tidak ada modal sama sekali | Tinggi |
| MVOD | Tidak ada modal sama sekali | Tinggi |
| MTTR Siaga 1 | Tidak ada modal sama sekali | Tinggi |

*Urutan pengerjaan disarankan: selesaikan dulu modul yang "Tinggi" (SRDAG, MVOD, MTTR, ENS) karena belum punya fungsi apa pun, baru masuk ke "Sedang" (Gangguan TM, Gangguan Switching, RPT G cleanup).*
