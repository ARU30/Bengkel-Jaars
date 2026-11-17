# 🛞 Kalkulator & Kasir Bengkel Ban & Cuci Kendaraan

Aplikasi kalkulasi harga, kasir (POS), dan manajemen tarif mandiri berbasis web yang dirancang khusus untuk operasional **bengkel tambal ban**, **bongkar pasang ban/roda**, dan **cuci kendaraan mobil/motor**.

Aplikasi ini dapat langsung dijalankan di browser tanpa perlu server, serta **100% siap dideploy langsung ke [Vercel](https://vercel.com)**.

---

## ✨ Fitur Utama

1. **🧮 Kalkulator Cepat & Kasir POS:**
   - **Pilihan Jenis Kendaraan (1-Klik):** Beralih antara tarif **Sepeda Motor** dan **Mobil**. Harga otomatis menyesuaikan jenis kendaraan.
   - **Kategori Layanan Lengkap:**
     - 🔧 **Tambal Ban:** Tubeless cacing, tip-top dingin/payung, press bakar/kompor, tambal ban dalam, cairan antibocor.
     - ⚙️ **Bongkar Pasang Ban & Roda:** Bongkar pasang ban standar/sport/moge/mobil ring 13-20+, balancing roda, isi nitrogen, tambah angin, penggantian pentil karet/besi.
     - 🧼 **Cuci Kendaraan:** Cuci motor reguler/salju, cuci motor besar/detailing, cuci mobil salju, cuci hidrolik kolong (kolong & bodi), cuci mesin (engine bay), poles wax.
     - 📦 **Sparepart & Tambahan:** Ban dalam baru berbagai ukuran, pentil tubeless, botol semir ban, parfum mobil.
   - **Item Khusus / Tambahan Bebas (On-the-fly):** Kasir dapat menambahkan item/jasa dadakan langsung ke nota tanpa harus masuk ke database tarif.
   - **Kalkulator Kembalian Cepat:** Tombol pecahan uang pas, Rp 20.000, Rp 50.000, Rp 100.000, serta deteksi otomatis kurang bayar.
   - **Metode Pembayaran:** Tunai (Cash), QRIS, Transfer Bank, dan Bon (Tempo).

2. **⚙️ Input & Manajemen Tarif Mandiri (Custom Pricing):**
   - **Ubah Harga Suka-Suka:** Anda dapat mengubah nominal tarif motor maupun mobil untuk setiap layanan secara mandiri kapan saja.
   - **Tambah Layanan Baru:** Buat layanan atau produk baru sesuai keunikan bengkel Anda.
   - **Hapus Layanan:** Hapus layanan yang tidak disediakan.
   - **Cadangkan & Pulihkan (Backup & Restore JSON):** Simpan seluruh data tarif dan transaksi ke file JSON untuk dipindahkan ke HP atau laptop kasir lain dengan mudah.
   - **Reset ke Default:** Kembalikan ke tarif standar kapan saja jika diperlukan.

3. **🧾 Cetak Struk & WhatsApp:**
   - **Cetak Struk Thermal:** Kompatibel dengan printer thermal kasir bluetooth/USB ukuran 58mm atau 80mm serta kertas printer biasa.
   - **Kirim Nota via WhatsApp (1-Klik):** Mengirimkan rincian nota rapi berformat teks lengkap dengan emoji ke nomor WhatsApp pelanggan.

4. **📊 Laporan & Riwayat Omset:**
   - Rekap total omset harian, mingguan, bulanan, jumlah transaksi, dan rata-rata penjualan.
   - Riwayat transaksi tersimpan otomatis di penyimpanan lokal browser (`localStorage`).

5. **🏢 Pengaturan Profil Bengkel:**
   - Ubah Nama Bengkel, Tagline, Nomor WhatsApp, Email Resmi, Alamat, Jam Operasional, dan Pesan Kaki Struk sesuai bengkel Anda.

6. **ℹ️ Menu Informasi Bengkel (Sistem Pengguna / User):**
   - Tampilan menu informasi lengkap yang dapat diakses langsung oleh kasir maupun pelanggan tanpa perlu login Admin.
   - Menyajikan informasi **Kontak & WhatsApp** (dengan tombol 1-klik chat WA & panggilan telepon), **Alamat Lengkap** (dengan tombol buka rute di Google Maps), **Email Resmi** (dengan tombol kirim email), serta **Jam Operasional** dengan indikator status Buka/Tutup secara *real-time*.
   - Tombol salin 1-klik untuk nomor telepon, alamat fisik, dan alamat email ke clipboard.

7. **🔐 Keamanan Akun Admin Berbasis Email & Password:**
   - Akses menu penting (**Kelola Tarif**, **Laporan & Riwayat Keuangan**, serta **Profil Bengkel**) diproteksi dengan otentikasi **Alamat Email dan Kata Sandi** (bukan sekadar PIN angka biasa).
   - Akun default awal: Email: `admin@jaarsgarage.com`, Password: `admin123`.
   - Email login dan kata sandi dapat diganti sewaktu-waktu di tab Profil Bengkel.
   - Dilengkapi tombol tampil/sembunyikan password (toggle view) demi kemudahan dan keamanan pengetikan.

8. **📦 Katalog Ban Motor, Ban Mobil & Oli Kendaraan (User & Admin):**
   - **Tampilan Pengguna (Publik / User):**
     - Menu tab khusus **"Katalog Ban & Oli"** yang bebas diakses siapa saja tanpa perlu login.
     - **3 Kategori Utama:** Ban Sepeda Motor, Ban Mobil, dan Oli Kendaraan (Motor & Mobil).
     - **Filter & Pencarian Instan:** Filter cepat per kategori, chip filter merek (Michelin, Pirelli, IRC, Shell, Motul, Pertamina, Castrol, dll.), serta kolom pencarian langsung berdasarkan nama, ukuran, atau spesifikasi (misal: `90/80`, `10W-40`, `185/65`).
     - **Informasi Produk Lengkap:** Menampilkan foto produk berkualitas, badge merek, ukuran/spesifikasi teknis, harga jual resmi, label stok (Tersedia / Stok Terbatas / Habis), serta keterangan produk.
     - **Tanya via WhatsApp (1-Klik):** Pelanggan atau staf dapat langsung bertanya ketersediaan ban atau oli ke WhatsApp bengkel dengan template pesan otomatis yang sudah memuat nama produk, spesifikasi, dan harganya.
     - **🛒 Integrasi Langsung ke Kasir POS:** Tombol *"+ Kasir"* pada setiap kartu katalog untuk memasukkan produk ban/oli langsung ke dalam nota transaksi aktif di mesin kasir tanpa perlu input manual.
   - **Manajemen Katalog oleh Admin (Mode Admin):**
     - Muncul banner kontrol admin ketika login sebagai Admin bengkel.
     - **Tambah & Edit Produk:** Admin dapat menambah merek baru, nama tipe, kategori, spesifikasi teknis, harga jual, dan status stok.
     - **Upload Foto Produk Mandiri:** Admin dapat mengunggah file foto dari galeri HP/laptop (dengan kompresi otomatis berbasis Canvas ~20-40KB sehingga hemat memori browser dan cepat) atau memasukkan URL gambar eksternal.
     - **Fallback Gambar Cerdas:** Dilengkapi generator ilustrasi SVG dinamis per kategori produk jika tidak mengunggah foto fisik.
     - **Hapus & Reset Master:** Admin dapat menghapus produk satuan atau mereset ke katalog default 17 produk rekomendasi kapan saja.
     - **Backup & Restore:** Data katalog ban dan oli otomatis ikut tersimpan saat ekspor/impor file JSON bengkel.

9. **🌐 Sinkronisasi Cloud Antar-Perangkat Otomatis (Vercel & Multi-Device Auto-Sync):**
   - **Otomatis Berubah di Semua Perangkat:** Saat Admin mengubah tarif layanan, menambah produk katalog (seperti ban IRC SS 570F), atau mengedit profil bengkel di laptop, sistem secara otomatis mengirimkan konfigurasi ke Cloud Vercel (`/api/sync`) atau database cloud.
   - **Perangkat Lain Tidak Perlu Mengulang Konfigurasi:** Saat HP kasir, tablet, atau laptop lain membuka aplikasi di Vercel, sistem otomatis menarik data terbaru di latar belakang (*background sync*) dan memperbarui penyimpanan lokal browser.
   - **📲 Bagikan Link via WhatsApp (1-Klik):** Admin dapat menyalin atau mengirimkan tautan sinkronisasi instan via WhatsApp ke HP kasir. Kasir cukup mengklik tautan tersebut sekali saja di HP mereka untuk langsung menerapkan seluruh tarif, produk katalog, dan profil tanpa perlu login admin.
   - **📷 Scan QR Code Sinkronisasi:** Kasir cukup mengarahkan kamera HP ke layar laptop admin untuk scan QR code sinkronisasi instan.
   - **📥 Unduh Master default-data.js:** Admin dapat mengunduh berkas `default-data.js` yang sudah diperbarui dengan data riil bengkel saat ini. Cukup timpa berkas ini di repositori dan push ke GitHub agar Vercel secara permanen menjadikan data tersebut sebagai bawaan resmi untuk semua pengunjung.
   - **Dukungan Vercel KV & Firebase:** Mendukung Vercel KV / Upstash Redis bawaan dashboard Vercel, maupun Firebase Realtime Database gratis.

---

## 🚀 Cara Menjalankan Langsung di Komputer Anda

Anda **tidak memerlukan Node.js atau instalasi apapun** untuk langsung menggunakan aplikasi ini:
1. Buka folder proyek:
   `C:\Users\jaban\.gemini\antigravity\scratch\bengkel-calculator\`
2. Klik dua kali pada file **`index.html`**.
3. Aplikasi akan langsung terbuka di browser Anda (Chrome, Edge, Firefox, dll) dan siap digunakan!

---

## 🌐 Cara Deploy ke Vercel (Gratis & Cepat)

Aplikasi ini sudah dilengkapi file konfigurasi `vercel.json` dan bersifat *static web app*, sehingga proses deploy sangat mudah:

### Cara 1: Deploy Lewat GitHub (Rekomendasi)
1. Unggah folder proyek ini ke repositori **GitHub** Anda.
2. Buka [Vercel Dashboard](https://vercel.com/dashboard) dan klik **"Add New"** > **"Project"**.
3. Pilih repositori GitHub tadi.
4. Klik tombol **"Deploy"** (biarkan pengaturan build default karena aplikasi ini murni web statis).
5. Dalam 5 detik, web aplikasi bengkel Anda sudah aktif online dengan tautan HTTPS gratis (contoh: `bengkel-anda.vercel.app`) dan dapat dibuka dari HP kasir manapun!

### Cara 2: Deploy Menggunakan Vercel CLI (Jika memiliki Node.js / Vercel CLI)
Buka terminal di folder proyek ini dan jalankan:
```bash
vercel deploy --prod
```

---

## 📁 Struktur File

```
bengkel-calculator/
├── index.html           # Tampilan utama antarmuka POS & Kalkulator
├── api/
│   └── sync.js          # Endpoint Serverless Vercel: Sinkronisasi Cloud Antar-Perangkat
├── css/
│   └── style.css        # Gaya cetak struk thermal, animasi, & layout
├── js/
│   ├── default-data.js  # Database master tarif awal (Tambal, Bongkar, Cuci, Ban & Oli)
│   └── app.js           # Mesin kalkulasi harga, keranjang, Cloud Sync, & WhatsApp
├── vercel.json          # Konfigurasi optimasi server & keamanan Vercel
├── package.json         # Metadata proyek
└── README.md            # Dokumentasi & panduan penggunaan
```
