// js/default-data.js
// Master Data Bengkel JAARS - Diperbarui Otomatis dari Admin
// Tanggal Update: 17/11/2026, 21.40.47

const DEFAULT_PROFILE = {
    "name": "Bengkel Ban & Cuci Kendaraaan (Jaars Garage)",
    "tagline": "Layanan Tambal Ban, Bongkar Pasang & Cuci Mobil/Motor",
    "address": "Jl. Tawang Sakti No.46, Tawangrejo, Kec. Kartoharjo, Kota Madiun, Jawa Timur 63113",
    "phone": "085156696378",
    "email": "jaars.garage@gmail.com",
    "operatingHours": "Senin - Minggu: 07.30 - 17.00 WIB",
    "receiptFooter": "Terima kasih atas kunjungan Anda. Utamakan keselamatan berkendara!",
    "bankName": "Bank BRI",
    "bankAccount": "0378 0105 2871 507",
    "bankHolder": "JABANG ARU SAPUTRO",
    "qrisImage": "img/qris.jpeg",
    "isStoreClosed": false,
    "closedReason": ""
};

const DEFAULT_ADMIN = {
    email: "admin@jaarsgarage.com",
    password: "@RU54putr0"
};

const DEFAULT_CATEGORIES = [
    {
        "id": "tambal",
        "name": "Tambal Ban",
        "icon": "wrench",
        "color": "amber"
    },
    {
        "id": "bongkar",
        "name": "Bongkar Pasang Ban",
        "icon": "disc",
        "color": "blue"
    },
    {
        "id": "cuci",
        "name": "Cuci Kendaraan",
        "icon": "sparkles",
        "color": "cyan"
    },
    {
        "id": "sparepart",
        "name": "Sparepart & Tambahan",
        "icon": "package",
        "color": "emerald"
    }
];

