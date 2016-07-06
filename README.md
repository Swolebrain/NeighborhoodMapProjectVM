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

##Changes for second submission
1. More documentation in the main-app.js entry point
2. Installed the strictify transform for browserify in order to provide use strict statement within the browserify closure.
3. Refactored the markerEventHandler so it closes all open markers before doing anything. This simplified the code a lot.
4. Removed extraneous console.log statements from the function which loads images from pixabay
5. Refactored the function that loads images from pixabay (loadImage) so that it does not re-instantiate a new infowindow but rather sets the content to include the image when it loads
6. Added the viewport meta tag
7. I'm going to continue to load the script with jQuery because i do not want to expose a global variable for the init function
8. Added functionality to pan to the map marker that was just clicked and to zoom in a bit
9. Changed the timeout function so that I get 3 perfect bounces
10. Added comment to address the es6 template string
11. Cleaned up the loadImage method to remove extraneous marker.open() call
12. Added error handling for the pixabay ajax call in the loadImage function
13. Changed all the strings I saw to use single quotes other than the big complex template strings which are still using ES6 format with back ticks
14. Removed extraneous empty script from header in index.html
15. Beautified CSS to keep its spacing consistent
