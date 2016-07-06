/*
  The Neighborhood Map Project, by Victor Moreno.
  This app illustrates the use of knockout.js and two APIs. This file is the entry point.

  In particular, the async loading of the google maps script via jQuery is what kicks everything off.
  If this async loading fails, there's an alert letting the user know to reload the page. if it succeeds,
  then the initialize() function is called.
*/

//global vars:
var fakeDatabase, map, viewModel, infoWindow,
    url = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyDB8aXIxv7p_aiShz7YI8ZZH0eo_fQ21Ns'; //&callback=initialize";


//This is the async entry point of the whole application
$.getScript(url).done(initialize).fail(errorCallback);

function errorCallback(){
  alert('Failed to contact Google maps API. Please try refreshing the page');
}


function initialize() {
  var mapOptions = {
    center: { lat: 30.25, lng: -97.7500},
    zoom: 8
  };
  map = new google.maps.Map(document.getElementById('map-canvas'),
      mapOptions);

  fakeDatabase = require('./markers.js')(map, google, markerEventHandler);
  var PlacesViewModel = require('./placesViewModel.js')(markerEventHandler, fakeDatabase);
  viewModel = new PlacesViewModel();
  ko.applyBindings(viewModel);
  viewModel.query.subscribe(viewModel.update);
}


//This is the helper function that toggles infowindows as well as
//the bouncing animation. It is passed to the module that creates and loads the
//map markers, and used in this script as well
function markerEventHandler(marker){
  //close all open markers, cancel animations:
  fakeDatabase.map((e)=> { e.infoWindow.close(); e.setAnimation(null);});
  //handle marker openinig:
  marker.infoWindow.open(map, marker);
  //pan to the marker and zoom in:
  map.setZoom(10);
  map.panTo(marker.getPosition());

  //set the animation and make sure it stops in a little bit
  marker.setAnimation(google.maps.Animation.BOUNCE);
  setTimeout(function(){
    marker.setAnimation(null);
  }, 2100);

  //load the image if it hasnt been loaded already
  if (!marker.hasThumbnail)
    loadImage(marker);
}
//This function loads the image thumbnails for a given map marker
function loadImage(marker){
  //The following is an ES6 template string, it is not the wrong quote character. Template strings are more legible
  var url = `https://pixabay.com/api/?key=2574254-068da214e2b7a749e028d4884&q=${marker.searchStr}&image_type=photo`;
  $.get(url, (resp, txt, xhr) => {
    var imgIdx = Math.floor(Math.random()*resp.hits.length);
    //another es6 template string:
    var newContent = marker.infoWindow.content+`<br><img src="${resp.hits[imgIdx].previewURL}" border="0" align="left" width="100px" height="auto">`;
    marker.infoWindow.setContent(newContent);
    marker.hasThumbnail = true;
  }).fail(function(err){ //error handling for pixabay ajax call
    alert("Failed loading image from pixabay! Please contact the site admin.")
  });
}
