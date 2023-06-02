// app/translate/translation.ts

import { InjectionToken } from '@angular/core';

// import translations
import { LANG_EN_NAME, LANG_EN_TRANS } from './lang-en';
// import { LANG_ES_NAME, LANG_ES_TRANS } from './lang-es';
import { LANG_JP_NAME, LANG_JP_TRANS } from './lang-jp';
import { LANG_GR_NAME, LANG_GR_TRANS } from './lang-gr';
import { LANG_IT_NAME, LANG_IT_TRANS } from './lang-it';
import { LANG_PT_NAME, LANG_PT_TRANS } from './lang-pt';
// translation token
export const TRANSLATIONS = new InjectionToken('translations');

// all traslations
const dictionary = {
	'en' : LANG_EN_TRANS,
	// [LANG_ES_NAME]: LANG_ES_TRANS,
	'jp' : LANG_JP_TRANS,
	'gr' : LANG_GR_TRANS,
	'it' : LANG_IT_TRANS,
	'pt' : LANG_PT_TRANS,

};

// providers
export const TRANSLATION_PROVIDERS = [
	{ provide: TRANSLATIONS, useValue: dictionary }
];
