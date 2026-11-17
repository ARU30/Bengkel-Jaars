/**
 * Data Master Default untuk Kalkulator Bengkel Ban & Cuci Kendaraan
 * Disimpan ke localStorage agar pengguna bisa mengubah/menambah/menghapus tarif secara mandiri.
 */

const DEFAULT_PROFILE = {
    name: "Bengkel Ban & Cuci Kendaraaan (Jaars Garage)",
    tagline: "Layanan Tambal Ban, Bongkar Pasang & Cuci Mobil/Motor",
    address: "Jl. Tawang Sakti No.46, Tawangrejo, Kec. Kartoharjo, Kota Madiun, Jawa Timur 63113",
    phone: "085156696378",
    email: "jaarsgarage.madiun@gmail.com",
    operatingHours: "Senin - Minggu: 08.00 - 21.00 WIB",
    receiptFooter: "Terima kasih atas kunjungan Anda. Utamakan keselamatan berkendara!",
    bankName: "Bank BRI",
    bankAccount: "0062-01-001234-53-0",
    bankHolder: "Jaars Garage",
    qrisImage: "img/qris.jpeg"
};

const DEFAULT_ADMIN = {
    email: "admin@jaarsgarage.com",
    password: "admin123"
};

const DEFAULT_CATEGORIES = [
    { id: "tambal", name: "Tambal Ban", icon: "wrench", color: "amber" },
    { id: "bongkar", name: "Bongkar Pasang Ban", icon: "disc", color: "blue" },
    { id: "cuci", name: "Cuci Kendaraan", icon: "sparkles", color: "cyan" },
    { id: "sparepart", name: "Sparepart & Tambahan", icon: "package", color: "emerald" }
];

