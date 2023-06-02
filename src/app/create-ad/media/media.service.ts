import {Observable, throwError} from 'rxjs';

import {catchError, map} from 'rxjs/operators';

import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { WebStorageService } from '../../services/web-storage.service';
import { StorageKeys } from '../../services/common/constants/storage-keys';
import {HttpClient} from '@angular/common/http';
import {NGXLogger} from 'ngx-logger';
import {ApiResponse} from '../../services/common/api-response';

export  interface VideoGallery {
  id: number;
  bgImg: string;
  name: string;
  thumbnail: string;
  url: string;
  videoThumbnail: string;
  ispublic: boolean;
  iscompanyvideo: boolean;
  overlaybanner: boolean;
  overlaybannerurl: string;
  deleted: number;
  breNumber: boolean;
}

export interface MediaInformation {
  mediaTitle: string;
  campaignName: string;
  lpUrl: string;
  thumbnailArray: Array<VideoGallery>;
  selectedVideoUrl: string;
  footerBanner: string;
  defaultFooterBanner: string;
  cNameError: boolean;
  landingPageErrorMessage: number;
  bgImg: string;
  officeLogo: string;
  overlayBanner: boolean;
  cNameRequired: boolean;
  selectedVideoIndex: number;
  galleryType: string;
  showFooterBanner: boolean;
  showBreNumber: boolean;
}

export enum GALLERY_TYPES {
  ALL = 'all',
  CORPORATE = 'corporate',
  COMPANY = 'company',
  USER = 'user'
}

export class MediaInformationFactory {
  static create() {
    const mediaInformation = {} as MediaInformation;
    mediaInformation.mediaTitle = '';
    mediaInformation.campaignName = '';
    mediaInformation.lpUrl = '';
    mediaInformation.thumbnailArray = [] as Array<VideoGallery>;
    mediaInformation.selectedVideoUrl = '';
    mediaInformation.footerBanner = '';
    mediaInformation.defaultFooterBanner = '';
    mediaInformation.cNameError = false;
    mediaInformation.landingPageErrorMessage = 0;
    mediaInformation.bgImg = '';
    mediaInformation.officeLogo = '';
    mediaInformation.cNameRequired = false;
    mediaInformation.selectedVideoIndex = 0;
    mediaInformation.galleryType = GALLERY_TYPES.ALL;
    mediaInformation.showFooterBanner = true;
    mediaInformation.showBreNumber = true;
    return mediaInformation;
  }
}


@Injectable()
export class MediaService {
    constructor(
        private http: HttpClient,
        private router: Router,
        private storageService: WebStorageService,
        private logger: NGXLogger, ) {
    }

    getOfficeLogo() {
        const loginData = this.storageService.get<any>(StorageKeys.LOGIN_DATA);
        return this.http.get<any>('/api/getOfficeLogo', {
          params: {officeId: loginData.agentInfo.officeId},
        }).pipe(map((data) => {
          if (data.status === 'success') {
            return (data.response || '') as string;
          } else {
            return '' as string;
          }
        }), catchError((error) => {
          this.logger.info('Error fetching office logo', error);
          return Observable.of('' as string);
        }));
    }

    getOfficeLogoV1(templateId) {
        const loginData = this.storageService.get<any>(StorageKeys.LOGIN_DATA);
        return this.http.get<any>('/api/getOfficeLogo', {
          params: {officeId: loginData.agentInfo.officeId, templateId: templateId},
        }).pipe(map((data) =>{
           this.logger.info("Response got ["+JSON.stringify(data)+"]");
           if(data.status='success') {
             return data.response;
           } else {
             return '' as string;
           }
        }), catchError((error) => {
               this.logger.info('Error fetching office logo v1', error);
               return Observable.of('' as string);
         }));
    }

    getThumbnailArray(galleryType: string = GALLERY_TYPES.ALL): Observable<Array<VideoGallery>> {
      return this.http.get<any>('/api/proxy/ctv/videos/v1').pipe(map((data) => {
        if (data.status === 0 && data.response != null
          && data.response.videos != null && data.response.videos.length > 0 ) {
          const allVideos: Array<VideoGallery> = data.response.videos as Array<VideoGallery>;
          let videos: Array<VideoGallery>;
          switch (galleryType) {
            case GALLERY_TYPES.USER:
              videos = allVideos.filter(rec => !rec.ispublic && !rec.iscompanyvideo);
              break;
            case GALLERY_TYPES.COMPANY:
              videos = allVideos.filter(rec => rec.iscompanyvideo && !rec.ispublic);
              break;
            case GALLERY_TYPES.CORPORATE:
              videos = allVideos.filter(rec => rec.ispublic);
              break;
            default:
              videos = allVideos;
          }
          return videos;
        } else {
          throwError(data);
        }
      }), catchError((error) => {
        this.logger.info('Error fetching gallery', error);
        return Observable.of([] as Array<VideoGallery>);
      }));
    }

    getVideoBanner(officeLogo, bannerName, creativeSize = '1920x1080', bgImg = '') {
        const loginData = this.storageService.get<any>(StorageKeys.LOGIN_DATA);
        const profile = {
            name: (loginData.agentInfo.firstName + ' ' + loginData.agentInfo.lastName).trim(),
            headShot: loginData.agentInfo.agentPhoto ? loginData.agentInfo.agentPhoto : '',
            mobile: loginData.agentInfo.cell ? loginData.agentInfo.cell : '',
            officeLogo: officeLogo ? officeLogo : 'https://s3.amazonaws.com/cd_cdn/images/bhh_vertical_WHT_rgb-02.png',
            bgImg,
            bannerName,
            creativeSize
        };
        return this.http.post<any>('/api/getFooterBanner', profile)
          .pipe(map((data) => {
            if (data.status === 'success') {
              return (data.response || '') as string;
            } else {
              return '' as string;
            }
          }), catchError((error) => {
            this.logger.info(`Error fetching getVideoBanner with bannerName: ${bannerName}`, error);
            return Observable.of('' as string);
          }));
    }

    uploadVideo(video: File, videoTitle: string = '') {
      this.logger.info(`uploadVideo(video): ${video}`);
      this.logger.info(`uploadVideo(videoTitle): ${videoTitle}`);
      const formData: FormData = new FormData();
      formData.append('video', video, video.name);
      return this.http.post<ApiResponse<any>>('/api/videoUpload', formData, {
        headers: {
          timeout: '360000'
        }});
    }

    uploadVideoThumbnail(videoThumbnail: Blob, fileName: string) {
      const formData: FormData = new FormData();
      formData.append('videoThumbnail', videoThumbnail, fileName);
      return this.http.post<ApiResponse<any>>('/api/videoThumbnailUpload', formData);
    }

  addMyVideo(videoTitle: string, videoUrl: string, thumbnailUrl: string, publicVideo: boolean, companyVideo:boolean) {
    const myVideoReqPayload = {
      name: videoTitle,
      url: videoUrl,
      thumbnail: thumbnailUrl,
      ispublic: publicVideo,
      iscompanyvideo:companyVideo
    };
    return this.http.post<ApiResponse<VideoGallery>>('/api/proxy/ctv/videos/v1', myVideoReqPayload);
  }
}
