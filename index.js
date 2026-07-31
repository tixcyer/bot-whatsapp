const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  downloadMediaMessage,
} = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const pino = require("pino");
const { Sticker, StickerTypes } = require("wa-sticker-formatter");
const axios = require("axios");
const fs = require("fs");

const DB_FILE = "./database.json";

// ==========================================
// GANTI NOMOR DI BAWAH INI DENGAN NOMOR WHATSAPP ANDA
const phoneNumber = "6287828541775"; 
// ==========================================

function loadDB() {
  if (fs.existsSync(DB_FILE)) {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  }
  return {
    absensi: [],
    userOff: {},
    userPoints: {},
    gameSesi: {},
    lastNyerah: {},
  };
}

function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function formatDuration(ms) {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor(ms / (1000 * 60 * 60));

  let result = "";
  if (hours > 0) result += `${hours} jam `;
  if (minutes > 0 || hours > 0) result += `${minutes} menit `;
  result += `${seconds} detik`;
  return result;
}

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const bankSoal = {
  buah: [
    {
      soal: "Buah apa yang kulitnya berduri tapi dagingnya manis berbau tajam?",
      jawaban: "durian",
      pilihan: ["durian", "nangka", "salak", "manggis"],
    },
    {
      soal: "Buah apa yang kalau dikupas warnanya kuning dan jadi kesukaan monyet?",
      jawaban: "pisang",
      pilihan: ["pisang", "pepaya", "mangga", "melon"],
    },
    {
      soal: "Buah kecil berwarna merah yang sering jadi topping kue tart?",
      jawaban: "ceri",
      pilihan: ["ceri", "stroberi", "anggur", "frambos"],
    },
    {
      soal: "Buah apa yang punya biji di luar kulitnya?",
      jawaban: "stroberi",
      pilihan: ["stroberi", "jambu", "apel", "jeruk"],
    },
    {
      soal: "Buah apa yang namanya mirip dengan nama bulan di kalender Masehi?",
      jawaban: "mangga",
      pilihan: ["mangga", "jambu", "salak", "pepaya"],
    },
    {
      soal: "Buah hijau besar yang isinya air segar dan daging buah putih?",
      jawaban: "kelapa",
      pilihan: ["kelapa", "semangka", "melon", "blewah"],
    },
    {
      soal: "Buah yang dijuluki sebagai 'King of Fruit' adalah...?",
      jawaban: "durian",
      pilihan: ["durian", "alpukat", "nangka", "manggis"],
    },
    {
      soal: "Buah apa yang isinya berbentuk bintang jika dipotong melintang?",
      jawaban: "belimbing",
      pilihan: ["belimbing", "jeruk", "apel", "pepaya"],
    },
    {
      soal: "Buah berbentuk bulat kecil bergerombol dalam satu tangkai berwarna ungu/hijau?",
      jawaban: "anggur",
      pilihan: ["anggur", "lengkeng", "ceri", "blueberry"],
    },
    {
      soal: "Buah berduri lembut warna merah menyala dengan daging putih berbiji hitam?",
      jawaban: "buah naga",
      pilihan: ["buah naga", "rambutan", "sirsak", "leci"],
    },
    {
      soal: "Buah tropis berkulit hijau/kuning dengan daging lembut oranye dan biji besar di tengah?",
      jawaban: "mangga",
      pilihan: ["mangga", "pepaya", "jeruk", "alpukat"],
    },
    {
      soal: "Buah yang kaya akan vitamin C, berbentuk lonjong dan kulitnya berbulu halus warna cokelat?",
      jawaban: "kiwi",
      pilihan: ["kiwi", "sawo", "jeruk"],
    },
    {
      soal: "Buah apa yang rasanya sangat asam tapi sering dijadikan bumbu sayur atau sambal?",
      jawaban: "belimbing wuluh",
      pilihan: ["belimbing wuluh", "mangga", "kedondong", "jeruk nipis"],
    },
    {
      soal: "Buah berukuran besar, berkulit hijau garis-garis, isinya merah segar banyak air?",
      jawaban: "semangka",
      pilihan: ["semangka", "melon", "blewah", "timun suri"],
    },
    {
      soal: "Buah berdaging kuning/oranye terang yang bijinya menempel di bagian luar permukaan kulit?",
      jawaban: "stroberi",
      pilihan: ["stroberi", "jeruk", "pisang", "mangga"],
    },
    {
      soal: "Buah apa yang jika matang berwarna kuning oranye dan punya daging buah yang sangat empuk bertekstur mentega?",
      jawaban: "alpukat",
      pilihan: ["alpukat", "nangka", "durian", "pepaya"],
    },
    {
      soal: "Buah kecil mungil berwarna merah kehitaman yang rasanya manis agak asam?",
      jawaban: "ceri",
      pilihan: ["ceri", "anggur", "strawberry", "blueberry"],
    },
    {
      soal: "Buah berkulit sisik ular berwarna cokelat?",
      jawaban: "salak",
      pilihan: ["salak", "durian", "rambutan", "nangka"],
    },
    {
      soal: "Buah apa yang sering dikeringkan menjadi kismis?",
      jawaban: "anggur",
      pilihan: ["anggur", "apel", "pisang", "kurma"],
    },
    {
      soal: "Buah berwarna kuning berbentuk lonjong yang rasanya sangat asam dan biasa untuk es?",
      jawaban: "lemon",
      pilihan: ["lemon", "jeruk nipis", "nanas", "belimbing"],
    },
    {
      soal: "Buah apa yang memiliki kandungan air terbanyak?",
      jawaban: "semangka",
      pilihan: ["semangka", "melon", "jeruk", "pepaya"],
    },
    {
      soal: "Buah berbulu tajam kecil-kecil dengan daging putih manis berair?",
      jawaban: "rambutan",
      pilihan: ["rambutan", "durian", "salak", "leci"],
    },
    {
      soal: "Buah kecil mirip rambutan tapi kulitnya halus merah tua dan rasanya manis legit?",
      jawaban: "manggis",
      pilihan: ["manggis", "duku", "lengkeng", "rambutan"],
    },
    {
      soal: "Buah apa yang isinya butiran bening kemerahan dan renyah saat dimakan?",
      jawaban: "delima",
      pilihan: ["delima", "semangka", "pepaya", "anggur"],
    },
    {
      soal: "Buah berdaging putih atau merah dengan banyak biji kecil di bagian tengah yang bisa dimakan?",
      jawaban: "jambu biji",
      pilihan: ["jambu biji", "pepaya", "sirsak", "apel"],
    },
    {
      soal: "Buah apa yang dinamai sama dengan warna kulitnya yang kuning cerah?",
      jawaban: "pisang",
      pilihan: ["pisang", "lemon", "jeruk", "mangga"],
    },
    {
      soal: "Buah tempat tinggal spongebob squarepants di dasar laut?",
      jawaban: "nanas",
      pilihan: ["nanas", "kelapa", "semangka", "pepaya"],
    },
    {
      soal: "Buah apa yang memiliki mahkota di atas kepalanya?",
      jawaban: "nanas",
      pilihan: ["nanas", "apel", "jeruk", "mangga"],
    },
    {
      soal: "Buah berbentuk bulat, kulit hijau kasar, isinya jingga berair sangat manis?",
      jawaban: "melon",
      pilihan: ["melon", "semangka", "pepaya", "jeruk"],
    },
    {
      soal: "Buah berdaging putih berserat dengan banyak duri lunak di kulitnya serta rasa asam manis?",
      jawaban: "sirsak",
      pilihan: ["sirsak", "nangka", "durian", "salak"],
    },
  ],
  negara: [
    {
      soal: "Negara apa yang dijuluki sebagai Negeri Sakura?",
      jawaban: "jepang",
      pilihan: ["jepang", "china", "korea", "taiwan"],
    },
    {
      soal: "Ibukota negara Australia adalah...?",
      jawaban: "canberra",
      pilihan: ["canberra", "sydney", "melbourne", "perth"],
    },
    {
      soal: "Negara terkecil di dunia berdasarkan luas wilayah adalah...?",
      jawaban: "vatikan",
      pilihan: ["vatikan", "monako", "san marino", "liechtenstein"],
    },
    {
      soal: "Negara mana yang memiliki bentuk wilayah mirip buah sepatu/boot?",
      jawaban: "italia",
      pilihan: ["italia", "yunani", "spanyol", "prancis"],
    },
    {
      soal: "Menara Eiffel terletak di negara...?",
      jawaban: "prancis",
      pilihan: ["prancis", "jerman", "inggris", "italia"],
    },
    {
      soal: "Negara terluas di dunia berdasarkan wilayahnya adalah...?",
      jawaban: "rusia",
      pilihan: ["rusia", "kanada", "china", "amerika serikat"],
    },
    {
      soal: "Negara dengan jumlah penduduk terbanyak di dunia saat ini?",
      jawaban: "india",
      pilihan: ["india", "china", "amerika serikat", "indonesia"],
    },
    {
      soal: "Ibukota negara Indonesia saat ini (sebelum pindah total ke IKN)?",
      jawaban: "jakarta",
      pilihan: ["jakarta", "bandung", "surabaya", "yogyakarta"],
    },
    {
      soal: "Negara piramida dan Sphinx berada di benua Afrika yaitu negara...?",
      jawaban: "mesir",
      pilihan: ["mesir", "maroko", "aljazair", "sudan"],
    },
    {
      soal: "Negara yang terkenal dengan patung Liberty di kotanya (New York)?",
      jawaban: "amerika serikat",
      pilihan: ["amerika serikat", "kanada", "inggris", "australia"],
    },
    {
      soal: "Negara tetangga terdekat Indonesia di sebelah utara yang ibu kotanya Kuala Lumpur?",
      jawaban: "malaysia",
      pilihan: ["malaysia", "singapura", "brunei", "thailand"],
    },
    {
      soal: "Negara kepulauan di Asia Tenggara yang ibu kotanya Bandar Seri Begawan?",
      jawaban: "brunei darussalam",
      pilihan: ["brunei darussalam", "malaysia", "filipina", "singapura"],
    },
    {
      soal: "Negara gajah putih adalah julukan untuk negara...?",
      jawaban: "thailand",
      pilihan: ["thailand", "laos", "kamboja", "vietnam"],
    },
    {
      soal: "Negara kincir angin dan bunga tulip adalah...?",
      jawaban: "belanda",
      pilihan: ["belanda", "jerman", "denmark", "belgia"],
    },
    {
      soal: "Negara terpanjang di dunia yang terletak di Amerika Selatan?",
      jawaban: "chile",
      pilihan: ["chile", "brasil", "argentina", "peru"],
    },
    {
      soal: "Ibukota negara Inggris (UK) adalah...?",
      jawaban: "london",
      pilihan: ["london", "paris", "berlin", "roma"],
    },
    {
      soal: "Negara yang terletak di dua benua sekaligus (Eropa dan Asia) dengan ibukota Ankara?",
      jawaban: "turki",
      pilihan: ["turki", "rusia", "mesir", "yunani"],
    },
    {
      soal: "Negara asal klub sepak bola Real Madrid dan Barcelona?",
      jawaban: "spanyol",
      pilihan: ["spanyol", "italia", "prancis", "portugal"],
    },
    {
      soal: "Negara tempat berdirinya Tembok Besar (Great Wall)?",
      jawaban: "china",
      pilihan: ["china", "jepang", "korea", "mongolia"],
    },
    {
      soal: "Negara kiwi (bukan buahnya tapi burungnya) di kawasan Oseania?",
      jawaban: "selandia baru",
      pilihan: ["selandia baru", "australia", "fiji", "papua nugini"],
    },
    {
      soal: "Negara multikultural dengan ibukota Ottawa?",
      jawaban: "kanada",
      pilihan: ["kanada", "amerika serikat", "inggris", "australia"],
    },
    {
      soal: "Negara kepulauan tropis di Asia Tenggara yang ibu kotanya Manila?",
      jawaban: "filipina",
      pilihan: ["filipina", "indonesia", "malaysia", "vietnam"],
    },
    {
      soal: "Negara semenanjung Korea yang menganut sistem komunis di utara?",
      jawaban: "korea utara",
      pilihan: ["korea utara", "korea selatan", "china", "vietnam"],
    },
    {
      soal: "Negara asal K-Pop dan drama Squid Game di Asia Timur?",
      jawaban: "korea selatan",
      pilihan: ["korea selatan", "jepang", "china", "thailand"],
    },
    {
      soal: "Negara padang pasir kaya minyak yang punya gedung tertinggi Burj Khalifa?",
      jawaban: "uni emirat arab",
      pilihan: ["uni emirat arab", "arab saudi", "qatar", "kuwait"],
    },
    {
      soal: "Negara yang berbentuk kepulauan seperti naga melingkar di Asia Tenggara?",
      jawaban: "vietnam",
      pilihan: ["vietnam", "laos", "thailand", "myanmar"],
    },
    {
      soal: "Negara tetangga kecil berbentuk pulau di selatan Johor, Malaysia?",
      jawaban: "singapura",
      pilihan: ["singapura", "brunei", "malaysia", "maladewa"],
    },
    {
      soal: "Negara tempat asal pahlawan sepak bola Lionel Messi?",
      jawaban: "argentina",
      pilihan: ["argentina", "brasil", "uruguay", "chile"],
    },
    {
      soal: "Negara asal penemu tarian Samba dan legenda sepak bola Pele?",
      jawaban: "brasil",
      pilihan: ["brasil", "argentina", "kolombia", "spanyol"],
    },
    {
      soal: "Negara terjauh di belahan bumi selatan yang dijuluki 'Down Under'?",
      jawaban: "australia",
      pilihan: ["australia", "selandia baru", "afrika selatan", "chile"],
    },
  ],
  hewan: [
    {
      soal: "Hewan darat tercepat di dunia adalah...?",
      jawaban: "cheetah",
      pilihan: ["cheetah", "singa", "kuda", "harimau"],
    },
    {
      soal: "Hewan apa yang bisa tidur sambil berdiri?",
      jawaban: "kuda",
      pilihan: ["kuda", "kucing", "anjing", "kelinci"],
    },
    {
      soal: "Mamalia laut terbesar di bumi adalah...?",
      jawaban: "paus biru",
      pilihan: ["paus biru", "hiu putih", "lumba-lumba", "singa laut"],
    },
    {
      soal: "Burung apa yang tidak bisa terbang tapi bisa berenang sangat cepat?",
      jawaban: "pinguin",
      pilihan: ["pinguin", "angsa", "pelikan", "flamingo"],
    },
    {
      soal: "Hewan apa yang memiliki kantung di perut untuk membawa anaknya?",
      jawaban: "kangguru",
      pilihan: ["kangguru", "koala", "panda", "musang"],
    },
    {
      soal: "Hewan air yang punya tiga jantung dan darah berwarna biru?",
      jawaban: "gurita",
      pilihan: ["gurita", "ikan hiu", "ubur-ubur", "kepiting"],
    },
    {
      soal: "Hewan terbesar di darat saat ini?",
      jawaban: "gajah",
      pilihan: ["gajah", "badak", "kuda nil", "jerapah"],
    },
    {
      soal: "Raja hutan yang terkenal dengan bulu lebat di sekitar kepalanya?",
      jawaban: "singa",
      pilihan: ["singa", "macan tutul", "serigala", "beruang"],
    },
    {
      soal: "Hewan berleher paling panjang di dunia?",
      jawaban: "jerapah",
      pilihan: ["jerapah", "zebra", "kuda", "unta"],
    },
    {
      soal: "Hewan lambat yang kerjanya hanya bergantung di pohon wilayah hutan tropis?",
      jawaban: "sloth",
      pilihan: ["sloth", "koala", "kukang", "musang"],
    },
    {
      soal: "Burung hantu aktif mencari makan pada waktu...?",
      jawaban: "malam hari",
      pilihan: ["malam hari", "siang hari", "pagi hari", "sore hari"],
    },
    {
      soal: "Hewan pengerat pengerat kayu yang sering membuat bendungan di sungai?",
      jawaban: "berang-berang",
      pilihan: ["berang-berang", "tikus", "rubah", "angsa"],
    },
    {
      soal: "Serangga kecil pekerja keras yang hidup berkoloni dan suka gula?",
      jawaban: "semut",
      pilihan: ["semut", "lebah", "rayap", "lalat"],
    },
    {
      soal: "Hewan amfibi pelompat handal yang hidup di air dan darat bersuara 'Kwek/Kecipak'?",
      jawaban: "katak",
      pilihan: ["katak", "ikan", "buaya", "ular"],
    },
    {
      soal: "Ikan predator bergigi tajam penguasa sungai Amazon?",
      jawaban: "piranha",
      pilihan: ["piranha", "hiu", "pari", "barakuda"],
    },
    {
      soal: "Hewan laut pintar yang sering menolong manusia dan bernapas melalui lubang di atas kepala?",
      jawaban: "lumba-lumba",
      pilihan: ["lumba-lumba", "paus", "anjing laut", "dugong"],
    },
    {
      soal: "Hewan marsupial asal Australia pemakan daun eukaliptus yang gemar tidur?",
      jawaban: "koala",
      pilihan: ["koala", "kangguru", "wombat", "panda"],
    },
    {
      soal: "Burung tercepat di udara saat menukik tajam?",
      jawaban: "falcon",
      pilihan: ["falcon", "elang", "merpati", "rajawali"],
    },
    {
      soal: "Hewan yang bisa mengubah warna kulitnya sesuai tempat ia berada (mimikri)?",
      jawaban: "bunglon",
      pilihan: ["bunglon", "landak", "ular", "cicak"],
    },
    {
      soal: "Hewan bercangkang keras yang berjalan miring dan hidup di pantai?",
      jawaban: "kepiting",
      pilihan: ["kepiting", "udang", "kerang", "bintang laut"],
    },
    {
      soal: "Mamalia satu-satunya di dunia yang bisa terbang bebas di udara?",
      jawaban: "kelelawar",
      pilihan: ["kelelawar", "musang", "tikus", "burung"],
    },
    {
      soal: "Hewan berbulu hitam putih khas asal Tiongkok pemakan bambu?",
      jawaban: "panda",
      pilihan: ["panda", "koala", "beruang", "lemur"],
    },
    {
      soal: "Ikan terbesar di lautan luas yang berukuran raksasa tapi makanannya plankton?",
      jawaban: "hiu paus",
      pilihan: ["hiu paus", "paus biru", "pari manta", "ikan mola"],
    },
    {
      soal: "Hewan purba mirip buaya yang hidup di rawa-rawa pedalaman Kalimantan/Papua?",
      jawaban: "buaya",
      pilihan: ["buaya", "komodo", "iguana", "salamander"],
    },
    {
      soal: "Anjing laut berukuran besar yang memiliki taring gading panjang di dekat mulutnya?",
      jawaban: "walrus",
      pilihan: ["walrus", "singa laut", "anjing laut", "beruang kutub"],
    },
    {
      soal: "Hewan berduri tajam di sekujur tubuhnya untuk pertahanan diri?",
      jawaban: "landak",
      pilihan: ["landak", "landak laut", "bunglon", "armadillo"],
    },
    {
      soal: "Ular raksasa dari Amerika Selatan penjerat mangsa tanpa racun?",
      jawaban: "anaconda",
      pilihan: ["anaconda", "python", "cobra", "piton"],
    },
    {
      soal: "Serangga indah bersayap warna-warni yang bermetamorfosis dari ulat?",
      jawaban: "kupu-kupu",
      pilihan: ["kupu-kupu", "lebah", "capung", "lalat"],
    },
    {
      soal: "Hewan pengerat kecil yang sering jadi peliharaan rumah atau percobaan lab?",
      jawaban: "hamster",
      pilihan: ["hamster", "tikus", "kelinci", "musang"],
    },
    {
      soal: "Burung terbesar di dunia yang tidak bisa terbang dan berasal dari Afrika?",
      jawaban: "burung unta",
      pilihan: ["burung unta", "kasuari", "flamingo", "pelikan"],
    },
  ],
  artis: [
    {
      soal: "Aktor pemeran utama film Iron Man di Marvel Cinematic Universe?",
      jawaban: "robert downey jr",
      pilihan: [
        "robert downey jr",
        "chris evans",
        "tom holland",
        "mark ruffalo",
      ],
    },
    {
      soal: "Penyanyi wanita asal Indonesia pelantun lagu 'Bad Liar' versi lokal? (nama depan saja)",
      jawaban: "agnez mo",
      pilihan: ["agnez mo", "raisa", "isyana", "tiara andini"],
    },
    {
      soal: "Aktor laga Indonesia yang main di film The Raid dan John Wick 4?",
      jawaban: "cecep arief rahman",
      pilihan: [
        "cecep arief rahman",
        "iko uwais",
        "joe taslim",
        "yayan ruhian",
      ],
    },
    {
      soal: "Sutradara film Avatar dan Titanic yang memenangkan banyak Oscar?",
      jawaban: "james cameron",
      pilihan: [
        "james cameron",
        "christopher nolan",
        "steven spielberg",
        "quentin tarantino",
      ],
    },
    {
      soal: "Penyanyi internasional pelantun lagu 'Shape of You' berambut merah?",
      jawaban: "ed sheeran",
      pilihan: ["ed sheeran", "justin bieber", "shawn mendes", "harry styles"],
    },
    {
      soal: "Aktor laga legendaris dunia asal Hong Kong yang terkenal dengan film komedi bela diri?",
      jawaban: "jackie chan",
      pilihan: ["jackie chan", "bruce lee", "jet li", "donnie yen"],
    },
    {
      soal: "Penyanyi pop legendaris dunia yang dijuluki sebagai 'King of Pop'?",
      jawaban: "michael jackson",
      pilihan: [
        "michael jackson",
        "elvis presley",
        "prince",
        "freddie mercury",
      ],
    },
    {
      soal: "Aktor pemeran agen rahasia 007 dalam film James Bond (Casino Royale)?",
      jawaban: "daniel craig",
      pilihan: ["daniel craig", "pierce brosnan", "sean connery", "tom cruise"],
    },
    {
      soal: "Aktris Hollywood pemeran utama film Barbie (2023)?",
      jawaban: "margot robbie",
      pilihan: ["margot robbie", "emma watson", "zendaya", "florence pugh"],
    },
    {
      soal: "Penyanyi wanita internasional pelantun lagu 'Anti-Hero' dan 'Blank Space'?",
      jawaban: "taylor swift",
      pilihan: ["taylor swift", "ariana grande", "billie eilish", "katy perry"],
    },
    {
      soal: "Grup musik K-Pop global beranggotakan 7 orang pelantun lagu 'Dynamite'?",
      jawaban: "bts",
      pilihan: ["bts", "exo", "seventeen", "stray kids"],
    },
    {
      soal: "Grup wanita K-Pop populer asal YG Entertainment pelantun 'Kill This Love'?",
      jawaban: "blackpink",
      pilihan: ["blackpink", "twice", "aespa", "itzy"],
    },
    {
      soal: "Aktor laga Indonesia yang mendunia lewat film 'The Raid' dan 'Fast & Furious 6'?",
      jawaban: "iko uwais",
      pilihan: ["iko uwais", "joe taslim", "cecep arief", "yayan ruhian"],
    },
    {
      soal: "Pelawak dan aktor tunggal (stand-up comedian) Indonesia pemeran film 'Cek Toko Sebelah'?",
      jawaban: "ernest prakasa",
      pilihan: [
        "ernest prakasa",
        "raditya dika",
        "pandji pragiwaksono",
        "komeng",
      ],
    },
    {
      soal: "Penyanyi pria solo Indonesia bersuara khas pelantun lagu 'Hati-Hati di Jalan'?",
      jawaban: "tulus",
      pilihan: ["tulus", "rizky febian", "afgan", "judika"],
    },
    {
      soal: "Aktor Hollywood pemeran utama film Mission: Impossible?",
      jawaban: "tom cruise",
      pilihan: ["tom cruise", "keanu reeves", "matt damon", "brad pitt"],
    },
    {
      soal: "Aktris Indonesia pemeran utama film Sri Asih dan Gundala?",
      jawaban: "pevita pearce",
      pilihan: [
        "pevita pearce",
        "chelsea islan",
        "dian sastrowardoyo",
        "laura basuki",
      ],
    },
    {
      soal: "Penyanyi internasional wanita bersuara merdu pelantun lagu 'Hello' dan 'Easy on Me'?",
      jawaban: "adele",
      pilihan: ["adele", "taylor swift", "rihanna", "lady gaga"],
    },
    {
      soal: "Penyanyi pria asal Kanada pelantun lagu 'Baby' yang populer sejak remaja?",
      jawaban: "justin bieber",
      pilihan: ["justin bieber", "shawn mendes", "charlie puth", "ed sheeran"],
    },
    {
      soal: "Sutradara film trilogi 'The Dark Knight' asal Inggris-Amerika?",
      jawaban: "christopher nolan",
      pilihan: [
        "christopher nolan",
        "james cameron",
        "denis villeneuve",
        "martin scorsese",
      ],
    },
    {
      soal: "Aktor Hollywood pemeran tokoh Thor dalam film Marvel?",
      jawaban: "chris hemsworth",
      pilihan: ["chris hemsworth", "chris evans", "chris pratt", "tom holland"],
    },
    {
      soal: "Aktor pemeran Spider-Man versi Marvel Cinematic Universe saat ini?",
      jawaban: "tom holland",
      pilihan: [
        "tom holland",
        "andrew garfield",
        "tobey maguire",
        "timothee chalamet",
      ],
    },
    {
      soal: "Komposer musik film legendaris asal Jerman pembuat scoring Interstellar & Inception?",
      jawaban: "hans zimmer",
      pilihan: [
        "hans zimmer",
        "john williams",
        "ramin djawadi",
        "alan silvestri",
      ],
    },
    {
      soal: "Penyanyi wanita internasional bergenre pop-latin pelantun lagu 'Hips Don't Lie'?",
      jawaban: "shakira",
      pilihan: ["shakira", "jennifer lopez", "beyonce", "dua lipa"],
    },
    {
      soal: "Aktor legendaris seni bela diri Jeet Kune Do asal Tiongkok-Amerika?",
      jawaban: "bruce lee",
      pilihan: ["bruce lee", "jackie chan", "jet li", "donnie yen"],
    },
    {
      soal: "Aktor komedian Hollywood terkenal pemeran Mr. Bean?",
      jawaban: "rowan atkinson",
      pilihan: ["rowan atkinson", "jim carrey", "adam sandler", "steve carell"],
    },
    {
      soal: "Penyanyi solo wanita Indonesia pelantun lagu 'Kali Kedua'?",
      jawaban: "raisa",
      pilihan: ["raisa", "isyana sarasvati", "mahalini", "ziva magnolya"],
    },
    {
      soal: "Penyanyi dan musisi indie Indonesia pencipta lagu 'Celengan Rindu'?",
      jawaban: "fiersa besari",
      pilihan: ["fiersa besari", "hindia", "danilla", "nadin amizah"],
    },
    {
      soal: "Aktor senior Indonesia pemeran utama film horor Pengabdi Setan (sebagai bapak)?",
      jawaban: "bront palarae",
      pilihan: ["bront palarae", "dedie mizwar", "rio dewanto", "arifin putra"],
    },
    {
      soal: "Aktor Hollywood pemeran film John Wick?",
      jawaban: "keanu reeves",
      pilihan: ["keanu reeves", "tom cruise", "matt damon", "brad pitt"],
    },
  ],
  ilmuwan: [
    {
      soal: "Ilmuwan penemu teori relativitas (E=mc²)?",
      jawaban: "albert einstein",
      pilihan: [
        "albert einstein",
        "isaac newton",
        "nikola tesla",
        "thomas edison",
      ],
    },
    {
      soal: "Penemu bola lampu pijar praktis berasal dari Amerika Serikat?",
      jawaban: "thomas edison",
      pilihan: [
        "thomas edison",
        "nikola tesla",
        "albert einstein",
        "alexander graham bell",
      ],
    },
    {
      soal: "Ilmuwan penemu hukum gaya gravitasi setelah kejatuhan apel?",
      jawaban: "isaac newton",
      pilihan: [
        "isaac newton",
        "galileo galilei",
        "albert einstein",
        "michael faraday",
      ],
    },
    {
      soal: "Ilmuwan wanita peraih dua Hadiah Nobel di bidang Fisika dan Kimia?",
      jawaban: "marie curie",
      pilihan: [
        "marie curie",
        "rosalind franklin",
        "ada lovelace",
        "rachel carson",
      ],
    },
    {
      soal: "Penemu teori evolusi melalui seleksi alam pencetus buku 'On the Origin of Species'?",
      jawaban: "charles darwin",
      pilihan: [
        "charles darwin",
        "gregor mendel",
        "louis pasteur",
        "alfred russel wallace",
      ],
    },
    {
      soal: "Penemu arus listrik bolak-balik (AC) dan banyak paten sistem tenaga listrik?",
      jawaban: "nikola tesla",
      pilihan: [
        "nikola tesla",
        "thomas edison",
        "alessandro volta",
        "michael faraday",
      ],
    },
    {
      soal: "Ilmuwan penemu struktur DNA berbentuk double helix bersama Watson?",
      jawaban: "francis crick",
      pilihan: [
        "francis crick",
        "rosalind franklin",
        "charles darwin",
        "gregor mendel",
      ],
    },
    {
      soal: "Astronom penemu teleskop optik canggih pengamat planet-planet di tata surya?",
      jawaban: "galileo galilei",
      pilihan: [
        "galileo galilei",
        "nicolaus copernicus",
        "isaac newton",
        "carl sagan",
      ],
    },
    {
      soal: "Matematikawan dan fisikawan purba penemu hukum dorongan benda cair (Prinsip Archimedes)?",
      jawaban: "archimedes",
      pilihan: ["archimedes", "pythagoras", "euclides", "aristoteles"],
    },
    {
      soal: "Ilmuwan penemu vaksin rabies dan proses sterilisasi kuman (pasteurisasi)?",
      jawaban: "louis pasteur",
      pilihan: [
        "louis pasteur",
        "alexander fleming",
        "robert koch",
        "edward jenner",
      ],
    },
    {
      soal: "Penemu teori heliosentrisme bahwa matahari adalah pusat tata surya?",
      jawaban: "copernicus",
      pilihan: [
        "copernicus",
        "galileo galilei",
        "ptolemaeus",
        "johannes kepler",
      ],
    },
    {
      soal: "Penemu hukum genetika dasar melalui persilangan tanaman kacang ercis?",
      jawaban: "gregor mendel",
      pilihan: [
        "gregor mendel",
        "charles darwin",
        "thomas hunt morgan",
        "francis crick",
      ],
    },
    {
      soal: "Fisikawan teoretis jenius modern penulis buku 'A Brief History of Time' yang menggunakan kursi roda khusus?",
      jawaban: "stephen hawking",
      pilihan: [
        "stephen hawking",
        "albert einstein",
        "richard feynman",
        "niels bohr",
      ],
    },
    {
      soal: "Penemu sinar-X (Rontgen) yang berjasa dalam dunia medis?",
      jawaban: "wilhelm rontgen",
      pilihan: [
        "wilhelm rontgen",
        "marie curie",
        "thomas edison",
        "alexander fleming",
      ],
    },
    {
      soal: "Penemu antibiotik pertama di dunia yaitu penisilin dari jamur?",
      jawaban: "alexander fleming",
      pilihan: [
        "alexander fleming",
        "louis pasteur",
        "robert koch",
        "edward jenner",
      ],
    },
    {
      soal: "Penemu mesin hitung mekanik purba cikal bakal komputer modern?",
      jawaban: "charles babbage",
      pilihan: [
        "charles babbage",
        "alan turing",
        "ada lovelace",
        "blise pascal",
      ],
    },
    {
      soal: "Ilmuwan penemu baterai pertama di dunia (tumpukan volta)?",
      jawaban: "alessandro volta",
      pilihan: [
        "alessandro volta",
        "michael faraday",
        "nikola tesla",
        "georg ohm",
      ],
    },
    {
      soal: "Penemu gelombang elektromagnetik pembawa sinyal radio?",
      jawaban: "heinrich hertz",
      pilihan: [
        "heinrich hertz",
        "guglielmo marconi",
        "james clerk maxwell",
        "nikola tesla",
      ],
    },
    {
      soal: "Ahli kimia penemu tabel periodik unsur unsur kimia?",
      jawaban: "dmitri mendeleev",
      pilihan: [
        "dmitri mendeleev",
        "antoine lavoisier",
        "john dalton",
        "marie curie",
      ],
    },
    {
      soal: "Penemu hukum termodinamika dan peneliti kelistrikan magnet?",
      jawaban: "michael faraday",
      pilihan: [
        "michael faraday",
        "james prescott joule",
        "lord kelvin",
        "james clerk maxwell",
      ],
    },
    {
      soal: "Fisikawan penemu elektron dan perhitungan rasio muatan massa partikel?",
      jawaban: "jj thomson",
      pilihan: [
        "jj thomson",
        "ernest rutherford",
        "niels bohr",
        "james chadwick",
      ],
    },
    {
      soal: "Fisikawan penemu inti atom dan model atom modern?",
      jawaban: "ernest rutherford",
      pilihan: [
        "ernest rutherford",
        "jj thomson",
        "max planck",
        "robert millikan",
      ],
    },
    {
      soal: "Ilmuwan penemu teori kuantum cahaya awal mula fisika kuantum?",
      jawaban: "max planck",
      pilihan: [
        "max planck",
        "albert einstein",
        "niels bohr",
        "werner heisenberg",
      ],
    },
    {
      soal: "Penemu dinamit yang kemudian mendirikan yayasan penghargaan Nobel?",
      jawaban: "alfred nobel",
      pilihan: ["alfred nobel", "thomas edison", "mendeleev", "roentgen"],
    },
    {
      soal: "Astronom wanita pertama penemu komet dan pengamat bintang terkemuka?",
      jawaban: "caroline herschel",
      pilihan: [
        "caroline herschel",
        "marie curie",
        "ada lovelace",
        "rosalind franklin",
      ],
    },
    {
      soal: "Matematikawan wanita pertama penyusun algoritma komputer pertama di dunia?",
      jawaban: "ada lovelace",
      pilihan: ["ada lovelace", "grace hopper", "rachel carson", "marie curie"],
    },
    {
      soal: "Ahli biologi kelautan dan pelopor gerakan pelestarian lingkungan modern?",
      jawaban: "rachel carson",
      pilihan: [
        "rachel carson",
        "jane goodall",
        "dian fossey",
        "caroline herschel",
      ],
    },
    {
      soal: "Penemu skala suhu titik didih dan titik beku air (Celsius)?",
      jawaban: "anders celsius",
      pilihan: [
        "anders celsius",
        "daniel gabriel fahrenheit",
        "lord kelvin",
        "william rankine",
      ],
    },
    {
      soal: "Penemu skala suhu yang menggunakan titik acuan es dan garam amonium (Fahrenheit)?",
      jawaban: "fahrenheit",
      pilihan: ["fahrenheit", "celsius", "kelvin", "reaumur"],
    },
    {
      soal: "Ilmuwan penemu hukum perbandingan tetap dalam ilmu kimia?",
      jawaban: "joseph proust",
      pilihan: [
        "joseph proust",
        "john dalton",
        "antoine lavoisier",
        "amedeo avogadro",
      ],
    },
  ],
};

