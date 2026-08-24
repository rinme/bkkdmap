import json
import math
from scipy.spatial import Voronoi

# All 50 Official Bangkok Districts (Khet / เขต)
districts_data = [
    {
        "id": "phra-nakhon",
        "code": "1001",
        "nameEn": "Phra Nakhon",
        "nameTh": "พระนคร",
        "zone": "Bangkok Central",
        "zoneTh": "กรุงเทพกลาง",
        "center": [100.499, 13.754],
        "areaKm2": 5.5,
        "isRiver": True,
        "popularLandmarks": ["Grand Palace & Emerald Buddha", "Wat Pho (Reclining Buddha)", "Khaosan Road", "Sanam Luang", "Giant Swing (Sao Chingcha)", "Tha Tien Pier"]
    },
    {
        "id": "dusit",
        "code": "1002",
        "nameEn": "Dusit",
        "nameTh": "ดุสิต",
        "zone": "Bangkok Central",
        "zoneTh": "กรุงเทพกลาง",
        "center": [100.521, 13.778],
        "areaKm2": 10.7,
        "isRiver": True,
        "popularLandmarks": ["Ananta Samakhom Throne Hall", "Wat Benchamabophit (Marble Temple)", "Dusit Palace", "Parliament House (Sappaya-Sapasathan)", "Chitralada Royal Villa"]
    },
    {
        "id": "nong-chok",
        "code": "1003",
        "nameEn": "Nong Chok",
        "nameTh": "หนองจอก",
        "zone": "Bangkok East",
        "zoneTh": "กรุงเทพตะวันออก",
        "center": [100.865, 13.855],
        "areaKm2": 236.3,
        "isRiver": False,
        "popularLandmarks": ["Nong Chok Public Park", "Bangkok Futsal Arena", "Mahanakorn University of Technology", "Nong Chok Waterfront Market"]
    },
    {
        "id": "bang-rak",
        "code": "1004",
        "nameEn": "Bang Rak",
        "nameTh": "บางรัก",
        "zone": "Bangkok South",
        "zoneTh": "กรุงเทพใต้",
        "center": [100.528, 13.726],
        "areaKm2": 5.5,
        "isRiver": True,
        "popularLandmarks": ["King Power Mahanakhon (SkyWalk)", "Silom Road", "Sri Maha Mariamman Temple (Wat Khaek)", "Charoen Krung Creative District", "Bangkok General Post Office (TCDC)"]
    },
    {
        "id": "bang-khen",
        "code": "1005",
        "nameEn": "Bang Khen",
        "nameTh": "บางเขน",
        "zone": "Bangkok North",
        "zoneTh": "กรุงเทพเหนือ",
        "center": [100.598, 13.873],
        "areaKm2": 42.1,
        "isRiver": False,
        "popularLandmarks": ["Wat Phra Si Mahathat Wora Maha Vihan", "Kasetsart University", "Central Ramindra", "Lumpinee Boxing Stadium (Ramintra)"]
    },
    {
        "id": "bang-kapi",
        "code": "1006",
        "nameEn": "Bang Kapi",
        "nameTh": "บางกะปิ",
        "zone": "Bangkok East",
        "zoneTh": "กรุงเทพตะวันออก",
        "center": [100.647, 13.765],
        "areaKm2": 28.5,
        "isRiver": False,
        "popularLandmarks": ["The Mall Lifestore Bangkapi", "Rajamangala National Stadium (SAT)", "Ramkhamhaeng University", "Tawanna Night Market"]
    },
    {
        "id": "pathum-wan",
        "code": "1007",
        "nameEn": "Pathum Wan",
        "nameTh": "ปทุมวัน",
        "zone": "Bangkok Central",
        "zoneTh": "กรุงเทพกลาง",
        "center": [100.533, 13.744],
        "areaKm2": 8.4,
        "isRiver": False,
        "popularLandmarks": ["CentralWorld", "Siam Paragon", "Siam Square", "Erawan Shrine", "MBK Center", "Chulalongkorn University", "Bangkok Art and Culture Centre (BACC)"]
    },
    {
        "id": "pom-prap-sattru-phai",
        "code": "1008",
        "nameEn": "Pom Prap Sattru Phai",
        "nameTh": "ป้อมปราบศัตรูพ่าย",
        "zone": "Bangkok Central",
        "zoneTh": "กรุงเทพกลาง",
        "center": [100.511, 13.754],
        "areaKm2": 1.9,
        "isRiver": False,
        "popularLandmarks": ["Wat Saket (Golden Mount)", "Khlong Thom Market", "Bobae Garment Market", "Ratchadamnoen Boxing Stadium", "Wat Mangkon Kamalawat (adjacent)"]
    },
    {
        "id": "phra-khanong",
        "code": "1009",
        "nameEn": "Phra Khanong",
        "nameTh": "พระโขนง",
        "zone": "Bangkok South",
        "zoneTh": "กรุงเทพใต้",
        "center": [100.605, 13.698],
        "areaKm2": 14.0,
        "isRiver": False,
        "popularLandmarks": ["True Digital Park", "Wat Thammamongkhon", "Sukhumvit 101/1 Food Trail", "W District (Phra Khanong area)"]
    },
    {
        "id": "min-buri",
        "code": "1010",
        "nameEn": "Min Buri",
        "nameTh": "มีนบุรี",
        "zone": "Bangkok East",
        "zoneTh": "กรุงเทพตะวันออก",
        "center": [100.748, 13.814],
        "areaKm2": 63.6,
        "isRiver": False,
        "popularLandmarks": ["Min Buri Old Market", "Safari World Bangkok", "Siam Amazing Park (Siam Park City)", "Khwaeng Saen Saep Riverside"]
    },
    {
        "id": "lat-krabang",
        "code": "1011",
        "nameEn": "Lat Krabang",
        "nameTh": "ลาดกระบัง",
        "zone": "Bangkok East",
        "zoneTh": "กรุงเทพตะวันออก",
        "center": [100.788, 13.723],
        "areaKm2": 123.9,
        "isRiver": False,
        "popularLandmarks": ["King Mongkut's Institute of Technology Ladkrabang (KMITL)", "Siam Premium Outlets Bangkok", "Hua Takhe Old Floating Market", "Robinsons Lifestyle Lat Krabang"]
    },
    {
        "id": "yan-nawa",
        "code": "1012",
        "nameEn": "Yan Nawa",
        "nameTh": "ยานนาวา",
        "zone": "Bangkok South",
        "zoneTh": "กรุงเทพใต้",
        "center": [100.542, 13.696],
        "areaKm2": 16.7,
        "isRiver": True,
        "popularLandmarks": ["Bhumibol 1 & 2 Bridges (Mega Bridge)", "Rama III Riverside Promenade", "Central Rama 3", "Wat Pariwat (Sculpture Temple)"]
    },
    {
        "id": "samphanthawong",
        "code": "1013",
        "nameEn": "Samphanthawong",
        "nameTh": "สัมพันธวงศ์",
        "zone": "Bangkok Central",
        "zoneTh": "กรุงเทพกลาง",
        "center": [100.514, 13.738],
        "areaKm2": 1.4,
        "isRiver": True,
        "popularLandmarks": ["Yaowarat Road (Chinatown Street Food)", "Wat Traimit (Golden Buddha)", "Sampheng Wholesale Market", "Odeon Circle (China Gate)", "Song Wat Road Hip Heritage District"]
    },
    {
        "id": "phaya-thai",
        "code": "1014",
        "nameEn": "Phaya Thai",
        "nameTh": "พญาไท",
        "zone": "Bangkok Central",
        "zoneTh": "กรุงเทพกลาง",
        "center": [100.542, 13.780],
        "areaKm2": 9.6,
        "isRiver": False,
        "popularLandmarks": ["Ari Neighborhood (Hipster Cafes & Eateries)", "Phaya Thai Palace", "Government Savings Bank HQ", "The Camping Ground Pradipat"]
    },
    {
        "id": "thon-buri",
        "code": "1015",
        "nameEn": "Thon Buri",
        "nameTh": "ธนบุรี",
        "zone": "Thonburi North",
        "zoneTh": "กรุงธนเหนือ",
        "center": [100.487, 13.722],
        "areaKm2": 8.6,
        "isRiver": True,
        "popularLandmarks": ["Wongwian Yai (King Taksin Monument)", "Wat Prayurawongsawat (White Chedi)", "Kudi Chin Portuguese Catholic Community", "Wat Kalayanamitr"]
    },
    {
        "id": "bangkok-yai",
        "code": "1016",
        "nameEn": "Bangkok Yai",
        "nameTh": "บางกอกใหญ่",
        "zone": "Thonburi North",
        "zoneTh": "กรุงธนเหนือ",
        "center": [100.474, 13.734],
        "areaKm2": 6.2,
        "isRiver": True,
        "popularLandmarks": ["Wat Arun (Temple of Dawn)", "Wat Hong Rattanaram", "Wichai Prasit Fort", "Royal Thai Navy Headquarters"]
    },
    {
        "id": "huai-khwang",
        "code": "1017",
        "nameEn": "Huai Khwang",
        "nameTh": "ห้วยขวาง",
        "zone": "Bangkok Central",
        "zoneTh": "กรุงเทพกลาง",
        "center": [100.579, 13.778],
        "areaKm2": 15.0,
        "isRiver": False,
        "popularLandmarks": ["Huai Khwang Ganesha Shrine", "Huai Khwang Night Market", "The Street Ratchada (24h Mall)", "Thailand Cultural Centre", "Pracha Rat Bamphen (New Chinatown)"]
    },
    {
        "id": "khlong-san",
        "code": "1018",
        "nameEn": "Khlong San",
        "nameTh": "คลองสาน",
        "zone": "Thonburi North",
        "zoneTh": "กรุงธนเหนือ",
        "center": [100.505, 13.728],
        "areaKm2": 6.1,
        "isRiver": True,
        "popularLandmarks": ["ICONSIAM & ICS", "The Jam Factory (Creative Hub)", "Lhong 1919 (Heritage Pier)", "Princess Mother Memorial Park", "Khlong San Plaza Market"]
    },
    {
        "id": "taling-chan",
        "code": "1019",
        "nameEn": "Taling Chan",
        "nameTh": "ตลิ่งชัน",
        "zone": "Thonburi North",
        "zoneTh": "กรุงธนเหนือ",
        "center": [100.448, 13.777],
        "areaKm2": 29.5,
        "isRiver": False,
        "popularLandmarks": ["Taling Chan Floating Market", "Khlong Lat Mayom Floating Market", "Song Khlong Floating Market", "Baan Silapin (Artist's House Canal route)"]
    },
    {
        "id": "bangkok-noi",
        "code": "1020",
        "nameEn": "Bangkok Noi",
        "nameTh": "บางกอกน้อย",
        "zone": "Thonburi North",
        "zoneTh": "กรุงธนเหนือ",
        "center": [100.472, 13.758],
        "areaKm2": 11.9,
        "isRiver": True,
        "popularLandmarks": ["Siriraj Hospital & Medical Museum", "Wang Lang Market (Food & Thrift)", "National Museum of Royal Barges", "Thonburi Train Station Pier"]
    },
    {
        "id": "bang-khun-thian",
        "code": "1021",
        "nameEn": "Bang Khun Thian",
        "nameTh": "บางขุนเทียน",
        "zone": "Thonburi South",
        "zoneTh": "กรุงธนใต้",
        "center": [100.428, 13.585],
        "areaKm2": 120.7,
        "isRiver": False,
        "popularLandmarks": ["Bangkok Sea View (Bangkok's Only Coastline)", "Mangrove Forest Ecological Boardwalk", "Khun Kala Crab Farm & Seafood Village", "Central Rama 2"]
    },
    {
        "id": "phasi-charoen",
        "code": "1022",
        "nameEn": "Phasi Charoen",
        "nameTh": "ภาษีเจริญ",
        "zone": "Thonburi South",
        "zoneTh": "กรุงธนใต้",
        "center": [100.437, 13.719],
        "areaKm2": 17.8,
        "isRiver": False,
        "popularLandmarks": ["Wat Paknam Phasi Charoen (Giant Golden Buddha)", "Khlong Bang Luang Artist House", "Seacon Bangkae", "Phasi Charoen Canal Walk"]
    },
    {
        "id": "nong-khaem",
        "code": "1023",
        "nameEn": "Nong Khaem",
        "nameTh": "หนองแขม",
        "zone": "Thonburi South",
        "zoneTh": "กรุงธนใต้",
        "center": [100.354, 13.705],
        "areaKm2": 35.8,
        "isRiver": False,
        "popularLandmarks": ["Wat Nong Khaem", "Victoria Gardens Community Mall", "Thonburi University", "Phutthamonthon Sai 3 Park Area"]
    },
    {
        "id": "rat-burana",
        "code": "1024",
        "nameEn": "Rat Burana",
        "nameTh": "ราษฎร์บูรณะ",
        "zone": "Thonburi South",
        "zoneTh": "กรุงธนใต้",
        "center": [100.499, 13.682],
        "areaKm2": 15.8,
        "isRiver": True,
        "popularLandmarks": ["Kasikornbank Head Office (Riverside)", "Wat Rat Burana", "Rama IX Bridge Viewpoint", "Rat Burana Pier"]
    },
    {
        "id": "bang-phlat",
        "code": "1025",
        "nameEn": "Bang Phlat",
        "nameTh": "บางพลัด",
        "zone": "Thonburi North",
        "zoneTh": "กรุงธนเหนือ",
        "center": [100.492, 13.792],
        "areaKm2": 11.4,
        "isRiver": True,
        "popularLandmarks": ["ChangChui Creative Park (Plane Landmark)", "Rama VIII Park (Bridge Vista)", "Krung Thon Bridge (Sang Hi)", "Lotus Bang Phlat"]
    },
    {
        "id": "din-daeng",
        "code": "1026",
        "nameEn": "Din Daeng",
        "nameTh": "ดินแดง",
        "zone": "Bangkok Central",
        "zoneTh": "กรุงเทพกลาง",
        "center": [100.558, 13.769],
        "areaKm2": 8.4,
        "isRiver": False,
        "popularLandmarks": ["Bangkok City Hall 2 (Din Daeng)", "Thai-Japan Bangkok Youth Center", "University of the Thai Chamber of Commerce (UTCC)", "Din Daeng Flats Urban Area"]
    },
    {
        "id": "bueng-kum",
        "code": "1027",
        "nameEn": "Bueng Kum",
        "nameTh": "บึงกุ่ม",
        "zone": "Bangkok East",
        "zoneTh": "กรุงเทพตะวันออก",
        "center": [100.669, 13.799],
        "areaKm2": 24.3,
        "isRiver": False,
        "popularLandmarks": ["Nawamin Phirom Public Park", "The Walk Kaset-Nawamin", "Chokchai 4 - Prasert Manukitch Food Belt", "Wat Nuan Chan"]
    },
    {
        "id": "sathon",
        "code": "1028",
        "nameEn": "Sathon",
        "nameTh": "สาทร",
        "zone": "Bangkok South",
        "zoneTh": "กรุงเทพใต้",
        "center": [100.528, 13.708],
        "areaKm2": 9.3,
        "isRiver": True,
        "popularLandmarks": ["Sathorn Central Business District (Empire Tower, Sathorn Square)", "Wat Yannawa (Boat Temple)", "Saint Louis Hospital / Soi Saint Louis Food", "Chong Nonsi Skybridge", "BRT Sathorn Station"]
    },
    {
        "id": "bang-sue",
        "code": "1029",
        "nameEn": "Bang Sue",
        "nameTh": "บางซื่อ",
        "zone": "Bangkok North",
        "zoneTh": "กรุงเทพเหนือ",
        "center": [100.531, 13.824],
        "areaKm2": 11.5,
        "isRiver": True,
        "popularLandmarks": ["SCG Headquarters (Bang Sue)", "Gateway at Bangsue", "Rama VII Bridge Riverside Pier", "Wat Soi Thong (Chao Phraya River)"]
    },
    {
        "id": "chatuchak",
        "code": "1030",
        "nameEn": "Chatuchak",
        "nameTh": "จตุจักร",
        "zone": "Bangkok North",
        "zoneTh": "กรุงเทพเหนือ",
        "center": [100.560, 13.829],
        "areaKm2": 32.9,
        "isRiver": False,
        "popularLandmarks": ["Chatuchak Weekend Market (JJ Market)", "Krung Thep Aphiwat Central Terminal (Bang Sue Grand Station)", "Central Ladprao", "Chatuchak Park & Vachirabenjatas Park (Rot Fai Park)", "Union Mall"]
    },
    {
        "id": "bang-kho-laem",
        "code": "1031",
        "nameEn": "Bang Kho Laem",
        "nameTh": "บางคอแหลม",
        "zone": "Bangkok South",
        "zoneTh": "กรุงเทพใต้",
        "center": [100.505, 13.693],
        "areaKm2": 4.9,
        "isRiver": True,
        "popularLandmarks": ["Asiatique The Riverfront (Ferris Wheel)", "Wat Phraya Krai", "Rama III Riverside Hotels", "Charoen Krung Soi 107"]
    },
    {
        "id": "prawet",
        "code": "1032",
        "nameEn": "Prawet",
        "nameTh": "ประเวศ",
        "zone": "Bangkok East",
        "zoneTh": "กรุงเทพตะวันออก",
        "center": [100.695, 13.717],
        "areaKm2": 52.5,
        "isRiver": False,
        "popularLandmarks": ["King Rama IX Royal Public Park (Suan Luang Rama IX)", "Seacon Square Srinakarin", "Paradise Park", "Srinagarindra Train Night Market (Talat Rot Fai)"]
    },
    {
        "id": "khlong-toei",
        "code": "1033",
        "nameEn": "Khlong Toei",
        "nameTh": "คลองเตย",
        "zone": "Bangkok South",
        "zoneTh": "กรุงเทพใต้",
        "center": [100.575, 13.715],
        "areaKm2": 13.0,
        "isRiver": True,
        "popularLandmarks": ["Queen Sirikit National Convention Center (QSNCC)", "Benjakitti Forest Park", "Khlong Toei Wet Market", "EM District (Emporium, EmQuartier, EmSphere)", "K-Village"]
    },
    {
        "id": "suan-luang",
        "code": "1034",
        "nameEn": "Suan Luang",
        "nameTh": "สวนหลวง",
        "zone": "Bangkok South",
        "zoneTh": "กรุงเทพใต้",
        "center": [100.644, 13.731],
        "areaKm2": 23.7,
        "isRiver": False,
        "popularLandmarks": ["Thanya Park Srinakarin", "Wat Mahabut (Mae Nak Phra Khanong Shrine)", "Pattanakarn Road Food District", "Airport Rail Link Hua Mak"]
    },
    {
        "id": "chom-thong",
        "code": "1035",
        "nameEn": "Chom Thong",
        "nameTh": "จอมทอง",
        "zone": "Thonburi South",
        "zoneTh": "กรุงธนใต้",
        "center": [100.463, 13.677],
        "areaKm2": 26.3,
        "isRiver": False,
        "popularLandmarks": ["Wat Sai Floating Market (Historic Area)", "Wat Ratchaorasaram", "Ekkachai - Rama 2 Hub", "Dao Khanong Commercial Street"]
    },
    {
        "id": "don-mueang",
        "code": "1036",
        "nameEn": "Don Mueang",
        "nameTh": "ดอนเมือง",
        "zone": "Bangkok North",
        "zoneTh": "กรุงเทพเหนือ",
        "center": [100.593, 13.913],
        "areaKm2": 36.8,
        "isRiver": False,
        "popularLandmarks": ["Don Mueang International Airport (DMK)", "Royal Thai Air Force Museum", "Wat Don Mueang", "Songprapha Street Food Market"]
    },
    {
        "id": "ratchathewi",
        "code": "1037",
        "nameEn": "Ratchathewi",
        "nameTh": "ราชเทวี",
        "zone": "Bangkok Central",
        "zoneTh": "กรุงเทพกลาง",
        "center": [100.535, 13.759],
        "areaKm2": 7.1,
        "isRiver": False,
        "popularLandmarks": ["Victory Monument (Anusawari Chai Samoraphum)", "Platinum Fashion Mall", "Baiyoke Tower II Sky Buffet", "Pratunam Wholesale Clothing Market", "King Power Rangnam Complex"]
    },
    {
        "id": "lat-phrao",
        "code": "1038",
        "nameEn": "Lat Phrao",
        "nameTh": "ลาดพร้าว",
        "zone": "Bangkok North",
        "zoneTh": "กรุงเทพเหนือ",
        "center": [100.612, 13.804],
        "areaKm2": 21.5,
        "isRiver": False,
        "popularLandmarks": ["Central EastVille (Pet-Friendly Lifestyle Mall)", "The Crystal Ekkamai-Ramindra", "Sena Fest & Chokchai 4 Food Alley", "Wat Lat Phrao"]
    },
    {
        "id": "watthana",
        "code": "1039",
        "nameEn": "Watthana",
        "nameTh": "วัฒนา",
        "zone": "Bangkok South",
        "zoneTh": "กรุงเทพใต้",
        "center": [100.587, 13.738],
        "areaKm2": 12.6,
        "isRiver": False,
        "popularLandmarks": ["Thong Lo (Sukhumvit 55 Lifestyle & Bars)", "Ekkamai (Sukhumvit 63 Cafes)", "Terminal 21 Asok", "Benchasiri Park", "The Commons Thonglor"]
    },
    {
        "id": "bang-khae",
        "code": "1040",
        "nameEn": "Bang Khae",
        "nameTh": "บางแค",
        "zone": "Thonburi South",
        "zoneTh": "กรุงธนใต้",
        "center": [100.395, 13.712],
        "areaKm2": 44.5,
        "isRiver": False,
        "popularLandmarks": ["The Mall Lifestore Bangkae", "Bang Khae Fresh Market (Talat Bang Khae)", "Wat Nimmanoradee Floating Market", "MRT Lak Song Terminal"]
    },
    {
        "id": "lak-si",
        "code": "1041",
        "nameEn": "Lak Si",
        "nameTh": "หลักสี่",
        "zone": "Bangkok North",
        "zoneTh": "กรุงเทพเหนือ",
        "center": [100.579, 13.887],
        "areaKm2": 22.8,
        "isRiver": False,
        "popularLandmarks": ["Chaeng Watthana Government Complex", "IT Square Laksi", "Wat Lak Si", "Chulabhorn Research Institute"]
    },
    {
        "id": "sai-mai",
        "code": "1042",
        "nameEn": "Sai Mai",
        "nameTh": "สายไหม",
        "zone": "Bangkok North",
        "zoneTh": "กรุงเทพเหนือ",
        "center": [100.646, 13.914],
        "areaKm2": 44.6,
        "isRiver": False,
        "popularLandmarks": ["Ying Charoen Market (Saphan Mai)", "Air Force Base Sports Complex", "Wat Yu Di Bamrung Tham (Wat Or Ngoen)", "Sai Mai Community Parks"]
    },
    {
        "id": "khan-na-yao",
        "code": "1043",
        "nameEn": "Khan Na Yao",
        "nameTh": "คันนายาว",
        "zone": "Bangkok East",
        "zoneTh": "กรุงเทพตะวันออก",
        "center": [100.686, 13.816],
        "areaKm2": 16.7,
        "isRiver": False,
        "popularLandmarks": ["Fashion Island Mall", "The Promenade Lifestyle Mall", "Amorini Mall Ramintra", "Wat Rachanadda Kannayao"]
    },
    {
        "id": "saphan-sung",
        "code": "1044",
        "nameEn": "Saphan Sung",
        "nameTh": "สะพานสูง",
        "zone": "Bangkok East",
        "zoneTh": "กรุงเทพตะวันออก",
        "center": [100.690, 13.771],
        "areaKm2": 28.1,
        "isRiver": False,
        "popularLandmarks": ["The Paseo Town Ramkhamhaeng", "Sammakorn Village Food & Lake Community", "Wat Lat Bua Khao", "Bueng Kum - Saphan Sung Green Reservoir"]
    },
    {
        "id": "wang-thonglang",
        "code": "1045",
        "nameEn": "Wang Thonglang",
        "nameTh": "วังทองหลาง",
        "zone": "Bangkok East",
        "zoneTh": "กรุงเทพตะวันออก",
        "center": [100.609, 13.784],
        "areaKm2": 18.9,
        "isRiver": False,
        "popularLandmarks": ["Town in Town Creative District", "Golden Place Rama IX", "Wat Samananam Borihan", "Ladprao 80 Artisanal Cafes"]
    },
    {
        "id": "khlong-sam-wa",
        "code": "1046",
        "nameEn": "Khlong Sam Wa",
        "nameTh": "คลองสามวา",
        "zone": "Bangkok East",
        "zoneTh": "กรุงเทพตะวันออก",
        "center": [100.729, 13.870],
        "areaKm2": 110.7,
        "isRiver": False,
        "popularLandmarks": ["Safari World Marine Park", "Wat Phraya Suren Floating Market", "Nimitmai Agro-Tourism Farms", "Wari Phirom Cycling Track"]
    },
    {
        "id": "bang-na",
        "code": "1047",
        "nameEn": "Bang Na",
        "nameTh": "บางนา",
        "zone": "Bangkok South",
        "zoneTh": "กรุงเทพใต้",
        "center": [100.628, 13.670],
        "areaKm2": 18.8,
        "isRiver": True,
        "popularLandmarks": ["BITEC (Bangkok International Trade & Exhibition Centre)", "Central Bangna", "Mega Bangna / IKEA (adjacent expressway border)", "Bang Na Pier & Naval Academy Link"]
    },
    {
        "id": "thawi-watthana",
        "code": "1048",
        "nameEn": "Thawi Watthana",
        "nameTh": "ทวีวัฒนา",
        "zone": "Thonburi North",
        "zoneTh": "กรุงธนเหนือ",
        "center": [100.353, 13.788],
        "areaKm2": 50.2,
        "isRiver": False,
        "popularLandmarks": ["Thonburi Market Sanam Luang 2", "Utthayan Road (Avenue of Royal Palms)", "Bangkokthonburi University", "Phutthamonthon Sai 2 Orchid Gardens"]
    },
    {
        "id": "thung-khru",
        "code": "1049",
        "nameEn": "Thung Khru",
        "nameTh": "ทุ่งครุ",
        "zone": "Thonburi South",
        "zoneTh": "กรุงธนใต้",
        "center": [100.505, 13.639],
        "areaKm2": 30.7,
        "isRiver": False,
        "popularLandmarks": ["King Mongkut's University of Technology Thonburi (KMUTT)", "Thonburirom Park", "Thung Khru Halal Food Street", "Bang Mod Tangerine Orchards Area"]
    },
    {
        "id": "bang-bon",
        "code": "1050",
        "nameEn": "Bang Bon",
        "nameTh": "บางบอน",
        "zone": "Thonburi South",
        "zoneTh": "กรุงธนใต้",
        "center": [100.395, 13.662],
        "areaKm2": 34.7,
        "isRiver": False,
        "popularLandmarks": ["Bang Bon Public Park (Chalerm Phrakiat)", "Wat Bang Bon", "Ekkachai-Bang Bon Ceramic Village", "Bang Bon Fresh Market"]
    }
]

