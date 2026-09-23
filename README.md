# ForecastWeb

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.0.5.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Deploying to Azure

This application uses Angular SSR and is configured for a Linux Azure App Service running Node.js 22.

1. Create a Linux App Service with Node.js 22, then download its publish profile from **Get publish profile**.
2. In the GitHub repository, add the publish profile as an Actions secret named `AZUREAPPSERVICE_PUBLISHPROFILE`.
3. Add a repository Actions variable named `AZURE_WEBAPP_NAME` containing the App Service name.
4. Push to `main`, or run **Build and deploy to Azure App Service** from the Actions tab.

The workflow builds the SSR output, includes the runtime package manifests, and starts Azure with `node server/server.mjs`.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
