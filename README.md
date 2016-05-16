#Neighborhood Map Project

##Installation/Usage
Unzipping or forking this project and then viewing index.html in your browser should be enough to run this project.

##Survey of the code
I used browserify/watchify to package all my js files into one, which is located under `dist/dist.js`. I also created an npm script called watch to repackage my `dist.js` file whenever any js file changed.

The src folder contains all the source code. The file contents are as follows:
1. **jquery.js** - Used only for the `getScript` functionality to load the Google maps script.
2. **knockout-3.3.0.js** - The front end framework running the data binds of the app.
3. **main-app.js** - This is the main entry point of the app. The first thing that fires is the call to `getScript` which later invokes the callback. This callback, called `initialize()` contains the browserify requires which bring in the other files.
4. **markers.js** - This is where the markers get generated. In a live app, these would be stored in a server somewhere.
5. **placesViewModel,js** - The viewModel constructor function for knockout's viewModel.

##Tooling/dependencies
I used npm and watchify with all its thousand dependencies for this project. The way I run the live reload is by running the npm script:

`npm run watch`

##License
If you can find a use for it, go for it. MIT license.
