import {Injectable, Inject} from '@angular/core';
import { TRANSLATIONS } from './translations'; // import our opaque token

@Injectable()
export class TranslateService {
	private _currentLang: string;
	public defaultLang: string = 'en';

	public get currentLang() {
	  return this._currentLang;
	}

  // inject our translations
	constructor(@Inject(TRANSLATIONS) private _translations: any) {
	}

	public use(lang: string): void {
		// set current language
		// this._currentLang = lang;
		this._currentLang = this.isLangDataPresent( lang );
	}

	private isLangDataPresent( currentLang: string ): string{
		// languages for which lang data is present
		let supportedLanguages = Object.keys(this._translations);
		let selectedLang: string = '';

		for (let lang of supportedLanguages){
			if ( currentLang === lang ) {
				selectedLang = currentLang;
				break;
			} else {
				selectedLang = this.defaultLang;
			}
		}
		return selectedLang;
	}

	public translate(key: string): string {
		// private perform translation
		let currentLangIs = this._translations[this.currentLang];
		if(currentLangIs){
			let a = key.split('.');
			let data;
			let i = 0;
			for(i = 0;i<a.length;i++){
				if (currentLangIs[a[i]]) {
					currentLangIs = currentLangIs[a[i]];
					data = currentLangIs;
				}
			}
			if(data){
				return data;
			}else{
				return key;
			}
		}
	}

	public instant(key: string) {
		// public perform translation
		return this.translate(key);
	}
}