const DEFAULT_SERVICES = [
    // --- KATEGORI: TAMBAL BAN ---
    {
        id: "tb-01",
        categoryId: "tambal",
        name: "Tambal Tubeless (Tusuk / Cacing)",
        desc: "Tambal metode cacing cepat untuk ban tubeless",
        unit: "per lubang",
        priceMotor: 10000,
        priceMobil: 25000,
        applicable: "both"
    },
    {
        id: "tb-02",
        categoryId: "tambal",
        name: "Tambal Tip-Top / Press Dingin (Payung)",
        desc: "Tambal dari bagian dalam, aman dan tidak merusak kawat ban",
        unit: "per titik",
        priceMotor: 25000,
        priceMobil: 45000,
        applicable: "both"
    },
    {
        id: "tb-03",
        categoryId: "tambal",
        name: "Tambal Press Bakar / Kompor",
        desc: "Tambal vulkanisir panas untuk ban dalam / luka samping",
        unit: "per lubang",
        priceMotor: 15000,
        priceMobil: 35000,
        applicable: "both"
    },
    {
        id: "tb-04",
        categoryId: "tambal",
        name: "Tambal Ban Dalam Biasa",
        desc: "Tambal karet bakar / lem khusus ban dalam",
        unit: "per lubang",
        priceMotor: 15000,
        priceMobil: 30000,
        applicable: "both"
    },
    {
        id: "tb-05",
        categoryId: "tambal",
        name: "Cairan Ban Tubeless Antibocor",
        desc: "Isi cairan pelindung antibocor otomatis",
        unit: "per botol",
        priceMotor: 35000,
        priceMobil: 50000,
        applicable: "both"
    },

    // --- KATEGORI: BONGKAR PASANG BAN ---
    {
        id: "bp-01",
        categoryId: "bongkar",
        name: "Jasa Bongkar Pasang Ban Luar (Motor Standar)",
        desc: "Bongkar pasang ban bebek / matic ukuran standar",
        unit: "per roda",
        priceMotor: 15000,
        priceMobil: 0,
        applicable: "motor"
    },
    {
        id: "bp-02",
        categoryId: "bongkar",
        name: "Jasa Bongkar Pasang Ban Luar (Motor Besar / Sport / NMAX)",
        desc: "Bongkar pasang ban matic besar, moge, ring 13-17 lebar",
        unit: "per roda",
        priceMotor: 25000,
        priceMobil: 0,
        applicable: "motor"
    },
    {
        id: "bp-03",
        categoryId: "bongkar",
        name: "Jasa Bongkar Pasang Ban Mobil (Ring 13 - 16)",
        desc: "Bongkar pasang ban velg mobil standar / MPV / City Car",
        unit: "per roda",
        priceMotor: 0,
        priceMobil: 35000,
        applicable: "mobil"
    },
    {
        id: "bp-04",
        categoryId: "bongkar",
        name: "Jasa Bongkar Pasang Ban Mobil (Ring 17 - 20+)",
        desc: "Bongkar pasang ban SUV / Velg Racing / Profil Tipis",
        unit: "per roda",
        priceMotor: 0,
        priceMobil: 50000,
        applicable: "mobil"
    },
    {
        id: "bp-05",
        categoryId: "bongkar",
        name: "Balancing Roda Mobil",
        desc: "Penyeimbangan putaran roda mobil dengan timah penyeimbang",
        unit: "per roda",
        priceMotor: 0,
        priceMobil: 30000,
        applicable: "mobil"
    },
    {
        id: "bp-06",
        categoryId: "bongkar",
        name: "Isi Angin Nitrogen (Ban Baru / Kuras)",
        desc: "Pengisian penuh gas nitrogen murni untuk ban",
        unit: "per ban",
        priceMotor: 5000,
        priceMobil: 10000,
        applicable: "both"
    },
    {
        id: "bp-07",
        categoryId: "bongkar",
        name: "Tambah Angin Nitrogen",
        desc: "Tambah tekanan gas nitrogen",
        unit: "per ban",
        priceMotor: 3000,
        priceMobil: 5000,
        applicable: "both"
    },
    {
        id: "bp-08",
        categoryId: "bongkar",
        name: "Isi / Tambah Angin Biasa (Kompresor)",
        desc: "Pengisian angin kompresor biasa",
        unit: "per ban",
        priceMotor: 2000,
        priceMobil: 5000,
        applicable: "both"
    },

    // --- KATEGORI: CUCI KENDARAAN ---
    {
        id: "cc-01",
        categoryId: "cuci",
        name: "Cuci Motor Reguler (Bebek / Matic Kecil)",
        desc: "Cuci bodi bersih + semir ban",
        unit: "per motor",
        priceMotor: 15000,
        priceMobil: 0,
        applicable: "motor"
    },
    {
        id: "cc-02",
        categoryId: "cuci",
        name: "Cuci Motor Salju / Snow Wash (Standar)",
        desc: "Cuci bodi shampoo salju, sela-sela roda & semir ban",
        unit: "per motor",
        priceMotor: 20000,
        priceMobil: 0,
        applicable: "motor"
    },
    {
        id: "cc-03",
        categoryId: "cuci",
        name: "Cuci Motor Besar / Sport / Matic Bongsor (NMAX/PCX/Ninja)",
        desc: "Cuci snow wash untuk motor bodi bongsor & sport",
        unit: "per motor",
        priceMotor: 25000,
        priceMobil: 0,
        applicable: "motor"
    },
    {
        id: "cc-04",
        categoryId: "cuci",
        name: "Cuci Motor Detailing & Semir Rantai",
        desc: "Cuci detail kolong, mesin, pembersih rantai + lube chain",
        unit: "per motor",
        priceMotor: 40000,
        priceMobil: 0,
        applicable: "motor"
    },
    {
        id: "cc-05",
        categoryId: "cuci",
        name: "Cuci Mobil Standar (Bodi + Kaca)",
        desc: "Cuci bodi luar shampoo salju + semir ban",
        unit: "per mobil",
        priceMotor: 0,
        priceMobil: 35000,
        applicable: "mobil"
    },
    {
        id: "cc-06",
        categoryId: "cuci",
        name: "Cuci Mobil Salju + Vacuum Interior (City Car / Sedan)",
        desc: "Cuci bodi salju, vacuum jok & karpet, pembersih kaca",
        unit: "per mobil",
        priceMotor: 0,
        priceMobil: 45000,
        applicable: "mobil"
    },
    {
        id: "cc-07",
        categoryId: "cuci",
        name: "Cuci Mobil Salju + Hidrolik Kolong (MPV / SUV / Mobil Besar)",
        desc: "Cuci hidrolik bodi luar, kolong roda, sasis bawah + vacuum",
        unit: "per mobil",
        priceMotor: 0,
        priceMobil: 55000,
        applicable: "mobil"
    },
    {
        id: "cc-08",
        categoryId: "cuci",
        name: "Cuci Mesin Mobil (Engine Bay Wash)",
        desc: "Pembersihan ruang mesin dari kerak oli dan debu aman",
        unit: "per mobil",
        priceMotor: 0,
        priceMobil: 50000,
        applicable: "mobil"
    },
    {
        id: "cc-09",
        categoryId: "cuci",
        name: "Cuci Mobil Komplit + Wax Pengkilap Bodi",
        desc: "Cuci hidrolik kolong, vacuum, poles bodi wax instan & parfum",
        unit: "per mobil",
        priceMotor: 0,
        priceMobil: 85000,
        applicable: "mobil"
    },

    // --- KATEGORI: SPAREPART & TAMBAHAN ---
    {
        id: "sp-01",
        categoryId: "sparepart",
        name: "Pentil Tubeless Karet Pendek",
        desc: "Pentil karet standar tubeless",
        unit: "pcs",
        priceMotor: 15000,
        priceMobil: 15000,
        applicable: "both"
    },
    {
        id: "sp-02",
        categoryId: "sparepart",
        name: "Pentil Tubeless Besi / Kuningan Racing",
        desc: "Pentil tubeless anti karat dan lebih awet",
        unit: "pcs",
        priceMotor: 25000,
        priceMobil: 30000,
        applicable: "both"
    },
    {
        id: "sp-03",
        categoryId: "sparepart",
        name: "Ban Dalam Motor Ring 14 (Matic)",
        desc: "Ban dalam kualitas original untuk matic",
        unit: "pcs",
        priceMotor: 35000,
        priceMobil: 0,
        applicable: "motor"
    },
    {
        id: "sp-04",
        categoryId: "sparepart",
        name: "Ban Dalam Motor Ring 17 (Bebek / Sport)",
        desc: "Ban dalam ukuran ring 17 standar",
        unit: "pcs",
        priceMotor: 40000,
        priceMobil: 0,
        applicable: "motor"
    },
    {
        id: "sp-05",
        categoryId: "sparepart",
        name: "Semir Ban Kilap (Botol 250ml)",
        desc: "Cairan silikon pengkilap ban tahan lama",
        unit: "botol",
        priceMotor: 20000,
        priceMobil: 20000,
        applicable: "both"
    },
    {
        id: "sp-06",
        categoryId: "sparepart",
        name: "Parfum Mobil Gantung / Semprot",
        desc: "Pewangi aroma mobil segar tahan lama",
        unit: "pcs",
        priceMotor: 0,
        priceMobil: 15000,
        applicable: "mobil"
    }
];

