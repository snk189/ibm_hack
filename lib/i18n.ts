import en from "../messages/en.json";
import hi from "../messages/hi.json";
import ta from "../messages/ta.json";
import te from "../messages/te.json";
import kn from "../messages/kn.json";
import ml from "../messages/ml.json";
import mr from "../messages/mr.json";
import bn from "../messages/bn.json";

export type MessageKey = keyof typeof en;

const dictionaries: Record<string, Record<string, string>> = {
  en,
  hi,
  ta,
  te,
  kn,
  ml,
  mr,
  bn,
};

/**
 * Returns the UI string for the given key from messages/*.json,
 * replacing parameter placeholders like {ref} if provided.
 */
export function t(
  key: MessageKey,
  params?: Record<string, string>,
  lang: string = "en"
): string {
  const dict = dictionaries[lang] || en;
  let message = dict[key] || (en as Record<string, string>)[key] || key;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      message = message.replace(`{${k}}`, v);
    });
  }
  return message;
}