const DEFAULT_SERVICES = [
    {
        "id": "tb-01",
        "categoryId": "tambal",
        "name": "Tambal Tubeless (Tusuk / Cacing)",
        "desc": "Tambal metode cacing cepat untuk ban tubeless",
        "unit": "per lubang",
        "priceMotor": 10000,
        "priceMobil": 25000,
        "applicable": "both"
    },
    {
        "id": "tb-02",
        "categoryId": "tambal",
        "name": "Tambal Tip-Top / Press Dingin (Payung)",
        "desc": "Tambal dari bagian dalam, aman dan tidak merusak kawat ban",
        "unit": "per titik",
        "priceMotor": 25000,
        "priceMobil": 45000,
        "applicable": "both"
    },
    {
        "id": "tb-03",
        "categoryId": "tambal",
        "name": "Tambal Press Bakar / Kompor",
        "desc": "Tambal vulkanisir panas untuk ban dalam / luka samping",
        "unit": "per lubang",
        "priceMotor": 15000,
        "priceMobil": 35000,
        "applicable": "both"
    },
    {
        "id": "tb-04",
        "categoryId": "tambal",
        "name": "Tambal Ban Dalam Biasa",
        "desc": "Tambal karet bakar / lem khusus ban dalam",
        "unit": "per lubang",
        "priceMotor": 15000,
        "priceMobil": 30000,
        "applicable": "both"
    },
    {
        "id": "tb-05",
        "categoryId": "tambal",
        "name": "Cairan Ban Tubeless Antibocor",
        "desc": "Isi cairan pelindung antibocor otomatis",
        "unit": "per botol",
        "priceMotor": 35000,
        "priceMobil": 50000,
        "applicable": "both"
    },
    {
        "id": "bp-01",
        "categoryId": "bongkar",
        "name": "Jasa Bongkar Pasang Ban Luar (Motor Standar)",
        "desc": "Bongkar pasang ban bebek / matic ukuran standar",
        "unit": "per roda",
        "priceMotor": 15000,
        "priceMobil": 0,
        "applicable": "motor"
    },
    {
        "id": "bp-02",
        "categoryId": "bongkar",
        "name": "Jasa Bongkar Pasang Ban Luar (Motor Besar / Sport / NMAX)",
        "desc": "Bongkar pasang ban matic besar, moge, ring 13-17 lebar",
        "unit": "per roda",
        "priceMotor": 25000,
        "priceMobil": 0,
        "applicable": "motor"
    },
    {
        "id": "bp-03",
        "categoryId": "bongkar",
        "name": "Jasa Bongkar Pasang Ban Mobil (Ring 13 - 16)",
        "desc": "Bongkar pasang ban velg mobil standar / MPV / City Car",
        "unit": "per roda",
        "priceMotor": 0,
        "priceMobil": 35000,
        "applicable": "mobil"
    },
    {
        "id": "bp-04",
        "categoryId": "bongkar",
        "name": "Jasa Bongkar Pasang Ban Mobil (Ring 17 - 20+)",
        "desc": "Bongkar pasang ban SUV / Velg Racing / Profil Tipis",
        "unit": "per roda",
        "priceMotor": 0,
        "priceMobil": 50000,
        "applicable": "mobil"
    },
    {
        "id": "bp-05",
        "categoryId": "bongkar",
        "name": "Balancing Roda Mobil",
        "desc": "Penyeimbangan putaran roda mobil dengan timah penyeimbang",
        "unit": "per roda",
        "priceMotor": 0,
        "priceMobil": 30000,
        "applicable": "mobil"
    },
    {
        "id": "bp-06",
        "categoryId": "bongkar",
        "name": "Isi Angin Nitrogen (Ban Baru / Kuras)",
        "desc": "Pengisian penuh gas nitrogen murni untuk ban",
        "unit": "per ban",
        "priceMotor": 5000,
        "priceMobil": 10000,
        "applicable": "both"
    },
    {
        "id": "bp-07",
        "categoryId": "bongkar",
        "name": "Tambah Angin Nitrogen",
        "desc": "Tambah tekanan gas nitrogen",
        "unit": "per ban",
        "priceMotor": 3000,
        "priceMobil": 5000,
        "applicable": "both"
    },
    {
        "id": "bp-08",
        "categoryId": "bongkar",
        "name": "Isi / Tambah Angin Biasa (Kompresor)",
        "desc": "Pengisian angin kompresor biasa",
        "unit": "per ban",
        "priceMotor": 2000,
        "priceMobil": 5000,
        "applicable": "both"
    },
    {
        "id": "cc-01",
        "categoryId": "cuci",
        "name": "Cuci Motor Reguler (Bebek / Matic Kecil)",
        "desc": "Cuci bodi bersih + semir ban",
        "unit": "per motor",
        "priceMotor": 15000,
        "priceMobil": 0,
        "applicable": "motor"
    },
    {
        "id": "cc-02",
        "categoryId": "cuci",
        "name": "Cuci Motor Salju / Snow Wash (Standar)",
        "desc": "Cuci bodi shampoo salju, sela-sela roda & semir ban",
        "unit": "per motor",
        "priceMotor": 20000,
        "priceMobil": 0,
        "applicable": "motor"
    },
    {
        "id": "cc-03",
        "categoryId": "cuci",
        "name": "Cuci Motor Besar / Sport / Matic Bongsor (NMAX/PCX/Ninja)",
        "desc": "Cuci snow wash untuk motor bodi bongsor & sport",
        "unit": "per motor",
        "priceMotor": 25000,
        "priceMobil": 0,
        "applicable": "motor"
    },
    {
        "id": "cc-04",
        "categoryId": "cuci",
        "name": "Cuci Motor Detailing & Semir Rantai",
        "desc": "Cuci detail kolong, mesin, pembersih rantai + lube chain",
        "unit": "per motor",
        "priceMotor": 40000,
        "priceMobil": 0,
        "applicable": "motor"
    },
    {
        "id": "cc-05",
        "categoryId": "cuci",
        "name": "Cuci Mobil Standar (Bodi + Kaca)",
        "desc": "Cuci bodi luar shampoo salju + semir ban",
        "unit": "per mobil",
        "priceMotor": 0,
        "priceMobil": 35000,
        "applicable": "mobil"
    },
    {
        "id": "cc-06",
        "categoryId": "cuci",
        "name": "Cuci Mobil Salju + Vacuum Interior (City Car / Sedan)",
        "desc": "Cuci bodi salju, vacuum jok & karpet, pembersih kaca",
        "unit": "per mobil",
        "priceMotor": 0,
        "priceMobil": 45000,
        "applicable": "mobil"
    },
    {
        "id": "cc-07",
        "categoryId": "cuci",
        "name": "Cuci Mobil Salju + Hidrolik Kolong (MPV / SUV / Mobil Besar)",
        "desc": "Cuci hidrolik bodi luar, kolong roda, sasis bawah + vacuum",
        "unit": "per mobil",
        "priceMotor": 0,
        "priceMobil": 55000,
        "applicable": "mobil"
    },
    {
        "id": "cc-08",
        "categoryId": "cuci",
        "name": "Cuci Mesin Mobil (Engine Bay Wash)",
        "desc": "Pembersihan ruang mesin dari kerak oli dan debu aman",
        "unit": "per mobil",
        "priceMotor": 0,
        "priceMobil": 50000,
        "applicable": "mobil"
    },
    {
        "id": "cc-09",
        "categoryId": "cuci",
        "name": "Cuci Mobil Komplit + Wax Pengkilap Bodi",
        "desc": "Cuci hidrolik kolong, vacuum, poles bodi wax instan & parfum",
        "unit": "per mobil",
        "priceMotor": 0,
        "priceMobil": 85000,
        "applicable": "mobil"
    },
    {
        "id": "sp-01",
        "categoryId": "sparepart",
        "name": "Pentil Tubeless Karet Pendek",
        "desc": "Pentil karet standar tubeless",
        "unit": "pcs",
        "priceMotor": 15000,
        "priceMobil": 15000,
        "applicable": "both"
    },
    {
        "id": "sp-02",
        "categoryId": "sparepart",
        "name": "Pentil Tubeless Besi / Kuningan Racing",
        "desc": "Pentil tubeless anti karat dan lebih awet",
        "unit": "pcs",
        "priceMotor": 25000,
        "priceMobil": 30000,
        "applicable": "both"
    },
    {
        "id": "sp-03",
        "categoryId": "sparepart",
        "name": "Ban Dalam Motor Ring 14 (Matic)",
        "desc": "Ban dalam kualitas original untuk matic",
        "unit": "pcs",
        "priceMotor": 35000,
        "priceMobil": 0,
        "applicable": "motor"
    },
    {
        "id": "sp-04",
        "categoryId": "sparepart",
        "name": "Ban Dalam Motor Ring 17 (Bebek / Sport)",
        "desc": "Ban dalam ukuran ring 17 standar",
        "unit": "pcs",
        "priceMotor": 40000,
        "priceMobil": 0,
        "applicable": "motor"
    },
    {
        "id": "sp-05",
        "categoryId": "sparepart",
        "name": "Semir Ban Kilap (Botol 250ml)",
        "desc": "Cairan silikon pengkilap ban tahan lama",
        "unit": "botol",
        "priceMotor": 20000,
        "priceMobil": 20000,
        "applicable": "both"
    },
    {
        "id": "sp-06",
        "categoryId": "sparepart",
        "name": "Parfum Mobil Gantung / Semprot",
        "desc": "Pewangi aroma mobil segar tahan lama",
        "unit": "pcs",
        "priceMotor": 0,
        "priceMobil": 15000,
        "applicable": "mobil"
    }
];