# Coordinate bounds for Bangkok viewBox mapping: (min_lon: 100.28, max_lon: 100.95, min_lat: 13.50, max_lat: 13.98)
# Map to SVG viewBox: width=1000, height=800, padding=40
MIN_LON, MAX_LON = 100.28, 100.93
MIN_LAT, MAX_LAT = 13.52, 13.96
VIEW_W, VIEW_H = 1000, 800
PAD_X, PAD_Y = 45, 45

def project(lon, lat):
    x = PAD_X + (lon - MIN_LON) / (MAX_LON - MIN_LON) * (VIEW_W - 2 * PAD_X)
    y = PAD_Y + (MAX_LAT - lat) / (MAX_LAT - MIN_LAT) * (VIEW_H - 2 * PAD_Y)
    return round(x, 1), round(y, 1)

points = [d["center"] for d in districts_data]
proj_points = [project(p[0], p[1]) for p in points]

# Boundary guides for Voronoi outer clipping
boundary_guides = [
    # Top
    (-50, -50), (250, -50), (500, -50), (750, -50), (1050, -50),
    # Bottom
    (-50, 850), (250, 850), (500, 850), (750, 850), (1050, 850),
    # Left
    (-50, 200), (-50, 400), (-50, 600),
    # Right
    (1050, 200), (1050, 400), (1050, 600)
]

