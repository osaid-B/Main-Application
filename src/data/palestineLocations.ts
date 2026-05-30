export interface PalestineLocation {
  city: string;
  governorate: string;
}

export const PALESTINE_LOCATIONS: PalestineLocation[] = [
  // رام الله والبيرة
  { city: "رام الله",      governorate: "رام الله والبيرة" },
  { city: "البيرة",        governorate: "رام الله والبيرة" },
  { city: "بيتونيا",      governorate: "رام الله والبيرة" },
  { city: "بيرزيت",       governorate: "رام الله والبيرة" },
  { city: "سلواد",         governorate: "رام الله والبيرة" },
  { city: "كفر مالك",     governorate: "رام الله والبيرة" },
  { city: "أبو قش",       governorate: "رام الله والبيرة" },
  { city: "بيت عور الفوقا", governorate: "رام الله والبيرة" },
  { city: "بيت سيرا",     governorate: "رام الله والبيرة" },
  { city: "دير قديس",     governorate: "رام الله والبيرة" },
  { city: "رأس كركر",     governorate: "رام الله والبيرة" },
  { city: "عين عريك",     governorate: "رام الله والبيرة" },
  { city: "قبية",          governorate: "رام الله والبيرة" },
  { city: "نعلين",         governorate: "رام الله والبيرة" },
  { city: "صفا",           governorate: "رام الله والبيرة" },

  // القدس
  { city: "القدس",         governorate: "القدس" },
  { city: "العيزرية",     governorate: "القدس" },
  { city: "أبو ديس",      governorate: "القدس" },
  { city: "بيت حنينا",    governorate: "القدس" },
  { city: "شعفاط",        governorate: "القدس" },
  { city: "صور باهر",     governorate: "القدس" },
  { city: "كفر عقب",      governorate: "القدس" },
  { city: "رام الله الجديدة", governorate: "القدس" },
  { city: "بيت إكسا",     governorate: "القدس" },
  { city: "الرام",         governorate: "القدس" },
  { city: "الزعيم",       governorate: "القدس" },

  // الخليل
  { city: "الخليل",        governorate: "الخليل" },
  { city: "دورا",          governorate: "الخليل" },
  { city: "يطا",           governorate: "الخليل" },
  { city: "حلحول",        governorate: "الخليل" },
  { city: "بني نعيم",     governorate: "الخليل" },
  { city: "السموع",       governorate: "الخليل" },
  { city: "تفوح",         governorate: "الخليل" },
  { city: "ترقوميا",      governorate: "الخليل" },
  { city: "سعير",         governorate: "الخليل" },
  { city: "إذنا",          governorate: "الخليل" },
  { city: "بيت أمر",      governorate: "الخليل" },
  { city: "صوريف",        governorate: "الخليل" },

  // بيت لحم
  { city: "بيت لحم",      governorate: "بيت لحم" },
  { city: "بيت جالا",     governorate: "بيت لحم" },
  { city: "بيت ساحور",    governorate: "بيت لحم" },
  { city: "الدوحة",       governorate: "بيت لحم" },
  { city: "بيت فجار",     governorate: "بيت لحم" },
  { city: "العبيدية",     governorate: "بيت لحم" },
  { city: "الخضر",        governorate: "بيت لحم" },
  { city: "تقوع",         governorate: "بيت لحم" },
  { city: "أرطاس",        governorate: "بيت لحم" },
  { city: "حوسان",        governorate: "بيت لحم" },
  { city: "نحالين",       governorate: "بيت لحم" },

  // نابلس
  { city: "نابلس",         governorate: "نابلس" },
  { city: "بيتا",          governorate: "نابلس" },
  { city: "حوارة",        governorate: "نابلس" },
  { city: "بيت فوريك",    governorate: "نابلس" },
  { city: "قريوت",        governorate: "نابلس" },
  { city: "بيت دجن",      governorate: "نابلس" },
  { city: "طلوزة",        governorate: "نابلس" },
  { city: "أسيرة الشمالية", governorate: "نابلس" },
  { city: "عقربا",        governorate: "نابلس" },
  { city: "سبسطية",       governorate: "نابلس" },
  { city: "روجيب",        governorate: "نابلس" },

  // جنين
  { city: "جنين",          governorate: "جنين" },
  { city: "قباطية",       governorate: "جنين" },
  { city: "يعبد",         governorate: "جنين" },
  { city: "سيلة الظهر",   governorate: "جنين" },
  { city: "عرابة",        governorate: "جنين" },
  { city: "برقين",        governorate: "جنين" },
  { city: "كفر راعي",     governorate: "جنين" },
  { city: "المزيرعة",     governorate: "جنين" },
  { city: "صانور",        governorate: "جنين" },
  { city: "بلعا",         governorate: "جنين" },

  // طولكرم
  { city: "طولكرم",       governorate: "طولكرم" },
  { city: "عنبتا",        governorate: "طولكرم" },
  { city: "عتيل",         governorate: "طولكرم" },
  { city: "بيت ليد",      governorate: "طولكرم" },
  { city: "الشوفة",       governorate: "طولكرم" },
  { city: "إيلار",        governorate: "طولكرم" },
  { city: "كفر زيباد",    governorate: "طولكرم" },
  { city: "سيدا",         governorate: "طولكرم" },

  // قلقيلية
  { city: "قلقيلية",      governorate: "قلقيلية" },
  { city: "حبلة",         governorate: "قلقيلية" },
  { city: "عزون",         governorate: "قلقيلية" },
  { city: "كفر ثلث",      governorate: "قلقيلية" },
  { city: "جينصافوط",     governorate: "قلقيلية" },
  { city: "فلامية",       governorate: "قلقيلية" },

  // سلفيت
  { city: "سلفيت",        governorate: "سلفيت" },
  { city: "دير استيا",    governorate: "سلفيت" },
  { city: "مردا",         governorate: "سلفيت" },
  { city: "كفل حارس",     governorate: "سلفيت" },
  { city: "قراوة بني حسان", governorate: "سلفيت" },

  // أريحا
  { city: "أريحا",        governorate: "أريحا" },
  { city: "العوجا",       governorate: "أريحا" },
  { city: "الديوك الفوقا", governorate: "أريحا" },
  { city: "النويعمة",     governorate: "أريحا" },

  // طوباس
  { city: "طوباس",        governorate: "طوباس" },
  { city: "طمون",         governorate: "طوباس" },
  { city: "العقبة",       governorate: "طوباس" },
  { city: "بردلة",        governorate: "طوباس" },

  // غزة
  { city: "غزة",           governorate: "غزة" },
  { city: "الشجاعية",     governorate: "غزة" },
  { city: "التفاح",       governorate: "غزة" },
  { city: "الزيتون",      governorate: "غزة" },
  { city: "الشيخ رضوان",  governorate: "غزة" },
  { city: "النصر",        governorate: "غزة" },

  // خان يونس
  { city: "خان يونس",     governorate: "خان يونس" },
  { city: "عبسان",        governorate: "خان يونس" },
  { city: "بني سهيلا",    governorate: "خان يونس" },
  { city: "خزاعة",        governorate: "خان يونس" },
  { city: "القرارة",      governorate: "خان يونس" },

  // رفح
  { city: "رفح",           governorate: "رفح" },
  { city: "الشوكة",       governorate: "رفح" },
  { city: "يبنا",         governorate: "رفح" },
  { city: "تل السلطان",   governorate: "رفح" },

  // دير البلح
  { city: "دير البلح",    governorate: "دير البلح" },
  { city: "النصيرات",     governorate: "دير البلح" },
  { city: "البريج",       governorate: "دير البلح" },
  { city: "المغازي",      governorate: "دير البلح" },

  // شمال غزة
  { city: "جباليا",       governorate: "شمال غزة" },
  { city: "بيت لاهيا",    governorate: "شمال غزة" },
  { city: "بيت حانون",    governorate: "شمال غزة" },
  { city: "أم النصر",     governorate: "شمال غزة" },
];

export const ALL_CITIES_FLAT: string[] = PALESTINE_LOCATIONS.map(l => l.city);

export function getGovernorateForCity(city: string): string | undefined {
  return PALESTINE_LOCATIONS.find(l => l.city === city)?.governorate;
}