const DEFAULT_CATALOG = [
    {
        "id": "cat-bm-01",
        "category": "ban-motor",
        "brand": "IRC Tire",
        "name": "SS 570F",
        "spec": "110/70-13 Tubeless (Matic)",
        "price": 300000,
        "stockStatus": "ready",
        "image": "data:image/jpeg;base64,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DmqvtNUbk8LBjqQySDxOB+aDLYY3V9TJc58uax5ZTh3bzd48B/2VlifgqMtcXq9ppIjxEQJ8TqfmVvNcg2pKhkMLpHu3WMBcSeQWCz3Crq6FlTI4xsLy6BjdMNz7R7SccezAULfJHV09NZ4Hdad29MQdWxjj/Xcp6INYxsbAGsYA1oHAAILpbbuyvh6CYhtQBpy3u8L5JDJFC3fjaDvkZJyDo38vE4VTjkG8S14yw4ODqCOXcVMUm0NRTgNmBmHDOcO/6oJmndmolgfHvNGTvOOcEn2fkV8np5fWo3RQDDScOzgNH9ZWpT36ESuLy1kbtQ0NOeWCcc/+i9y7QUwB3A95/hx9UG2KaKkp2zSgyPhi7M6gZJA7V4t0k20EsMVtYSZW72X6bo7z+P1VZvVwudypm0VAHNqKyZlNEyP2iXHXXubvH4ZXbdltm4dnrc2MNb07gA9w4ADg0dwQSltoYrbQRUsIw2NoGe08yttEQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERB8IBBBGQeIK5jtpsGWCS4WthdHxkgaPY7SO76Lp6IPy/PGWZDgqZtc17JaafHUcx0Z/r4r9O7U+j2kvTH1FDuUtYckjH2ch78cD3jyK4ttXsjWUMb6O60csTC/7OYDLd4c2u4HTl3oNCCVr4Ii32SwY8lnac8Fo08baaliga4uEbQ0OdxIWXpcHGiDDbKOSKoqa2px6zO7AGc7kY4DPktq5XOO2UTp3jedwYwcXO5BYZqyKnhdLI4NY0ZJUTai69XH9KVYxTwu3aaI6jPafD6+CCwWOknpLa0VLi6oleZpc+653JL9VmistRK0kSOb0ceOJc7TT5n4LbZKDzWjKx10v1PDj9XocTSaZDpT7LfgNUG9QUxpaCCmLi50bA1zjzdzPmtzZ+KfaBsb6Knkf0r3NjAHtAOxveB4qepvR1fL/AE0DOrR0NSSJ55DiQRc9xva7hk459y65YdnLds7QspaCnawNaG7+OsQOHw7kEXsxsXSWUR1VS1k9waCRIRpFkYIb8NMq1hEQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBY5qeGoidFPEyWNww5j2hwPiCsiIKPd/RVsxcRI+GCWhldrvUz8NB/hOR5AKj3P0IXaNpdar1Sz/uVUboj5t3vou4Ig/NNw9DG21VTPp+goT1gQ9tVoceIC2LL6GdsqanbTS/o+EBxO86oJGvg0r9HIg5ZafQ62Lcdc7s6Q+9HTx4H8x/JXq1bKWSzNHqlBGH/wBpJ13eZ4fBTKIPmF9REBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREH//2Q==",
        "desc": "Desain pattern yang sporty dan telapak\nban yang lebar memberikan perfoma\nyang maksimum dan kenyamanan\nberkendara. Untuk Motor Yamaha Nmax (ban depan)"
    },
    {
        "id": "cat-bm-02",
        "category": "ban-motor",
        "brand": "IRC TIRE",
        "name": "SS 560R",
        "spec": "130/70-13 Tubeless (Matic)",
        "price": 375000,
        "stockStatus": "ready",
        "image": "data:image/jpeg;base64,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AREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREH/9k=",
        "desc": "Ban standar pabrikan Honda & Yamaha, hemat bahan bakar dan tahan lama."
    },
    {
        "id": "cat-bm-03",
        "category": "ban-motor",
        "brand": "Maxxis",
        "name": "Green Devil MA-G1 Tubeless",
        "spec": "90/80-17 Bebek / Sport",
        "price": 345000,
        "stockStatus": "ready",
        "image": "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=500&auto=format&fit=crop&q=80",
        "desc": "Compound soft medium untuk cornering stabil dan manuver lincah."
    },
    {
        "id": "cat-bm-04",
        "category": "ban-motor",
        "brand": "Pirelli",
        "name": "Diablo Rosso Sport Tubeless",
        "spec": "120/70-13 NMAX / Maxi",
        "price": 475000,
        "stockStatus": "ready",
        "image": "https://images.unsplash.com/photo-1578844251758-2f71da64c96f?w=500&auto=format&fit=crop&q=80",
        "desc": "Handling kelas balap untuk motor harian dan touring jarak jauh."
    },
    {
        "id": "cat-bm-05",
        "category": "ban-motor",
        "brand": "FDR",
        "name": "Flemmo Pro Tubeless",
        "spec": "90/90-14 Matic Belakang",
        "price": 225000,
        "stockStatus": "limited",
        "image": "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=500&auto=format&fit=crop&q=80",
        "desc": "Karet berkualitas tinggi dari pabrikan Astra, awet untuk ojol & harian."
    },
    {
        "id": "cat-bl-01",
        "category": "ban-mobil",
        "brand": "Bridgestone",
        "name": "Ecopia EP150",
        "spec": "185/65 R15 (Avanza / Mobilio)",
        "price": 785000,
        "stockStatus": "ready",
        "image": "https://images.unsplash.com/photo-1549492423-400259a2e574?w=500&auto=format&fit=crop&q=80",
        "desc": "Ban ramah lingkungan, hemat konsumsi BBM, senyap dan nyaman di jalan tol."
    },
    {
        "id": "cat-bl-02",
        "category": "ban-mobil",
        "brand": "Dunlop",
        "name": "Enasave EC300+",
        "spec": "175/65 R14 (Brio / Calya / Sigra)",
        "price": 595000,
        "stockStatus": "ready",
        "image": "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=500&auto=format&fit=crop&q=80",
        "desc": "Ban OEM mobil LCGC dan city car, daya tahan tapak sangat awet."
    },
    {
        "id": "cat-bl-03",
        "category": "ban-mobil",
        "brand": "GT Radial",
        "name": "Champiro Ecotec",
        "spec": "195/65 R15 (Innova / Ertiga)",
        "price": 645000,
        "stockStatus": "ready",
        "image": "https://images.unsplash.com/photo-1549492423-400259a2e574?w=500&auto=format&fit=crop&q=80",
        "desc": "Produk nasional berkualitas ekspor dengan daya cengkeram prima di jalan basah."
    },
    {
        "id": "cat-bl-04",
        "category": "ban-mobil",
        "brand": "Michelin",
        "name": "Primacy 4 ST",
        "spec": "205/55 R16 (Rush / Terios / Civic)",
        "price": 1260000,
        "stockStatus": "limited",
        "image": "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=500&auto=format&fit=crop&q=80",
        "desc": "Kenyamanan berkendara premium, pengereman terpendek dan kekedapan suara tinggi."
    },
    {
        "id": "cat-bl-05",
        "category": "ban-mobil",
        "brand": "Hankook",
        "name": "Kinergy Eco2 K435",
        "spec": "185/70 R14 (Xenia / Kijang)",
        "price": 560000,
        "stockStatus": "ready",
        "image": "https://images.unsplash.com/photo-1549492423-400259a2e574?w=500&auto=format&fit=crop&q=80",
        "desc": "Teknologi senyawa silika baru untuk jarak pengereman lebih pendek di jalan aspal."
    },
    {
        "id": "cat-ol-01",
        "category": "oli-motor",
        "brand": "Motul",
        "name": "Scooter LE 4T 10W-30",
        "spec": "0.8 Liter Matic JASO MB",
        "price": 68000,
        "stockStatus": "ready",
        "image": "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=500&auto=format&fit=crop&q=80",
        "desc": "Teknologi HC-Tech melindungi ruang mesin matic dari panas ekstrem dan gesekan."
    },
    {
        "id": "cat-ol-02",
        "category": "oli-motor",
        "brand": "Pertamina",
        "name": "Enduro Matic G 20W-40",
        "spec": "0.8 Liter JASO MB API SL",
        "price": 45000,
        "stockStatus": "ready",
        "image": "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=500&auto=format&fit=crop&q=80",
        "desc": "Oli matic terpercaya dengan wangi khas dan akselerasi tarikan mesin enteng."
    },
    {
        "id": "cat-ol-03",
        "category": "oli-motor",
        "brand": "Shell",
        "name": "Advance AX7 10W-40 Synthetic",
        "spec": "1.0 Liter Bebek / Sport JASO MA2",
        "price": 62000,
        "stockStatus": "ready",
        "image": "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=500&auto=format&fit=crop&q=80",
        "desc": "Teknologi Shell Active Cleansing menjaga mesin tetap bersih dari endapan kotoran."
    },
    {
        "id": "cat-ol-04",
        "category": "oli-motor",
        "brand": "Yamalube",
        "name": "Super Matic Oil 10W-40 Full Synth",
        "spec": "1.0 Liter NMAX / Aerox / Maxi",
        "price": 76000,
        "stockStatus": "ready",
        "image": "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=500&auto=format&fit=crop&q=80",
        "desc": "Diformulasikan khusus untuk mesin Blue Core Yamaha Maxi dengan performa maksimal."
    },
    {
        "id": "cat-ol-05",
        "category": "oli-mobil",
        "brand": "Shell",
        "name": "Helix HX6 10W-40 Synthetic",
        "spec": "4.0 Liter (Galon) Bensin/Diesel",
        "price": 340000,
        "stockStatus": "ready",
        "image": "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=500&auto=format&fit=crop&q=80",
        "desc": "Membantu memperpanjang usia mesin mobil dan melindungi dari keausan berkendara harian."
    },
    {
        "id": "cat-ol-06",
        "category": "oli-mobil",
        "brand": "Pertamina",
        "name": "Fastron Gold 5W-30 Full Synthetic",
        "spec": "4.0 Liter (Galon) API SN Dexos 1",
        "price": 485000,
        "stockStatus": "ready",
        "image": "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=500&auto=format&fit=crop&q=80",
        "desc": "Oli mobil bensin performa tinggi, efisiensi bahan bakar dan perlindungan dingin."
    },
    {
        "id": "cat-ol-07",
        "category": "oli-mobil",
        "brand": "Castrol",
        "name": "Magnatec Stop-Start 10W-40",
        "spec": "4.0 Liter Dualock Technology",
        "price": 395000,
        "stockStatus": "limited",
        "image": "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=500&auto=format&fit=crop&q=80",
        "desc": "Molekul pintar melekat pada komponen mesin, melindungi 50% lebih baik saat macet."
    }
];