all_pts = proj_points + boundary_guides
vor = Voronoi(all_pts)

def clip_polygon(poly, min_x=20, min_y=20, max_x=980, max_y=780):
    clipped = []
    for x, y in poly:
        cx = max(min_x, min(max_x, x))
        cy = max(min_y, min(max_y, y))
        clipped.append((round(cx, 1), round(cy, 1)))
    return clipped

def poly_to_svg_path(poly):
    if not poly or len(poly) < 3:
        return ""
    path_cmds = [f"M {poly[0][0]} {poly[0][1]}"]
    for pt in poly[1:]:
        path_cmds.append(f"L {pt[0]} {pt[1]}")
    path_cmds.append("Z")
    return " ".join(path_cmds)

bangkok_districts_output = []

for idx, d in enumerate(districts_data):
    region_idx = vor.point_region[idx]
    region = vor.regions[region_idx]
    
    if not -1 in region and len(region) > 0:
        raw_poly = [vor.vertices[i] for i in region]
    else:
        cx, cy = proj_points[idx]
        r = math.sqrt(d["areaKm2"]) * 6.5 + 18
        raw_poly = [
            (cx + r * math.cos(a), cy + r * math.sin(a))
            for a in [i * (2 * math.pi / 8) for i in range(8)]
        ]
    
    cx, cy = proj_points[idx]
    raw_poly.sort(key=lambda pt: math.atan2(pt[1] - cy, pt[0] - cx))
    
    poly = clip_polygon(raw_poly)
    svg_path = poly_to_svg_path(poly)
    
    xs = [p[0] for p in poly]
    ys = [p[1] for p in poly]
    bbox = {
        "x": min(xs),
        "y": min(ys),
        "width": round(max(xs) - min(xs), 1),
        "height": round(max(ys) - min(ys), 1)
    }
    
    bangkok_districts_output.append({
        "id": d["id"],
        "code": d["code"],
        "nameEn": d["nameEn"],
        "nameTh": d["nameTh"],
        "zone": d["zone"],
        "zoneTh": d["zoneTh"],
        "centerGeo": d["center"],
        "centerSvg": {"x": cx, "y": cy},
        "areaKm2": d["areaKm2"],
        "isRiver": d["isRiver"],
        "bbox": bbox,
        "svgPath": svg_path,
        "popularLandmarks": d["popularLandmarks"]
    })

