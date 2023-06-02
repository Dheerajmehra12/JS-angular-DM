import {Type} from '@angular/core';

export interface TemplateData {
  templateId: string;
  scaleFactor?: number;
  headlineText?: string;
  officeLogoUrl?: string;
  agentImage?: string;
  agentName?: string;
  website?: string;
  email?: string;
  phone?: string;
  breNumber?: string;
  active?: boolean;
  [key: string]: any;
  fontSizeFactorConfig?: {
    agentDetails: {max: number; min: number};
    headlineText?: {max: number; min: number};
    [key: string]: {max: number; min: number};
  };
  fontSizeFactor?: {
    agentDetails: number;
    headlineText?: number;
    [key: string]: number;
  };
  visibility?: {
    agentName?: boolean;
    headlineText?: boolean;
    website?: boolean;
    email?: boolean;
    phone?: boolean;
    breNumber?: boolean;
    [key: string]: boolean;
  };
  maxlength?: {
    agentName?: number;
    headlineText?: number;
    website?: number;
    email?: number;
    phone?: number;
    breNumber?: number;
    [key: string]: number;
  };
}
export class TemplateItem {
  constructor(public component: Type<TemplateComponent>, public data: TemplateData) {}
}
export interface TemplateComponent {
  data: TemplateData;
}