const DEFAULT_TRANSACTIONS = [
    {
        "id": "INV-JAARS-001",
        "invoiceNo": "INV-849201",
        "date": "2026-11-18T07:45:00.000Z",
        "customerName": "Bpk. Agus Prasetyo",
        "customerPhone": "081234567890",
        "plateNumber": "AE 4582 BC",
        "vehicleType": "motor",
        "orderNote": "Pembersihan velg & pengecekan angin ban depan belakang",
        "items": [
            {
                "id": "tb-01",
                "categoryId": "tambal",
                "name": "Tambal Tubeless (Tusuk / Cacing)",
                "desc": "Tambal metode cacing cepat untuk ban tubeless",
                "unit": "per lubang",
                "price": 10000,
                "qty": 1
            },
            {
                "id": "cu-01",
                "categoryId": "cuci",
                "name": "Cuci Motor Reguler / Salju",
                "desc": "Cuci bodi salju wax + semir ban",
                "unit": "per motor",
                "price": 15000,
                "qty": 1
            },
            {
                "id": "cat-ol-02",
                "categoryId": "oli-motor",
                "name": "Pertamina Enduro Matic G 20W-40",
                "desc": "0.8 Liter JASO MB API SL",
                "unit": "per botol",
                "price": 45000,
                "qty": 1
            }
        ],
        "subtotal": 70000,
        "discountType": "nominal",
        "discountValue": 0,
        "discountAmount": 0,
        "total": 70000,
        "cash": 70000,
        "change": 0,
        "paymentMethod": "qris"
    },
    {
        "id": "INV-JAARS-002",
        "invoiceNo": "INV-849188",
        "date": "2026-11-18T06:30:00.000Z",
        "customerName": "Ibu Rina Wijaya",
        "customerPhone": "085790123456",
        "plateNumber": "AE 1899 ZZ",
        "vehicleType": "mobil",
        "orderNote": "Cuci hidrolik kolong bersih mengkilap, semir ban 4 roda",
        "items": [
            {
                "id": "cu-04",
                "categoryId": "cuci",
                "name": "Cuci Mobil Hidrolik Kolong (Understeel)",
                "desc": "Angkat hidrolik X/H, semprot kolong lumpur & bodi salju",
                "unit": "per mobil",
                "price": 50000,
                "qty": 1
            },
            {
                "id": "bp-04",
                "categoryId": "bongkar",
                "name": "Isi Angin Ban Nitrogen Baru (4 Roda)",
                "desc": "Kuras dan isi nitrogen murni 4 roda",
                "unit": "4 roda",
                "price": 20000,
                "qty": 1
            }
        ],
        "subtotal": 70000,
        "discountType": "nominal",
        "discountValue": 5000,
        "discountAmount": 5000,
        "total": 65000,
        "cash": 100000,
        "change": 35000,
        "paymentMethod": "cash"
    },
    {
        "id": "INV-JAARS-003",
        "invoiceNo": "INV-849150",
        "date": "2026-11-17T15:20:00.000Z",
        "customerName": "Mas Danang Saputra",
        "customerPhone": "082133445566",
        "plateNumber": "AE 3314 KL",
        "vehicleType": "motor",
        "orderNote": "Ganti pentil tubeless besi karena pentil lama bocor halus",
        "items": [
            {
                "id": "tb-02",
                "categoryId": "tambal",
                "name": "Tambal Tip-Top / Press Dingin (Payung)",
                "desc": "Tambal dari bagian dalam, aman dan tidak merusak kawat ban",
                "unit": "per titik",
                "price": 25000,
                "qty": 1
            },
            {
                "id": "sp-02",
                "categoryId": "sparepart",
                "name": "Pentil Tubeless Besi / Alumunium",
                "desc": "Pentil tubeless awet dengan baut pengunci",
                "unit": "per buah",
                "price": 15000,
                "qty": 1
            }
        ],
        "subtotal": 40000,
        "discountType": "nominal",
        "discountValue": 0,
        "discountAmount": 0,
        "total": 40000,
        "cash": 40000,
        "change": 0,
        "paymentMethod": "transfer"
    },
    {
        "id": "INV-JAARS-004",
        "invoiceNo": "INV-848910",
        "date": "2026-11-15T09:10:00.000Z",
        "customerName": "Bpk. Agus Prasetyo",
        "customerPhone": "081234567890",
        "plateNumber": "AE 4582 BC",
        "vehicleType": "motor",
        "orderNote": "Cuci motor salju rutin",
        "items": [
            {
                "id": "cu-01",
                "categoryId": "cuci",
                "name": "Cuci Motor Reguler / Salju",
                "desc": "Cuci bodi salju wax + semir ban",
                "unit": "per motor",
                "price": 15000,
                "qty": 1
            }
        ],
        "subtotal": 15000,
        "discountType": "nominal",
        "discountValue": 0,
        "discountAmount": 0,
        "total": 15000,
        "cash": 15000,
        "change": 0,
        "paymentMethod": "cash",
        "paymentValidated": true,
        "paymentStatus": "verified"
    },
    {
        "id": "INV-JAARS-005",
        "invoiceNo": "INV-848622",
        "date": "2026-11-12T14:30:00.000Z",
        "customerName": "Bpk. Agus Prasetyo",
        "customerPhone": "081234567890",
        "plateNumber": "AE 4582 BC",
        "vehicleType": "motor",
        "orderNote": "Cuci motor mingguan",
        "items": [
            {
                "id": "cu-01",
                "categoryId": "cuci",
                "name": "Cuci Motor Reguler / Salju",
                "desc": "Cuci bodi salju wax + semir ban",
                "unit": "per motor",
                "price": 15000,
                "qty": 1
            }
        ],
        "subtotal": 15000,
        "discountType": "nominal",
        "discountValue": 0,
        "discountAmount": 0,
        "total": 15000,
        "cash": 15000,
        "change": 0,
        "paymentMethod": "cash",
        "paymentValidated": true,
        "paymentStatus": "verified"
    },
    {
        "id": "INV-JAARS-006",
        "invoiceNo": "INV-848315",
        "date": "2026-11-09T10:00:00.000Z",
        "customerName": "Bpk. Agus Prasetyo",
        "customerPhone": "081234567890",
        "plateNumber": "AE 4582 BC",
        "vehicleType": "motor",
        "orderNote": "Cuci motor salju + semir ban",
        "items": [
            {
                "id": "cu-01",
                "categoryId": "cuci",
                "name": "Cuci Motor Reguler / Salju",
                "desc": "Cuci bodi salju wax + semir ban",
                "unit": "per motor",
                "price": 15000,
                "qty": 1
            }
        ],
        "subtotal": 15000,
        "discountType": "nominal",
        "discountValue": 0,
        "discountAmount": 0,
        "total": 15000,
        "cash": 15000,
        "change": 0,
        "paymentMethod": "cash",
        "paymentValidated": true,
        "paymentStatus": "verified"
    },
    {
        "id": "INV-JAARS-007",
        "invoiceNo": "INV-848002",
        "date": "2026-11-06T11:20:00.000Z",
        "customerName": "Bpk. Agus Prasetyo",
        "customerPhone": "081234567890",
        "plateNumber": "AE 4582 BC",
        "vehicleType": "motor",
        "orderNote": "Cuci motor salju",
        "items": [
            {
                "id": "cu-01",
                "categoryId": "cuci",
                "name": "Cuci Motor Reguler / Salju",
                "desc": "Cuci bodi salju wax + semir ban",
                "unit": "per motor",
                "price": 15000,
                "qty": 1
            }
        ],
        "subtotal": 15000,
        "discountType": "nominal",
        "discountValue": 0,
        "discountAmount": 0,
        "total": 15000,
        "cash": 15000,
        "change": 0,
        "paymentMethod": "cash",
        "paymentValidated": true,
        "paymentStatus": "verified"
    },
    {
        "id": "INV-JAARS-008",
        "invoiceNo": "INV-847712",
        "date": "2026-11-03T16:15:00.000Z",
        "customerName": "Bpk. Agus Prasetyo",
        "customerPhone": "081234567890",
        "plateNumber": "AE 4582 BC",
        "vehicleType": "motor",
        "orderNote": "Cuci bodi motor",
        "items": [
            {
                "id": "cu-01",
                "categoryId": "cuci",
                "name": "Cuci Motor Reguler / Salju",
                "desc": "Cuci bodi salju wax + semir ban",
                "unit": "per motor",
                "price": 15000,
                "qty": 1
            }
        ],
        "subtotal": 15000,
        "discountType": "nominal",
        "discountValue": 0,
        "discountAmount": 0,
        "total": 15000,
        "cash": 15000,
        "change": 0,
        "paymentMethod": "cash",
        "paymentValidated": true,
        "paymentStatus": "verified"
    },
    {
        "id": "INV-JAARS-009",
        "invoiceNo": "INV-847401",
        "date": "2026-10-30T08:45:00.000Z",
        "customerName": "Bpk. Agus Prasetyo",
        "customerPhone": "081234567890",
        "plateNumber": "AE 4582 BC",
        "vehicleType": "motor",
        "orderNote": "Cuci motor salju pertama siklus",
        "items": [
            {
                "id": "cu-01",
                "categoryId": "cuci",
                "name": "Cuci Motor Reguler / Salju",
                "desc": "Cuci bodi salju wax + semir ban",
                "unit": "per motor",
                "price": 15000,
                "qty": 1
            }
        ],
        "subtotal": 15000,
        "discountType": "nominal",
        "discountValue": 0,
        "discountAmount": 0,
        "total": 15000,
        "cash": 15000,
        "change": 0,
        "paymentMethod": "cash",
        "paymentValidated": true,
        "paymentStatus": "verified"
    }
];
