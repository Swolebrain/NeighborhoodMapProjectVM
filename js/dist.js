(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
//global vars
var viewModel, fakeDatabase, map;

function getMarkers(str){
  //this function could eventually get replaced with an interaction
  //with a back end
  var ret = [];
  for (var x in fakeDatabase){
    fakeDatabase[x].setMap(null);
    if (fakeDatabase[x].title.indexOf(str) >= 0
       || str.length === 0){
      ret.push(fakeDatabase[x]);
      fakeDatabase[x].setMap(map);
    }
  }
  return ret;
}

function initialize() {
  var mapOptions = {
    center: { lat: 30.25, lng: -97.7500},
    zoom: 8
  };
  map = new google.maps.Map(document.getElementById('map-canvas'),
      mapOptions);

  /*var infowindow = new google.maps.InfoWindow({
      content: "infowindow content string"
  });

  var marker1 = new google.maps.Marker({
    position: new google.maps.LatLng(30.397621, -97.719604),
    map: map,
    title: "IBM Research Lab"
  });
  google.maps.event.addListener(marker1, 'click', function() {
    infowindow.open(map,marker1);
  });*/
  fakeDatabase = require("./markers.js")(map, google);

}
google.maps.event.addDomListener(window, 'load', initialize);


//TEXT INPUT FILTERING
$("#name-filter").on("change keydown keypress", function(){
  var typedText = $(this).val();
  viewModel.update(typedText);
});




function placesViewModel(){
  var self = this;
  
  self.markers = ko.observableArray([]);
  
  self.update = function(typedText){
    self.markers([]);
    var markers = getMarkers(typedText);
    for (var x in markers){
      self.markers.push(markers[x]);
      markers[x].setMap(map);
    }
  }
};

viewModel = new placesViewModel();
ko.applyBindings(viewModel);
},{"./markers.js":2}],2:[function(require,module,exports){
module.exports = function(map, google){
  //labels for map markers:
  var infoWindowStrings = [
    "IBM research center",
    "Big Boss Barbell Club",
    "Neverland Teleportation Lobby",
    "50-Cals Mounted on Pickup Trucks",
    "Gatling Gun Store"
  ];

  //use labels to make an array of infoWindow objects
  var infoWindows = infoWindowStrings.map(function(e){
    return new google.maps.InfoWindow({content: e});
  });

  //create positions for map markers
  var markerData = [
    {position: new google.maps.LatLng(30.397621, -97.719604)},
    {position: new google.maps.LatLng(30.797621, -97.619604)},
    {position: new google.maps.LatLng(30.197621, -97.819604)},
    {position: new google.maps.LatLng(29.897621, -97.419604)},
    {position: new google.maps.LatLng(29.597621, -97.919604)}
  ];
  
  markerData.forEach(function(e, i){ //fill in the rest of the data required to instantiate map markers
    e.map = map;
    e.title = infoWindowStrings[i];
  });
  
  //instantiate map markers
  var markers = markerData.map(function(e){
    return new google.maps.Marker(e);  
  });
  
  markers.forEach(function(e,i){
    //add event listener to each Marker object
    google.maps.event.addListener(e, 'click', () => infoWindows[i].open(map, e));
  });
  return markers;
};
},{}]},{},[1]);