/**
 * Data Master Default untuk Kalkulator Bengkel Ban & Cuci Kendaraan
 * Disimpan ke localStorage agar pengguna bisa mengubah/menambah/menghapus tarif secara mandiri.
 */

const DEFAULT_PROFILE = {
    name: "Bengkel Ban & Cuci Kendaraaan (Jaars Garage)",
    tagline: "Layanan Tambal Ban, Bongkar Pasang & Cuci Mobil/Motor",
    address: "Jl. Tawang Sakti No.46, Tawangrejo, Kec. Kartoharjo, Kota Madiun, Jawa Timur 63113",
    phone: "085156696378",
    receiptFooter: "Terima kasih atas kunjungan Anda. Utamakan keselamatan berkendara!"
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
