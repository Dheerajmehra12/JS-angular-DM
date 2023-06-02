import {
  ApplicationRef,
  ComponentFactoryResolver,
  ComponentRef,
  EmbeddedViewRef, EventEmitter, Injectable,
  Injector
} from '@angular/core';

export function spinnerFactory(componentFactoryResolver: ComponentFactoryResolver, appRef: ApplicationRef, injector: Injector) {
  return new SpinnerService(componentFactoryResolver, appRef, injector);
}

@Injectable()
export class SpinnerService {
  private componentRef: ComponentRef<any>;
  private visibilityChange: EventEmitter<boolean> = new EventEmitter();
  private visible = false;

  constructor(
    private componentFactoryResolver: ComponentFactoryResolver,
    private appRef: ApplicationRef,
    private injector: Injector,
  ) { }

  /**
   * Method to create spinner component and place inside body tag.  Always call this method from component.
   * This method should be called once in application.
   */
  private createSpinner(component: any) {
    this.componentRef = this.componentFactoryResolver
      .resolveComponentFactory(component)
      .create(this.injector);

    this.appRef.attachView(this.componentRef.hostView);

    const domElem = (this.componentRef.hostView as EmbeddedViewRef<any>)
      .rootNodes[0] as HTMLElement;

    document.body.prepend(domElem);
    this.emitVisibilityChangeEvent(false);
  }

  /**
   * Method to destroy previously created spinner.
   */
  private destroySpinner() {
    this.appRef.detachView(this.componentRef.hostView);
    this.componentRef.destroy();
  }

  /**
   * Method to show spinner
   */
  show() {
    this.emitVisibilityChangeEvent(true);
  }

  /**
   * Method to close spinner
   */
  close() {
    this.emitVisibilityChangeEvent(false);
  }

  private emitVisibilityChangeEvent(visible) {
    this.visible = visible;
    this.visibilityChange.emit(visible);
  }

  /**
   * Method returns EventEmitter for visibility change for spinner
   */
  onVisibilityChange() {
    return this.visibilityChange;
  }

  isVisible() {
    return this.visible;
  }
}
