/**
 * Languages you can practise in. Questions, notes and Cobi's replies are written in
 * the chosen language by the AI. The menus and buttons stay in English for now.
 */
export type Language = {
  code: string;
  /** Name in English, for the settings list. */
  name: string;
  /** Name in the language itself. */
  native: string;
  /** Speech recognition and device voice locale. */
  speech: string;
  rtl?: boolean;
  /** The two lines every mock interview opens and closes with. */
  opener: string;
  closer: string;
};

export const LANGUAGES: Language[] = [
  { code: "en", name: "English", native: "English", speech: "en-GB", opener: "", closer: "" },
  {
    code: "es",
    name: "Spanish",
    native: "Español",
    speech: "es-ES",
    opener: "Para empezar, háblame un poco de ti.",
    closer: "Eso es todo por mi parte. ¿Tienes alguna pregunta para mí?",
  },
  {
    code: "fr",
    name: "French",
    native: "Français",
    speech: "fr-FR",
    opener: "Pour commencer, parlez-moi un peu de vous.",
    closer: "C'est tout pour moi. Avez-vous des questions à me poser ?",
  },
  {
    code: "pt",
    name: "Portuguese",
    native: "Português",
    speech: "pt-PT",
    opener: "Para começar, fale-me um pouco sobre si.",
    closer: "É tudo da minha parte. Tem alguma pergunta para mim?",
  },
  {
    code: "pl",
    name: "Polish",
    native: "Polski",
    speech: "pl-PL",
    opener: "Na początek proszę opowiedzieć trochę o sobie.",
    closer: "To wszystko z mojej strony. Czy ma Pan lub Pani jakieś pytania do mnie?",
  },
  {
    code: "ro",
    name: "Romanian",
    native: "Română",
    speech: "ro-RO",
    opener: "Pentru început, spuneți-mi câte ceva despre dumneavoastră.",
    closer: "Asta a fost tot din partea mea. Aveți vreo întrebare pentru mine?",
  },
  {
    code: "uk",
    name: "Ukrainian",
    native: "Українська",
    speech: "uk-UA",
    opener: "Для початку розкажіть трохи про себе.",
    closer: "Це все з мого боку. Чи є у вас запитання до мене?",
  },
  {
    code: "tr",
    name: "Turkish",
    native: "Türkçe",
    speech: "tr-TR",
    opener: "Başlamak için bana biraz kendinizden bahseder misiniz?",
    closer: "Benim sorularım bu kadar. Sizin bana sormak istediğiniz bir şey var mı?",
  },
  {
    code: "ar",
    name: "Arabic",
    native: "العربية",
    speech: "ar-SA",
    rtl: true,
    opener: "في البداية، حدّثني قليلاً عن نفسك.",
    closer: "هذا كل ما لدي. هل لديك أي أسئلة لي؟",
  },
  {
    code: "ur",
    name: "Urdu",
    native: "اردو",
    speech: "ur-PK",
    rtl: true,
    opener: "شروع کرنے کے لیے، مجھے اپنے بارے میں تھوڑا سا بتائیں۔",
    closer: "میری طرف سے بس اتنا ہی۔ کیا آپ مجھ سے کچھ پوچھنا چاہیں گے؟",
  },
  {
    code: "hi",
    name: "Hindi",
    native: "हिन्दी",
    speech: "hi-IN",
    opener: "शुरू करने के लिए, मुझे अपने बारे में थोड़ा बताइए।",
    closer: "मेरी तरफ़ से इतना ही। क्या आप मुझसे कुछ पूछना चाहेंगे?",
  },
  {
    code: "bn",
    name: "Bengali",
    native: "বাংলা",
    speech: "bn-IN",
    opener: "শুরুতে, আপনার সম্পর্কে একটু বলুন।",
    closer: "আমার দিক থেকে এটুকুই। আমাকে কি আপনার কোনো প্রশ্ন আছে?",
  },
  {
    code: "zh",
    name: "Chinese (Mandarin)",
    native: "中文",
    speech: "zh-CN",
    opener: "首先，请简单介绍一下你自己。",
    closer: "我的问题就这些。你有什么想问我的吗？",
  },
];

export const LANGUAGE_CODES = LANGUAGES.map((l) => l.code) as [string, ...string[]];

export function languageFor(code: string | undefined): Language {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
}

export function isEnglish(code: string | undefined): boolean {
  return !code || code === "en";
}

/** The instruction added to AI prompts for a non-English round, or "" for English. */
export function languageInstruction(code: string | undefined, what: string): string {
  if (isEnglish(code)) return "";
  const l = languageFor(code);
  return `Write ${what} in ${l.name} (${l.native}), natural and plain, as a native speaker would say it. Keep JSON field names in English.`;
}
