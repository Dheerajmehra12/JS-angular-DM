# AngularDM

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 14.2.10.

## Development server

Run `npm start` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ENV=staging npm run deploy` to build the project for staging environment. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).


Issues during build.

Error: Missing binding /Users/kai/office/ctv/node_modules/node-sass/vendor/darwin-x64-83/binding.node
Node Sass could not find a binding for your current environment: OS X 64-bit with Node.js 14.x

Found bindings for the following environments:
  - OS X 64-bit with Node.js 10.x

solution  : npm rebuild node-sass && npm start



Node.js version v14.3.0 detected.
The Angular CLI requires a minimum Node.js version of either v12.14 or v14.15.

Please update your Node.js version or visit https://nodejs.org/ for additional instructions.


solution : nvm install 14.15 && nvm use 14.15 && npm start