import {
  AfterViewInit,
  Component, ElementRef, EventEmitter,
  Input,
  OnInit, Output,
  TemplateRef,
  ViewChild,
  ViewContainerRef
} from '@angular/core';
import {NGXLogger} from 'ngx-logger';
declare const $: any;

export interface DialogData {
  title: string;
  options: {
    submitButton?: boolean,
    cancelButton?: boolean,
    submitButtonLabel?: string,
    cancelButtonLabel?: string,
    [key: string]: any
  };
  [key: string]: any;
}

export interface DialogEvent {
  eventType: string;
  dialogId: string;
  dialogData: DialogData;
}

export enum DialogEventType {
  CLOSE = 'close',
  SUBMIT = 'submit',
  CANCEL = 'cancel',
}

@Component({
  selector: 'app-dialog',
  templateUrl: './dialog.component.html',
  styleUrls: ['./dialog.component.css']
})
export class DialogComponent implements OnInit, AfterViewInit {
  @Input() dialogId: string;
  @Input() dialogData: DialogData;
  @Input() dialogBody: TemplateRef<any>;
  @ViewChild('dialogBodyContainer', {read: ViewContainerRef}) dialogBodyContainer: ViewContainerRef;
  @Output() dialogEvent: EventEmitter<DialogEvent> = new EventEmitter<DialogEvent>();
  private dialog: any;
  disableSubmit: boolean;
  constructor(public element: ElementRef, private logger: NGXLogger, ) { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    const view = this.dialogBody.createEmbeddedView(null);
    this.dialogBodyContainer.insert(view);
  }

  show() {
    this.dialog = $('#' + this.dialogId);
    this.dialog.on('show.bs.modal', () => {
      this.logger.debug('Dialog is visible');
    });
    this.dialog.on('hide.bs.modal', () => {
      this.logger.debug('Dialog is hidden');
    });
    this.dialog.modal({
      keyboard: false,
      backdrop: 'static',
    });
  }

  hide(){
    this.dialog.modal('hide');
  }

  close() {
    this.logger.debug('Dialog Closed...');
    this.dialogEvent.emit({eventType: DialogEventType.CLOSE, dialogId: this.dialogId, dialogData: this.dialogData});
  }

  submit() {
    this.logger.debug('Dialog Submitted...');
    this.dialogEvent.emit({eventType: DialogEventType.SUBMIT, dialogId: this.dialogId, dialogData: this.dialogData});
  }

  cancel() {
    this.logger.debug('Dialog Cancelled...');
    this.dialogEvent.emit({eventType: DialogEventType.CANCEL, dialogId: this.dialogId, dialogData: this.dialogData});
  }

  disableSubmitButton(){
    this.disableSubmit = true;
  }

  enableSubmitButton(){
    this.disableSubmit = false;
  }
}
