/**
 * Interface text. Every string the player reads goes through `t()`, so adding a language is adding
 * a catalog here. Book content (passages and the words in the grid) is per language too, but lives
 * with the levels: a translated chapter needs its own grid.
 */
import { en, type Messages } from './en.ts';

export type Locale = 'en';
export type MessageKey = keyof Messages;

const CATALOGS: Record<Locale, Messages> = { en };

let locale: Locale = 'en';
let messages: Messages = en;
let plurals = new Intl.PluralRules(locale);

export function setLocale(next: Locale): void {
  locale = next;
  messages = CATALOGS[next];
  plurals = new Intl.PluralRules(next);
  document.documentElement.lang = next;
}

export const getLocale = (): Locale => locale;

/** Best supported match for the browser's languages. */
export function detectLocale(): Locale {
  for (const lang of navigator.languages ?? [navigator.language]) {
    const base = lang.toLowerCase().split('-')[0];
    if (base in CATALOGS) return base as Locale;
  }
  return 'en';
}

type Vars = Record<string, string | number>;

/** A message, with {name} placeholders filled from `vars`. */
export function t(key: MessageKey, vars: Vars = {}): string {
  return messages[key].replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? `{${name}}`));
}

/** A counted message: picks `<key>_one` / `<key>_other` by the language's plural rules; {count} is filled in. */
export function tn(key: PluralBase, count: number, vars: Vars = {}): string {
  const form = plurals.select(count) === 'one' ? 'one' : 'other';
  return t(`${key}_${form}` as MessageKey, { count, ...vars });
}

type PluralBase = MessageKey extends infer K ? (K extends `${infer B}_one` ? B : never) : never;
