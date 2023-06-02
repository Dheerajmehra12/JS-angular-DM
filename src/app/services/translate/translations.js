// app/translate/translation.ts
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
// import translations
var lang_en_1 = require("./lang-en");
// import { LANG_ES_NAME, LANG_ES_TRANS } from './lang-es';
var lang_jp_1 = require("./lang-jp");
var lang_gr_1 = require("./lang-gr");
var lang_it_1 = require("./lang-it");
var lang_pt_1 = require("./lang-pt");
// translation token
exports.TRANSLATIONS = new core_1.OpaqueToken('translations');
// all traslations
var dictionary = {
    'en': lang_en_1.LANG_EN_TRANS,
    // [LANG_ES_NAME]: LANG_ES_TRANS,
    'jp': lang_jp_1.LANG_JP_TRANS,
    'gr' : lang_gr_1.LANG_GR_TRANS,
	'it' : lang_it_1.LANG_IT_TRANS,
	'pt' : lang_pt_1.LANG_PT_TRANS,
};
// providers
exports.TRANSLATION_PROVIDERS = [
    { provide: exports.TRANSLATIONS, useValue: dictionary }
];
