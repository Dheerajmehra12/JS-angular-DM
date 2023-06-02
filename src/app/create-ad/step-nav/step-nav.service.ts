import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {RouteConstants} from '../../services/common/constants/route-constants';
import {CAMPAIGN_STATUS} from '../../shared/campaign-status.pipe';

export enum CREATE_AD_STEPS {
  SELECT_PLAN = 1,
  TARGETING = 2,
  MEDIA = 3,
  FOOTER_BANNER = 4,
  SUMMARY = 5,
  PAY_AND_PUBLISH = 6,
}

export interface NavigationState {
  current: boolean;
  completed: boolean;
  disable: boolean;
}

export interface NavigationStep extends NavigationState{
  id: number;
  number?: number;
  title: string;
  routeCommand: string[];
}

export interface NavigationResult {
  matched: boolean;
  prev: NavigationStep;
  curr: NavigationStep;
  next: NavigationStep;
}

export const STEP_NAVIGATIONS: { [key: number]: NavigationStep } = {
  [CREATE_AD_STEPS.SELECT_PLAN]: {
    id: CREATE_AD_STEPS.SELECT_PLAN,
    completed: false,
    current: false,
    disable: false,
    title: 'Select Plan',
    routeCommand: ['/', RouteConstants.SELECT_PLAN],
  },
  [CREATE_AD_STEPS.TARGETING]: {
    id: CREATE_AD_STEPS.TARGETING,
    completed: false,
    current: false,
    disable: false,
    title: 'Targeting',
    routeCommand: ['/', RouteConstants.CREATE_AD, RouteConstants.TARGETING],
  },
  [CREATE_AD_STEPS.MEDIA]: {
    id: CREATE_AD_STEPS.MEDIA,
    completed: false,
    current: false,
    disable: false,
    title: 'Video',
    routeCommand: ['/', RouteConstants.CREATE_AD, RouteConstants.MEDIA],
  },
  [CREATE_AD_STEPS.FOOTER_BANNER]: {
    id: CREATE_AD_STEPS.FOOTER_BANNER,
    completed: false,
    current: false,
    disable: false,
    title: 'Banner',
    routeCommand: ['/', RouteConstants.CREATE_AD, RouteConstants.BANNER],
  },
  [CREATE_AD_STEPS.SUMMARY]: {
    id: CREATE_AD_STEPS.SUMMARY,
    completed: false,
    current: false,
    disable: false,
    title: 'Summary',
    routeCommand: ['/', RouteConstants.CREATE_AD, RouteConstants.SUMMARY],
  },
  [CREATE_AD_STEPS.PAY_AND_PUBLISH]: {
    id: CREATE_AD_STEPS.PAY_AND_PUBLISH,
    completed: false,
    current: false,
    disable: false,
    title: 'Payment',
    routeCommand: ['/', RouteConstants.CREATE_AD, RouteConstants.PAY_AND_PUBLISH],
  }
};

function createSteps(campaignStatus: number = -1) {
  let stepNumber = 1;
  const steps = new Array<NavigationStep>();
  Object.entries(STEP_NAVIGATIONS).forEach((step) => {
    const stepObj = step[1] as NavigationStep;
    if (campaignStatus === -1 || campaignStatus === CAMPAIGN_STATUS.UNPAID){
      stepObj.number = stepNumber++;
      steps.push(stepObj);
    } else {
      if ( stepObj.id !== CREATE_AD_STEPS.PAY_AND_PUBLISH && stepObj.id !== CREATE_AD_STEPS.SELECT_PLAN) {
        stepObj.number = stepNumber++;
        steps.push(stepObj);
      }
    }
  });
  return steps;
}

@Injectable({
  providedIn: 'root'
})
export class StepNavService {
  constructor() { }

  private stepsSubject: BehaviorSubject<Array<NavigationStep>> = new BehaviorSubject<Array<NavigationStep>>([]);
  private currentStep: NavigationStep;
  private prev: NavigationStep;
  private next: NavigationStep;

  public initSteps(currentStepId: number = 1, campaignStatus: number = -1) {
    let steps: Array<NavigationStep>;
    steps = createSteps(campaignStatus);
    this._initStepsFromArray(steps, currentStepId);
  }

  public isPreviousFromCurrent(stepId: number) {
    if (this.stepsSubject.getValue() && this.stepsSubject.getValue().length > 0
      && this.currentStep !== undefined && this.currentStep !== null) {
      const steps = this.stepsSubject.getValue();
      const firstMatch = steps.find((step) => step.id === stepId);
      if (firstMatch !== undefined && firstMatch.number < this.currentStep.number) {
        return true;
      }
    }
    return false;
  }

  private _initStepsFromArray(steps: Array<NavigationStep>, currentStepId = 1){
    if (steps && steps.length > 0) {
      const navigationResult = this._navigateSteps(steps, currentStepId);
      this._updateNavigationResult(navigationResult);
      this._updateMultiple(steps, currentStepId, {
        completed: true,
        disable: false,
        current: false,
      }, {
        completed: false,
        disable: false,
        current: false,
      });
      this.stepsSubject.next(steps);
    }
  }

  public prevStep() {
    return this.prev;
  }

  public currStep() {
    return this.currentStep;
  }

  public nextStep() {
    return this.next;
  }

  public getSteps(): Observable<Array<NavigationStep>> {
    return this.stepsSubject;
  }

  private _updateMultiple(steps: Array<NavigationStep>, stepId: number,
                          previousStates: NavigationState,
                          nextStates: NavigationState) {
    if (steps && steps.length > 0) {
      if (previousStates || nextStates) {
        let matched = false;
        steps.forEach((step) => {
          if (!matched && step.id !== stepId && previousStates) {
            step.current = previousStates.current;
            step.completed = previousStates.completed;
            step.disable = previousStates.disable;
          }
          if (!matched && step.id === stepId) {
            matched = true;
            step.current = true;
            step.completed = false;
            step.disable = true;
          }
          if (matched && step.id !== stepId && nextStates) {
            step.current = nextStates.current;
            step.completed = nextStates.completed;
            step.disable = nextStates.disable;
          }
        });
      }
    }
  }

  private _updateNavigationResult(navigationResult: NavigationResult) {
    if (navigationResult.matched) {
      this.prev = navigationResult.prev;
      this.currentStep = navigationResult.curr;
      this.next = navigationResult.next;
    }
  }

  private _navigateSteps(steps: Array<NavigationStep>, stepId: number): NavigationResult {
    let prev: NavigationStep = null;
    let next: NavigationStep = null;
    let curr: NavigationStep = null;
    let matched = false;
    if (steps && steps.length > 0) {
      steps.forEach((step) => {
        if (!matched && step.id !== stepId) {
          prev = step;
        }
        if (!matched && step.id === stepId) {
          matched = true;
          curr = step;
        }
        if (matched && step.id !== stepId && next === null) {
          next = step;
        }
      });
      if (prev === null && matched) {
        prev = curr;
      }
      if (matched && next === null) {
        next = curr;
      }
    }
    return {
      matched,
      prev,
      curr,
      next,
    };
  }
}
