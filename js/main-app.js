//global vars:
var fakeDatabase, map, viewModel,
    url = "https://maps.googleapis.com/maps/api/js?key=AIzaSyDB8aXIxv7p_aiShz7YI8ZZH0eo_fQ21Ns"; //&callback=initialize";


//This is the async entry point of the whole application
$.getScript(url).done(initialize).fail(errorCallback);

function errorCallback(){
  alert("Failed to contact Google maps API. Please try refreshing the page");
}


function initialize() {
  var mapOptions = {
    center: { lat: 30.25, lng: -97.7500},
    zoom: 8
  };
  map = new google.maps.Map(document.getElementById('map-canvas'),
      mapOptions);

  fakeDatabase = require("./markers.js")(map, google, markerEventHandler);
  placesViewModel = require('./placesViewModel.js')(markerEventHandler, fakeDatabase);
  viewModel = new placesViewModel();
  ko.applyBindings(viewModel);
  viewModel.query.subscribe(viewModel.update);
}


//This is the helper function that toggles infowindows as well as
//the bouncing animation. It is passed to the module that creates and loads the
//map markers, and used in this script as well
function markerEventHandler(marker){
  if (!marker._openedState)
    marker.infoWindow.open(map, marker);
  else
    marker.close();
  if (marker.getAnimation() !== null) {
    marker.setAnimation(null);
  } else {
    marker.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(function(){
      marker.setAnimation(null);
    }, 2200);
  }
}