// --- MASTER DATA DEFAULT KATALOG BAN & OLI KENDARAAN ---
const DEFAULT_CATALOG = [
    // --- BAN MOTOR ---
    {
        id: "cat-bm-01",
        category: "ban-motor",
        brand: "Michelin",
        name: "Pilot Street 2 Tubeless",
        spec: "90/80-14 Matic",
        price: 320000,
        stockStatus: "ready",
        image: "https://images.unsplash.com/photo-1578844251758-2f71da64c96f?w=500&auto=format&fit=crop&q=80",
        desc: "Daya cengkeram optimal di jalan basah dan kering, alur pembuangan air maksimal."
    },
    {
        id: "cat-bm-02",
        category: "ban-motor",
        brand: "IRC",
        name: "Enviro NR91 Tubeless",
        spec: "80/90-14 Standar Matic",
        price: 215000,
        stockStatus: "ready",
        image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=500&auto=format&fit=crop&q=80",
        desc: "Ban standar pabrikan Honda & Yamaha, hemat bahan bakar dan tahan lama."
    },
    {
        id: "cat-bm-03",
        category: "ban-motor",
        brand: "Maxxis",
        name: "Green Devil MA-G1 Tubeless",
        spec: "90/80-17 Bebek / Sport",
        price: 345000,
        stockStatus: "ready",
        image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=500&auto=format&fit=crop&q=80",
        desc: "Compound soft medium untuk cornering stabil dan manuver lincah."
    },
    {
        id: "cat-bm-04",
        category: "ban-motor",
        brand: "Pirelli",
        name: "Diablo Rosso Sport Tubeless",
        spec: "120/70-13 NMAX / Maxi",
        price: 475000,
        stockStatus: "ready",
        image: "https://images.unsplash.com/photo-1578844251758-2f71da64c96f?w=500&auto=format&fit=crop&q=80",
        desc: "Handling kelas balap untuk motor harian dan touring jarak jauh."
    },
    {
        id: "cat-bm-05",
        category: "ban-motor",
        brand: "FDR",
        name: "Flemmo Pro Tubeless",
        spec: "90/90-14 Matic Belakang",
        price: 225000,
        stockStatus: "limited",
        image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=500&auto=format&fit=crop&q=80",
        desc: "Karet berkualitas tinggi dari pabrikan Astra, awet untuk ojol & harian."
    },

    // --- BAN MOBIL ---
    {
        id: "cat-bl-01",
        category: "ban-mobil",
        brand: "Bridgestone",
        name: "Ecopia EP150",
        spec: "185/65 R15 (Avanza / Mobilio)",
        price: 785000,
        stockStatus: "ready",
        image: "https://images.unsplash.com/photo-1549492423-400259a2e574?w=500&auto=format&fit=crop&q=80",
        desc: "Ban ramah lingkungan, hemat konsumsi BBM, senyap dan nyaman di jalan tol."
    },
    {
        id: "cat-bl-02",
        category: "ban-mobil",
        brand: "Dunlop",
        name: "Enasave EC300+",
        spec: "175/65 R14 (Brio / Calya / Sigra)",
        price: 595000,
        stockStatus: "ready",
        image: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=500&auto=format&fit=crop&q=80",
        desc: "Ban OEM mobil LCGC dan city car, daya tahan tapak sangat awet."
    },
    {
        id: "cat-bl-03",
        category: "ban-mobil",
        brand: "GT Radial",
        name: "Champiro Ecotec",
        spec: "195/65 R15 (Innova / Ertiga)",
        price: 645000,
        stockStatus: "ready",
        image: "https://images.unsplash.com/photo-1549492423-400259a2e574?w=500&auto=format&fit=crop&q=80",
        desc: "Produk nasional berkualitas ekspor dengan daya cengkeram prima di jalan basah."
    },
    {
        id: "cat-bl-04",
        category: "ban-mobil",
        brand: "Michelin",
        name: "Primacy 4 ST",
        spec: "205/55 R16 (Rush / Terios / Civic)",
        price: 1260000,
        stockStatus: "limited",
        image: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=500&auto=format&fit=crop&q=80",
        desc: "Kenyamanan berkendara premium, pengereman terpendek dan kekedapan suara tinggi."
    },
    {
        id: "cat-bl-05",
        category: "ban-mobil",
        brand: "Hankook",
        name: "Kinergy Eco2 K435",
        spec: "185/70 R14 (Xenia / Kijang)",
        price: 560000,
        stockStatus: "ready",
        image: "https://images.unsplash.com/photo-1549492423-400259a2e574?w=500&auto=format&fit=crop&q=80",
        desc: "Teknologi senyawa silika baru untuk jarak pengereman lebih pendek di jalan aspal."
    },

    // --- OLI MOTOR ---
    {
        id: "cat-ol-01",
        category: "oli-motor",
        brand: "Motul",
        name: "Scooter LE 4T 10W-30",
        spec: "0.8 Liter Matic JASO MB",
        price: 68000,
        stockStatus: "ready",
        image: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=500&auto=format&fit=crop&q=80",
        desc: "Teknologi HC-Tech melindungi ruang mesin matic dari panas ekstrem dan gesekan."
    },
    {
        id: "cat-ol-02",
        category: "oli-motor",
        brand: "Pertamina",
        name: "Enduro Matic G 20W-40",
        spec: "0.8 Liter JASO MB API SL",
        price: 45000,
        stockStatus: "ready",
        image: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=500&auto=format&fit=crop&q=80",
        desc: "Oli matic terpercaya dengan wangi khas dan akselerasi tarikan mesin enteng."
    },
    {
        id: "cat-ol-03",
        category: "oli-motor",
        brand: "Shell",
        name: "Advance AX7 10W-40 Synthetic",
        spec: "1.0 Liter Bebek / Sport JASO MA2",
        price: 62000,
        stockStatus: "ready",
        image: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=500&auto=format&fit=crop&q=80",
        desc: "Teknologi Shell Active Cleansing menjaga mesin tetap bersih dari endapan kotoran."
    },
    {
        id: "cat-ol-04",
        category: "oli-motor",
        brand: "Yamalube",
        name: "Super Matic Oil 10W-40 Full Synth",
        spec: "1.0 Liter NMAX / Aerox / Maxi",
        price: 76000,
        stockStatus: "ready",
        image: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=500&auto=format&fit=crop&q=80",
        desc: "Diformulasikan khusus untuk mesin Blue Core Yamaha Maxi dengan performa maksimal."
    },

    // --- OLI MOBIL ---
    {
        id: "cat-ol-05",
        category: "oli-mobil",
        brand: "Shell",
        name: "Helix HX6 10W-40 Synthetic",
        spec: "4.0 Liter (Galon) Bensin/Diesel",
        price: 340000,
        stockStatus: "ready",
        image: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=500&auto=format&fit=crop&q=80",
        desc: "Membantu memperpanjang usia mesin mobil dan melindungi dari keausan berkendara harian."
    },
    {
        id: "cat-ol-06",
        category: "oli-mobil",
        brand: "Pertamina",
        name: "Fastron Gold 5W-30 Full Synthetic",
        spec: "4.0 Liter (Galon) API SN Dexos 1",
        price: 485000,
        stockStatus: "ready",
        image: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=500&auto=format&fit=crop&q=80",
        desc: "Oli mobil bensin performa tinggi, efisiensi bahan bakar dan perlindungan dingin."
    },
    {
        id: "cat-ol-07",
        category: "oli-mobil",
        brand: "Castrol",
        name: "Magnatec Stop-Start 10W-40",
        spec: "4.0 Liter Dualock Technology",
        price: 395000,
        stockStatus: "limited",
        image: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=500&auto=format&fit=crop&q=80",
        desc: "Molekul pintar melekat pada komponen mesin, melindungi 50% lebih baik saat macet."
    }
];
