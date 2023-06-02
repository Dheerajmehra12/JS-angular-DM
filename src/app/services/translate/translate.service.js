"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var translations_1 = require("./translations"); // import our opaque token
var TranslateService = (function () {
    // inject our translations
    function TranslateService(_translations) {
        this._translations = _translations;
    }
    Object.defineProperty(TranslateService.prototype, "currentLang", {
        get: function () {
            return this._currentLang;
        },
        enumerable: true,
        configurable: true
    });
    TranslateService.prototype.use = function (lang) {
        // set current language
        this._currentLang = lang;
    };
    TranslateService.prototype.translate = function (key) {
        // private perform translation
        var translation = key;
        var currentLangIs = this._translations[this.currentLang];
        var a = key.split(".");
        for (var i = 0; i < a.length; i++) {
            if (currentLangIs[a[i]]) {
                currentLangIs = currentLangIs[a[i]];
            }
        }
        if (currentLangIs) {
            return currentLangIs;
        }
        else {
            return translation;
        }
    };
    TranslateService.prototype.instant = function (key) {
        // public perform translation
        return this.translate(key);
    };
    return TranslateService;
}());
TranslateService = __decorate([
    core_1.Injectable(),
    __param(0, core_1.Inject(translations_1.TRANSLATIONS))
], TranslateService);
exports.TranslateService = TranslateService;