# Define Chao Phraya River SVG path
river_geo = [
    [100.528, 13.835],
    [100.518, 13.805],
    [100.498, 13.775],
    [100.489, 13.750],
    [100.501, 13.732],
    [100.512, 13.718],
    [100.505, 13.688],
    [100.535, 13.670],
    [100.575, 13.680],
    [100.590, 13.655]
]
river_pts = [project(p[0], p[1]) for p in river_geo]
river_path_d = f"M {river_pts[0][0]} {river_pts[0][1]} " + " ".join([f"Q {river_pts[i][0]} {river_pts[i][1]} {river_pts[i+1][0]} {river_pts[i+1][1]}" for i in range(1, len(river_pts)-1, 2) if i+1 < len(river_pts)])

dataset = {
    "scope": "bangkok",
    "titleEn": "Bangkok (50 Districts)",
    "titleTh": "กรุงเทพมหานคร (50 เขต)",
    "viewBox": "0 0 1000 800",
    "totalDistricts": 50,
    "zones": [
        {"id": "Bangkok Central", "nameEn": "Bangkok Central", "nameTh": "กรุงเทพกลาง", "color": "#3b82f6"},
        {"id": "Bangkok South", "nameEn": "Bangkok South", "nameTh": "กรุงเทพใต้", "color": "#ec4899"},
        {"id": "Bangkok North", "nameEn": "Bangkok North", "nameTh": "กรุงเทพเหนือ", "color": "#8b5cf6"},
        {"id": "Bangkok East", "nameEn": "Bangkok East", "nameTh": "กรุงเทพตะวันออก", "color": "#f59e0b"},
        {"id": "Thonburi North", "nameEn": "Thonburi North", "nameTh": "กรุงธนเหนือ", "color": "#06b6d4"},
        {"id": "Thonburi South", "nameEn": "Thonburi South", "nameTh": "กรุงธนใต้", "color": "#10b981"}
    ],
    "chaoPhrayaRiverSvgPath": river_path_d,
    "districts": bangkok_districts_output
}

