//global vars:
var fakeDatabase, map, viewModel,
    url = "https://maps.googleapis.com/maps/api/js?key=AIzaSyDB8aXIxv7p_aiShz7YI8ZZH0eo_fQ21Ns"; //&callback=initialize";
//This is the helper function that toggles infowindows as well as 
//the bouncing animation. It is passed to the module that creates and loads the 
//map markers, and used in this script as well
function markerEvent(marker){
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

  fakeDatabase = require("./markers.js")(map, google, markerEvent);
  viewModel = new placesViewModel();
  ko.applyBindings(viewModel);
  viewModel.query.subscribe(viewModel.update);
}


function placesViewModel(){
  var self = this;
  
  self.markers = ko.observableArray(getMarkers(""));
  
  self.query = ko.observable('');
  
  self.update = function(typedText){
    self.markers([]);
    var markers = getMarkers(typedText);
    for (var x in markers){
      self.markers.push(markers[x]);
      
    }
  }
  
  //function to make map markers bounce
  self.toggleBounce = markerEvent;
  
  
  //debug function to print map markers
  self.printMarkers = function(){ for(var x in self.markers)console.log(self.markers[x]);}
  
  
  function getMarkers(str){
    //this function could eventually get replaced with an interaction
    //with a back end
    var ret = [];
    for (var x in fakeDatabase){
      if (fakeDatabase[x].title.toLowerCase().indexOf(str.toLowerCase()) >= 0
         || str.length === 0){
        ret.push(fakeDatabase[x]);
        fakeDatabase[x].setVisible(true);
      }
      else
        fakeDatabase[x].setVisible(false);
    }
    return ret;
  }
}

