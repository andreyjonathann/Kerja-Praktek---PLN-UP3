# Dokumentasi Seeder Target Tahunan (KPI)

## Mengapa kita butuh seeder ini?
Database aplikasi ini membutuhkan 21 indikator target tahunan agar dashboard (SAIDI, SAIFI, ENS, Niaga, Pemasaran, dll) dapat beroperasi dan menghitung pencapaian dengan benar. Jika target kosong, grafik dan kartu KPI akan menampilkan peringatan.

## Kapan harus dijalankan?
- Saat Anda baru pertama kali melakukan clone project ke mesin lokal.
- Saat ada penambahan indikator KPI baru di Google Sheet `MASTER_DATA`.
- Jika database Anda terhapus/di-reset.

## Cara Menjalankan
Buka terminal di dalam folder `Backend/` dan jalankan perintah:

```bash
php artisan db:seed --class=TargetTahunanSeeder
```

## Apakah Aman Dijalankan Berkali-kali? (Idempotent)
**SANGAT AMAN.** 
Seeder ini menggunakan logika `TargetTahunan::updateOrCreate()` berdasarkan `bidang`, `indikator`, dan `tahun`.
Artinya:
- Jika target belum ada di database, seeder akan **membuatnya**.
- Jika target sudah ada (meskipun Anda sudah pernah mengubah nilainya secara manual lewat Panel Kelola Target), seeder **TIDAK AKAN MENDUPLIKASI** baris tersebut. Seeder hanya akan memperbarui strukturnya dengan aman.

*(Catatan: Auto-run seeder dari API secara diam-diam telah dinonaktifkan untuk mencegah seeder tereksekusi tanpa sepengetahuan Anda. Seeder kini murni dijalankan secara manual oleh developer).*
