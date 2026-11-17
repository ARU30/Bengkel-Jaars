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
   - Ubah Nama Bengkel, Tagline, Nomor WhatsApp, Alamat, dan Pesan Kaki Struk sesuai bengkel Anda.

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
├── css/
│   └── style.css        # Gaya cetak struk thermal, animasi, & layout
├── js/
│   ├── default-data.js  # Database master tarif awal (Tambal, Bongkar, Cuci)
│   └── app.js           # Mesin kalkulasi harga, keranjang, localStorage, & WhatsApp
├── vercel.json          # Konfigurasi optimasi server & keamanan Vercel
├── package.json         # Metadata proyek
└── README.md            # Dokumentasi & panduan penggunaan
```