with open("/working_dir/c_c3666da9e0cf0d90/bangkok-district-tracker/data/bangkok-districts.json", "w", encoding="utf-8") as f:
    json.dump(dataset, f, ensure_ascii=False, indent=2)

print(f"Saved bangkok-districts.json with {len(bangkok_districts_output)} districts.")

# Initial Tracker State with realistic starter spots
initial_state = {
    "version": "1.0.0",
    "lastUpdated": "2026-08-24T10:00:00.000Z",
    "districts": {
        "pathum-wan": {
            "isVisited": True,
            "generalNotes": "Core shopping and culture hub of Bangkok. Easy BTS access to Siam interchange.",
            "visitedPlaces": [
                {
                    "id": "spot-pw-1",
                    "name": "CentralWorld",
                    "category": "Mall",
                    "visitedDate": "2026-08-15",
                    "notes": "Explored art exhibitions and food hall on the 7th floor."
                },
                {
                    "id": "spot-pw-2",
                    "name": "Bangkok Art and Culture Centre (BACC)",
                    "category": "Culture",
                    "visitedDate": "2026-08-16",
                    "notes": "Watched contemporary Thai photography and design showcases."
                },
                {
                    "id": "spot-pw-3",
                    "name": "Erawan Shrine",
                    "category": "Temple",
                    "visitedDate": "2026-08-18",
                    "notes": "Evening traditional Thai dance performance and prayer."
                }
            ]
        },
        "phra-nakhon": {
            "isVisited": True,
            "generalNotes": "Rattanakosin historic heart with palaces and riverside heritage.",
            "visitedPlaces": [
                {
                    "id": "spot-pn-1",
                    "name": "Wat Pho (Temple of the Reclining Buddha)",
                    "category": "Temple",
                    "visitedDate": "2026-07-20",
                    "notes": "Visited the massive gilded reclining Buddha and traditional massage school."
                },
                {
                    "id": "spot-pn-2",
                    "name": "Giant Swing (Sao Chingcha)",
                    "category": "Culture",
                    "visitedDate": "2026-07-20",
                    "notes": "Walked around the iconic red teak swing and had Mont Nom Sod toast."
                }
            ]
        },
        "bang-rak": {
            "isVisited": True,
            "generalNotes": "Historic creative district and Silom financial center.",
            "visitedPlaces": [
                {
                    "id": "spot-br-1",
                    "name": "King Power Mahanakhon Glass SkyWalk",
                    "category": "Landmark",
                    "visitedDate": "2026-08-01",
                    "notes": "Sunset 360-degree panorama of the entire Bangkok skyline from the 78th floor."
                },
                {
                    "id": "spot-br-2",
                    "name": "Charoen Krung Creative District (TCDC)",
                    "category": "Culture",
                    "visitedDate": "2026-08-05",
                    "notes": "Checked out galleries, boutique coffee shops, and warehouse art spaces."
                }
            ]
        },
        "chatuchak": {
            "isVisited": True,
            "generalNotes": "Famous weekend market hub and lush urban parks.",
            "visitedPlaces": [
                {
                    "id": "spot-cc-1",
                    "name": "Chatuchak Weekend Market (JJ Market)",
                    "category": "Market",
                    "visitedDate": "2026-08-10",
                    "notes": "Browsed vintage fashion, ceramics, and Thai iced tea in section 26."
                },
                {
                    "id": "spot-cc-2",
                    "name": "Vachirabenjatas Park (Rot Fai Park)",
                    "category": "Park",
                    "visitedDate": "2026-08-10",
                    "notes": "Rented a bicycle and visited the Butterfly Garden."
                }
            ]
        },
        "samphanthawong": {
            "isVisited": True,
            "generalNotes": "Chinatown street food mecca and historic trading alleys.",
            "visitedPlaces": [
                {
                    "id": "spot-sp-1",
                    "name": "Yaowarat Street Food Night Market",
                    "category": "Food",
                    "visitedDate": "2026-08-12",
                    "notes": "Tasted toasted buns, Guay Jub Ouan Pochana, and ginger desserts."
                },
                {
                    "id": "spot-sp-2",
                    "name": "Song Wat Road Hipster Alleys",
                    "category": "Cafe",
                    "visitedDate": "2026-08-12",
                    "notes": "Specialty cold brew coffee and preserved shophouse architecture."
                }
            ]
        },
        "khlong-san": {
            "isVisited": True,
            "generalNotes": "Thonburi riverside with luxury malls and art compounds.",
            "visitedPlaces": [
                {
                    "id": "spot-ks-1",
                    "name": "ICONSIAM & SookSiam Indoor Floating Market",
                    "category": "Mall",
                    "visitedDate": "2026-07-28",
                    "notes": "Explored regional Thai street food at SookSiam and riverside fountain show."
                },
                {
                    "id": "spot-ks-2",
                    "name": "The Jam Factory",
                    "category": "Culture",
                    "visitedDate": "2026-07-28",
                    "notes": "Bookshop, coffee by the Bodhi tree, and river sunset vista."
                }
            ]
        },
        "khlong-toei": {
            "isVisited": True,
            "generalNotes": "Modern lifestyle centers and the expansive Benjakitti Forest Park.",
            "visitedPlaces": [
                {
                    "id": "spot-kt-1",
                    "name": "Benjakitti Forest Park Skywalk",
                    "category": "Park",
                    "visitedDate": "2026-08-14",
                    "notes": "Jogged along the elevated wetland boardwalks overlooking Asok skyscrapers."
                },
                {
                    "id": "spot-kt-2",
                    "name": "EmSphere & IKEA Sukhumvit",
                    "category": "Mall",
                    "visitedDate": "2026-08-14",
                    "notes": "Dinner at the gourmet food floor and shopping."
                }
            ]
        },
        "watthana": {
            "isVisited": True,
            "generalNotes": "Thonglor and Ekkamai cafe culture and dynamic nightlife.",
            "visitedPlaces": [
                {
                    "id": "spot-wt-1",
                    "name": "The Commons Thonglor",
                    "category": "Cafe",
                    "visitedDate": "2026-08-17",
                    "notes": "Relaxed open-air courtyard brunch and matcha latte."
                }
            ]
        },
        "bangkok-noi": {
            "isVisited": True,
            "generalNotes": "Canalside historic Thonburi and Wang Lang food paradise.",
            "visitedPlaces": [
                {
                    "id": "spot-bn-1",
                    "name": "Wang Lang Pier Food Market",
                    "category": "Food",
                    "visitedDate": "2026-08-08",
                    "notes": "Crispy pork, Wang Lang stuffed bread, and southern Thai curry."
                }
            ]
        },
        "dusit": {
            "isVisited": True,
            "generalNotes": "Grand royal avenues and peaceful temples.",
            "visitedPlaces": [
                {
                    "id": "spot-ds-1",
                    "name": "Wat Benchamabophit (The Marble Temple)",
                    "category": "Temple",
                    "visitedDate": "2026-07-15",
                    "notes": "Italian Carrara marble architecture and peaceful ordination hall."
                }
            ]
        },
        "bang-khen": {
            "isVisited": True,
            "generalNotes": "Northern district with major temples and university grounds.",
            "visitedPlaces": [
                {
                    "id": "spot-bk-1",
                    "name": "Wat Phra Si Mahathat Wora Maha Vihan",
                    "category": "Temple",
                    "visitedDate": "2026-08-02",
                    "notes": "Visited the sacred stupa connected directly to BTS / MRT intersection."
                }
            ]
        },
        "don-mueang": {
            "isVisited": True,
            "generalNotes": "Bangkok's classic aviation hub.",
            "visitedPlaces": [
                {
                    "id": "spot-dm-1",
                    "name": "Royal Thai Air Force Museum",
                    "category": "Culture",
                    "visitedDate": "2026-06-25",
                    "notes": "Explored historic vintage aircraft and aviation history exhibits."
                }
            ]
        }
    }
}

with open("/working_dir/c_c3666da9e0cf0d90/bangkok-district-tracker/data/initial-state.json", "w", encoding="utf-8") as f:
    json.dump(initial_state, f, ensure_ascii=False, indent=2)

print("Saved initial-state.json successfully.")
