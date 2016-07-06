/*
  The Neighborhood Map Project, by Victor Moreno.
  This app illustrates the use of knockout.js and two APIs. This file is the entry point.

  In particular, the async loading of the google maps script via jQuery is what kicks everything off.
  If this async loading fails, there's an alert letting the user know to reload the page. if it succeeds,
  then the initialize() function is called.
*/

//global vars:
//These aren't really global since browserify provides a closure
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

  fakeDatabase = require('./markers.js')(map, google);
  var PlacesViewModel = require('./placesViewModel.js')(fakeDatabase);
  viewModel = new PlacesViewModel();
  ko.applyBindings(viewModel);
  viewModel.query.subscribe(viewModel.update);
}
