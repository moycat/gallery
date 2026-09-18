import type { BuiltGallery, ContentTranslations } from "./types.js";
import { formatChineseDate } from "./exif.js";

export type Language = "zh" | "ca";

const messages = {
  zh: {
    home: "首页",
    albums: "相簿",
    blog: "博客",
    channel: "频道",
    email: "邮箱",
    intro: "Life is strange. So am I.",
    openNavigation: "打开导航",
    navigation: "主导航",
    avatar: "头像",
    photoDetails: "照片详情",
    original: "查看原图",
    close: "关闭",
    description: "说明",
    date: "日期",
    camera: "设备",
    lens: "镜头",
    exposure: "曝光",
    location: "地点",
    photos: "张照片",
    licenseBefore: "本站内容以",
    licenseAfter: "协议发布",
    licenseLanguage: "zh-hans",
    switchLanguage: "切换语言",
    defaultTitle: "末影画廊",
    defaultDescription: "Moycat 的照片画廊。"
  },
  ca: {
    home: "Inici",
    albums: "Àlbums",
    blog: "Blog",
    channel: "Canal",
    email: "Correu",
    intro: "La vida és estranya. Jo també.",
    openNavigation: "Obre la navegació",
    navigation: "Navegació principal",
    avatar: "Avatar",
    photoDetails: "Detalls de la foto",
    original: "Mostra l’original",
    close: "Tanca",
    description: "Descripció",
    date: "Data",
    camera: "Càmera",
    lens: "Objectiu",
    exposure: "Exposició",
    location: "Lloc",
    photos: "fotos",
    licenseBefore: "El contingut d’aquest lloc es publica sota la llicència",
    licenseAfter: "",
    licenseLanguage: "ca",
    switchLanguage: "Canvia de llengua",
    defaultTitle: "Galeria de Moycat",
    defaultDescription: "La galeria de fotografies de Moycat."
  }
};

export function strings(language: Language) {
  return messages[language];
}
export function languagePath(path: string, language: Language): string {
  const absolute = path.startsWith("/") ? path : `/${path}`;
  return language === "ca" ? `/ca${absolute}` : absolute;
}
function localizedContent<
  T extends { title?: string; description?: string; translations?: ContentTranslations }
>(value: T, language: Language): T {
  return language === "ca" ? { ...value, ...value.translations?.ca } : value;
}
export function localizeGallery(gallery: BuiltGallery, language: Language): BuiltGallery {
  if (language === "zh") return gallery;
  return {
    ...localizedContent(gallery, language),
    title:
      gallery.translations?.ca?.title ??
      (gallery.title === messages.zh.defaultTitle ? messages.ca.defaultTitle : gallery.title),
    description:
      gallery.translations?.ca?.description ??
      gallery.description ??
      messages.ca.defaultDescription,
    albums: gallery.albums.map((album) => ({
      ...localizedContent(album, language),
      pagePath: `ca/${album.pagePath}`
    })),
    photos: gallery.photos.map((photo) => ({
      ...localizedContent(photo, language),
      ...(photo.exif === undefined
        ? {}
        : {
            exif: {
              ...photo.exif,
              ...(photo.translations?.ca?.location === undefined
                ? {}
                : { location: photo.translations.ca.location })
            }
          })
    }))
  };
}
export function formatDate(value: string | undefined, language: Language): string | undefined {
  if (language === "zh") return formatChineseDate(value);
  if (value === undefined || !Number.isFinite(Date.parse(value))) return undefined;
  return new Intl.DateTimeFormat("ca", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC"
  }).format(new Date(value));
}