const activeTimers = {};

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");

  const sock = makeWASocket({
    logger: pino({ level: "silent" }),
    auth: state,
  });

  // Jika belum terhubung, otomatis meminta Pairing Code menggunakan nomor di atas
  if (!sock.authState.creds.registered) {
    setTimeout(async () => {
      try {
        let code = await sock.requestPairingCode(phoneNumber.replace(/[^0-9]/g, ""));
        code = code?.match(/.{1,4}/g)?.join("-") || code;
        console.log("\n----------------------------------------");
        console.log(`> KODE PAIRING WHATSAPP ANDA: ${code}`);
        console.log("----------------------------------------\n");
      } catch (err) {
        console.error("Gagal mendapatkan kode pairing:", err);
      }
    }, 3000);
  }

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "close") {
      const shouldReconnect =
        (lastDisconnect.error instanceof Boom)?.output?.statusCode !==
        DisconnectReason.loggedOut;
      console.log(
        "Koneksi terputus, mencoba menghubungkan ulang:",
        shouldReconnect,
      );

      if (shouldReconnect) {
        connectToWhatsApp();
      }
    } else if (connection === "open") {
      console.log("BERHASIL TERHUBUNG KE WHATSAPP!");
    }
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const m = messages[0];
    if (!m.message || m.key.fromMe) return;

    const sender = m.key.remoteJid;
    const participant = m.key.participant || sender;
    const pushName = m.pushName || "Tanpa Nama";
    const msgType = Object.keys(m.message)[0];

    let text = "";
    if (msgType === "conversation") {
      text = m.message.conversation;
    } else if (msgType === "extendedTextMessage") {
      text = m.message.extendedTextMessage.text;
    } else if (msgType === "imageMessage") {
      text = m.message.imageMessage.caption || "";
    }

    let db = loadDB();
    if (!db.userPoints) db.userPoints = {};
    if (!db.gameSesi) db.gameSesi = {};
    if (!db.lastNyerah) db.lastNyerah = {};

    // --- SISTEM CEK STATUS OFF ---
    if (db.userOff && db.userOff[participant]) {
      const offData = db.userOff[participant];
      const now = Date.now();
      const durasiMs = now - offData.waktuMulai;
      const durasiText = formatDuration(durasiMs);
      const alasan = offData.alasan;

      delete db.userOff[participant];
      saveDB(db);

      const pesanOff = `┌────────────────────────
│ ⏱️ KEMBALI AKTIF
├────────────────────────
│ 👤 : @${participant.split("@")[0]} (${pushName})
│ ⏳ : ${durasiText}
│ 📝 : ${alasan}
└────────────────────────`;

      await sock.sendMessage(
        sender,
        { text: pesanOff, mentions: [participant] },
        { quoted: m },
      );
    }

    // --- INTERAKSI JIKA USER MEMBALAS SETELAH MENYERAH ---
    if (db.lastNyerah[participant] && text) {
      const userText = text.trim().toLowerCase();
      const kunciJawaban = db.lastNyerah[participant];

      delete db.lastNyerah[participant];
      saveDB(db);

      if (
        userText.includes("sapi") ||
        userText.includes("jerapah") ||
        userText.includes("gajah") ||
        userText.includes("flamingo")
      ) {
        await sock.sendMessage(
          sender,
          {
            text: `Ah, benar juga ya! 🐄🦒 Sapi, jerapah, dan beberapa hewan besar memang punya anatomi unik sehingga bisa tidur sambil berdiri. Pintar juga kamu! Wkwk 😄`,
          },
          { quoted: m },
        );
        return;
      } else {
        await sock.sendMessage(
          sender,
          {
            text: `Haha iya betul, selain ${kunciJawaban}, wawasanmu keren juga! Mau coba soal kategori lain? Ketik *.tebak [kategori]* atau *.kuis [kategori]* ya.`,
          },
          { quoted: m },
        );
        return;
      }
    }

    // --- CEK SESI GAME TEBAK-TEBAKAN / KUIS ---
    if (db.gameSesi[participant] && text) {
      const sesi = db.gameSesi[participant];
      const now = Date.now();

      if (now - sesi.waktuMulai > 120000) {
        if (activeTimers[participant]) {
          clearTimeout(activeTimers[participant]);
          delete activeTimers[participant];
        }
        const jawabanUtama = sesi.jawaban;
        delete db.gameSesi[participant];
        saveDB(db);

        await sock.sendMessage(
          sender,
          {
            text: `⏰ Waktu habis! Sesi game ini telah kedaluwarsa (batas waktu 2 menit).\nJawaban yang benar sebelumnya adalah: *${jawabanUtama}*.\n\nSilakan mulai game baru dengan mengetik *.tebak [kategori]* atau *.kuis [kategori]*!`,
          },
          { quoted: m },
        );
        return;
      }

      const jawabanUser = text.trim().toLowerCase();

      if (jawabanUser === ".nyerah") {
        if (activeTimers[participant]) {
          clearTimeout(activeTimers[participant]);
          delete activeTimers[participant];
        }

        const jawabanUtama = sesi.jawaban;
        db.lastNyerah[participant] = jawabanUtama;
        delete db.gameSesi[participant];
        saveDB(db);

        await sock.sendMessage(
          sender,
          {
            text: `❌ Game menyerah! Jawabannya adalah: *${jawabanUtama}*.\n\n(Kamu bisa balas pesan ini kalau mau menyanggah atau ngobrol soal jawabannya! 😄)`,
          },
          { quoted: m },
        );
        return;
      }

      let isBenar = false;

      if (sesi.tipe === "pilgan") {
        const mapping = { a: 0, b: 1, c: 2, d: 3 };
        if (mapping.hasOwnProperty(jawabanUser)) {
          const pilihanTerpilih = sesi.pilihanAcak[mapping[jawabanUser]];
          if (pilihanTerpilih.toLowerCase() === sesi.jawaban.toLowerCase()) {
            isBenar = true;
          }
        }
      } else {
        isBenar = sesi.jawaban.toLowerCase() === jawabanUser;
      }

      if (isBenar) {
        if (activeTimers[participant]) {
          clearTimeout(activeTimers[participant]);
          delete activeTimers[participant];
        }

        if (!db.userPoints[participant]) db.userPoints[participant] = 0;
        db.userPoints[participant] += 10;
        const totalPoin = db.userPoints[participant];

        delete db.gameSesi[participant];
        saveDB(db);

        const pesanMenang = `┌────────────────────────
│ 🎉 JAWABAN BENAR!
├────────────────────────
│ 👤 : @${participant.split("@")[0]} (${pushName})
│ ✨ : +10 Poin
│ 🏆 : Total Poin : *${totalPoin}*
└────────────────────────`;

        await sock.sendMessage(
          sender,
          { text: pesanMenang, mentions: [participant] },
          { quoted: m },
        );
        return;
      } else {
        await sock.sendMessage(
          sender,
          {
            text: `❌ Masih salah! Coba tebak lagi atau ketik *.nyerah* untuk berhenti.`,
          },
          { quoted: m },
        );
        return;
      }
    }

    if (!text) return;
    const args = text.trim().split(" ");
    const command = args[0].toLowerCase();
    const query = args.slice(1).join(" ");

    // --- 1. FITUR MENU UTAMA (.menu) ---
    if (command === ".menu" || command === ".help") {
      const menuText = `┌────────────────────────
│ 🤖 *DAFTAR MENU BOT*
├────────────────────────
│ *🛠️ UTAMA & TOOLS*
│ • !ping
│ • .stiker (kirim/reply foto)
│ • .off [alasan]
│ 
│ *📋 ABSENSI*
│ • .absen (1x sehari)
│ • .rekapabsen
│ 
│ *📥 DOWNLOADER*
│ • .tiktok [link]
│ • .dl [link ig/fb/tt]
│ 
│ *🎮 GAME TEBAK & KUIS (Batas Waktu: 2 Menit)*
│ • .tebak [buah/negara/hewan/artis/ilmuwan]
│ • .kuis [buah/negara/hewan/artis/ilmuwan]
│ • .poin / .cekpoin
└────────────────────────`;

      await sock.sendMessage(sender, { text: menuText }, { quoted: m });
      return;
    }

    // --- 2. FITUR PING ---
    if (command === "!ping") {
      await sock.sendMessage(
        sender,
        { text: "Dongo ngape manggil manggil" },
        { quoted: m },
      );
      return;
    }

    // --- 3. FITUR STIKER ---
    const isImage = msgType === "imageMessage";
    const quotedMsg = m.message.extendedTextMessage?.contextInfo?.quotedMessage;
    const isQuotedImage =
      quotedMsg &&
      (quotedMsg.imageMessage ||
        quotedMsg.viewOnceMessageV2?.message?.imageMessage);

    if (command === ".stiker" && (isImage || isQuotedImage)) {
      try {
        await sock.sendMessage(
          sender,
          { text: "Sedang membuat stiker, sebentar ya..." },
          { quoted: m },
        );

        let targetMsg = m;
        if (isQuotedImage) {
          targetMsg = {
            key: {
              remoteJid: sender,
              id: m.message.extendedTextMessage.contextInfo.stanzaId,
            },
            message: quotedMsg,
          };
        }

        const buffer = await downloadMediaMessage(
          targetMsg,
          "buffer",
          {},
          {
            logger: pino({ level: "silent" }),
            reconnect: sock,
          },
        );
        const sticker = new Sticker(buffer, {
          pack: "Bot WhatsApp",
          author: "Raihan Bot",
          type: StickerTypes.FULL,
          categories: ["🤩", "🎉"],
          quality: 50,
        });

        const bufferStiker = await sticker.toBuffer();
        await sock.sendMessage(
          sender,
          { sticker: bufferStiker },
          { quoted: m },
        );
      } catch (err) {
        console.error(err);
        await sock.sendMessage(
          sender,
          {
            text: "Gagal membuat stiker! Pastikan Anda mereply gambar yang benar.",
          },
          { quoted: m },
        );
      }
      return;
    }

    // --- 4. FITUR ABSEN ---
    if (command === ".absen" || command === ".hadir") {
      const options = {
        timeZone: "Asia/Jakarta",
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      };
      const tanggalHariIni = new Date().toLocaleDateString("id-ID", options);

      if (!db.absensi) db.absensi = [];
      const sudahAbsenHariIni = db.absensi.find(
        (item) => item.id === participant && item.tanggal === tanggalHariIni,
      );

      if (sudahAbsenHariIni) {
        const pesanGagal = `┌────────────────────────
│ ⚠️ TAK BOLEH BRO KITE NI SEKALI JE ABSEN
├────────────────────────
│ 👤 : @${participant.split("@")[0]} (${pushName})
│ ❌ : Bego! udah absen malah absen lagi
└────────────────────────`;
        await sock.sendMessage(
          sender,
          { text: pesanGagal, mentions: [participant] },
          { quoted: m },
        );
        return;
      }

      db.absensi.push({
        id: participant,
        nama: pushName,
        tanggal: tanggalHariIni,
      });
      const absenHariIniList = db.absensi.filter(
        (item) => item.tanggal === tanggalHariIni,
      );
      saveDB(db);

      const pesanAbsen = `┌────────────────────────
│ ✅ ABSENSI BERHASIL
├────────────────────────
│ 👤 : @${participant.split("@")[0]} (${pushName})
│ 📅 : ${tanggalHariIni}
│ 🎖️ : Urutan Hadir : #${absenHariIniList.length}
└────────────────────────`;

      await sock.sendMessage(
        sender,
        { text: pesanAbsen, mentions: [participant] },
        { quoted: m },
      );
      return;
    }

    if (command === ".rekapabsen") {
      const options = {
        timeZone: "Asia/Jakarta",
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      };
      const tanggalHariIni = new Date().toLocaleDateString("id-ID", options);
      const absenHariIniList = (db.absensi || []).filter(
        (item) => item.tanggal === tanggalHariIni,
      );

      if (absenHariIniList.length === 0) {
        await sock.sendMessage(
          sender,
          { text: "Belum ada data absensi untuk hari ini." },
          { quoted: m },
        );
        return;
      }

      let rekapText = `┌────────────────────────\n│ 📋 REKAP ABSEN HARI INI\n├────────────────────────\n`;
      absenHariIniList.forEach((item, index) => {
        rekapText += `│ ${index + 1}. ${item.nama}\n`;
      });
      rekapText += `└────────────────────────`;

      await sock.sendMessage(sender, { text: rekapText }, { quoted: m });
      return;
    }

    // --- 5. FITUR MODE OFF ---
    if (command === ".off") {
      const alasanOff = query ? query : "Mau tidur";
      db.userOff[participant] = { waktuMulai: Date.now(), alasan: alasanOff };
      saveDB(db);

      const pesanOffAktif = `┌────────────────────────
│ 💤 MODE OFF AKTIF
├────────────────────────
│ 👤 : @${participant.split("@")[0]} (${pushName})
│ 📝 : ${alasanOff}
└────────────────────────`;

      await sock.sendMessage(
        sender,
        { text: pesanOffAktif, mentions: [participant] },
        { quoted: m },
      );
      return;
    }

    // --- 6. FITUR GAME TEBAK-TEBAKAN (ISIAN) ---
    if (command === ".tebak") {
      if (db.gameSesi[participant]) {
        await sock.sendMessage(
          sender,
          {
            text: "⚠️ Kamu masih punya pertanyaan aktif! Jawab dulu atau ketik .nyerah",
          },
          { quoted: m },
        );
        return;
      }

      const kategori = query.toLowerCase();
      if (!bankSoal[kategori]) {
        await sock.sendMessage(
          sender,
          {
            text: "⚠️ Kategori tidak valid!\nPilih kategori berikut:\n• .tebak buah\n• .tebak negara\n• .tebak hewan\n• .tebak artis\n• .tebak ilmuwan",
          },
          { quoted: m },
        );
        return;
      }

      const listSoal = bankSoal[kategori];
      const soalPilihan = listSoal[Math.floor(Math.random() * listSoal.length)];

      const waktuMulai = Date.now();
      const timer = setTimeout(async () => {
        let currentDb = loadDB();
        if (
          currentDb.gameSesi[participant] &&
          currentDb.gameSesi[participant].waktuMulai === waktuMulai
        ) {
          delete currentDb.gameSesi[participant];
          delete activeTimers[participant];
          saveDB(currentDb);
          await sock.sendMessage(sender, {
            text: `⏰ Waktu habis! Batas waktu 2 menit untuk soal ini telah berakhir.\nJawaban yang benar adalah: *${soalPilihan.jawaban}*.`,
          });
        }
      }, 120000);

      activeTimers[participant] = timer;

      db.gameSesi[participant] = {
        tipe: "isian",
        jawaban: soalPilihan.jawaban,
        waktuMulai: waktuMulai,
      };
      saveDB(db);

      const pesanTebak = `┌────────────────────────
│ 🎮 TEBAK (${kategori.toUpperCase()})
├────────────────────────
│ ❓ : ${soalPilihan.soal}
│ ⏱️ : Batas Waktu : *2 Menit*
│ 🎁 : Hadiah : +10 Poin
│ 💡 : Balas chat ini dengan jawabanmu!
└────────────────────────`;

      await sock.sendMessage(sender, { text: pesanTebak }, { quoted: m });
      return;
    }

    // --- 7. FITUR GAME KUIS (PILIHAN BERGANDA A, B, C, D) ---
    if (command === ".kuis") {
      if (db.gameSesi[participant]) {
        await sock.sendMessage(
          sender,
          {
            text: "⚠️ Kamu masih punya pertanyaan aktif! Jawab dulu atau ketik .nyerah",
          },
          { quoted: m },
        );
        return;
      }

      const kategori = query.toLowerCase();
      if (!bankSoal[kategori]) {
        await sock.sendMessage(
          sender,
          {
            text: "⚠️ Kategori tidak valid!\nPilih kategori berikut:\n• .kuis buah\n• .kuis negara\n• .kuis hewan\n• .kuis artis\n• .kuis ilmuwan",
          },
          { quoted: m },
        );
        return;
      }

      const listSoal = bankSoal[kategori];
      const soalPilihan = listSoal[Math.floor(Math.random() * listSoal.length)];
      const pilihanAcak = shuffleArray(soalPilihan.pilihan);

      const waktuMulai = Date.now();
      const timer = setTimeout(async () => {
        let currentDb = loadDB();
        if (
          currentDb.gameSesi[participant] &&
          currentDb.gameSesi[participant].waktuMulai === waktuMulai
        ) {
          delete currentDb.gameSesi[participant];
          delete activeTimers[participant];
          saveDB(currentDb);
          await sock.sendMessage(sender, {
            text: `⏰ Waktu habis! Batas waktu 2 menit untuk soal kuis ini telah berakhir.\nJawaban yang benar adalah: *${soalPilihan.jawaban}*.`,
          });
        }
      }, 120000);

      activeTimers[participant] = timer;

      db.gameSesi[participant] = {
        tipe: "pilgan",
        jawaban: soalPilihan.jawaban,
        pilihanAcak: pilihanAcak,
        waktuMulai: waktuMulai,
      };
      saveDB(db);

      const pesanKuis = `┌────────────────────────
│ 🧠 KUIS PILIHAN GANDA (${kategori.toUpperCase()})
├────────────────────────
│ ❓ : ${soalPilihan.soal}
│ 
│ A. ${pilihanAcak[0]}
│ B. ${pilihanAcak[1]}
│ C. ${pilihanAcak[2]}
│ D. ${pilihanAcak[3]}
│ 
│ ⏱️ : Batas Waktu : *2 Menit*
│ 🎁 : Hadiah : +10 Poin
│ 💡 : Balas dengan huruf *A, B, C, atau D*!
└────────────────────────`;

      await sock.sendMessage(sender, { text: pesanKuis }, { quoted: m });
      return;
    }

    if (command === ".poin" || command === ".cekpoin") {
      const poinUser = db.userPoints[participant] || 0;
      const pesanPoin = `┌────────────────────────
│ 🏆 INFORMASI POIN
├────────────────────────
│ 👤 : @${participant.split("@")[0]} (${pushName})
│ ⭐ : Poin Anda : *${poinUser}*
└────────────────────────`;

      await sock.sendMessage(
        sender,
        { text: pesanPoin, mentions: [participant] },
        { quoted: m },
      );
      return;
    }

    // --- 8. FITUR DOWNLOADER ---
    if (command === ".tiktok" || command === ".tt" || command === ".dl") {
      if (!query) {
        await sock.sendMessage(
          sender,
          { text: `Contoh: ${command} [link_video]` },
          { quoted: m },
        );
        return;
      }

      try {
        await sock.sendMessage(
          sender,
          { text: "Sedang mendownload video/foto dari link..." },
          { quoted: m },
        );
        const apiResponse = await axios.get(
          `https://api.siputzx.my.id/api/s/all?url=${encodeURIComponent(query)}`,
        );
        const result = apiResponse.data;

        if (result && result.status && result.data && result.data.length > 0) {
          const mediaUrl = result.data[0].url || result.data[0].dl;
          await sock.sendMessage(
            sender,
            {
              video: { url: mediaUrl },
              caption: "Berhasil mendownload media dari link!",
            },
            { quoted: m },
          );
        } else {
          await sock.sendMessage(
            sender,
            { text: "Gagal mengambil media. Pastikan link publik dan benar!" },
            { quoted: m },
          );
        }
      } catch (error) {
        await sock.sendMessage(
          sender,
          { text: "Terjadi kesalahan saat mendownload media." },
          { quoted: m },
        );
      }
      return;
    }
  });
}

connectToWhatsApp();
