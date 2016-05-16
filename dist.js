(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
  //handle marker openinig/closing:
  if (!marker._openedState && marker.hasThumbnail)
    marker.infoWindow.open(map, marker);
  else if (marker._openedState)
    marker.close();
  //handle marker animation toggling:
  if (marker.getAnimation() !== null) {
    marker.setAnimation(null);
  } else {
    marker.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(function(){
      marker.setAnimation(null);
    }, 2200);
  }
  //code to load images
  if (!marker.hasThumbnail)
    loadImage(marker);
}
//This function loads the image thumbnails for a given map marker
function loadImage(marker){
  var url = `https://pixabay.com/api/?key=2574254-068da214e2b7a749e028d4884&q=${marker.searchStr}&image_type=photo`;
  $.get(url, (resp, txt, xhr) => {
    console.log("This fired. Infowindow: ");
    console.log(marker.infoWindow);
    let imgIdx = Math.floor(Math.random()*resp.hits.length);
    newContent = marker.infoWindow.content+`<br><img src="${resp.hits[imgIdx].previewURL}" border="0" align="left" width="100px" height="auto">`;
    marker.infoWindow = new google.maps.InfoWindow({content: newContent});
    //marker.infoWindow.content+=`<br><img src="${resp.hits[imgIdx].previewURL}" border="0" align="left" width="100px" height="auto">`;
    marker.hasThumbnail = true;
    marker.infoWindow.open(map, marker);
  });
}

},{"./markers.js":2,"./placesViewModel.js":3}],2:[function(require,module,exports){
module.exports = function(map, google, markerEvent){
  google.maps.InfoWindow.prototype._open = google.maps.InfoWindow.prototype.open;
  google.maps.InfoWindow.prototype._close = google.maps.InfoWindow.prototype.close;
  google.maps.InfoWindow.prototype._openedState = false;

  google.maps.InfoWindow.prototype.open = function (map, anchor) {
      this._openedState = true;
      this._open(map, anchor);
  };

  google.maps.InfoWindow.prototype.close = function () {
      this._openedState = false;
      this._close();
  };

  //labels for map markers:
  var infoWindowStrings = [
    "IBM research center",
    "Big Boss Barbell Club",
    "Neverland Teleportation Lobby",
    "Unicorns and Pickup Trucks",
    "Machine Gun Store"
  ];

  //use labels to make an array of infoWindow objects
  var infoWindows = infoWindowStrings.map(function(e){
    return new google.maps.InfoWindow({content: e});
  });

  //create positions for map markers
  var markerData = [
    {position: new google.maps.LatLng(30.397621, -97.719604), searchStr: "IBM"},
    {position: new google.maps.LatLng(30.797621, -97.619604), searchStr: "Barbell"},
    {position: new google.maps.LatLng(30.197621, -97.819604), searchStr: "peter+pan"},
    {position: new google.maps.LatLng(29.897621, -97.419604), searchStr: "unicorn"},
    {position: new google.maps.LatLng(29.597621, -97.919604), searchStr: "machine+gun"}
  ];

  markerData.forEach(function(e, i){
    //fill in the rest of the data required to instantiate map markers
    e.map = map;
    e.title = infoWindowStrings[i];
  });

  //instantiate map markers
  var markers = markerData.map(function(e, i){
    var ret = new google.maps.Marker(e);
    ret.setAnimation(google.maps.Animation.BOUNCE);
    ret.setAnimation(null);
    ret.infoWindow = infoWindows[i];

    //variable to show whether a given marker has
    //already loaded its thumbnail from pixabay or not
    ret.hasThumbnail = false;

    //add event listener to each Marker object
    google.maps.event.addListener(ret, 'click', function(){
      markerEvent(ret);
    });

    return ret;
  });

  return markers;
};

},{}],3:[function(require,module,exports){
module.exports = function (markerEventHandler, fakeDatabase){

  return function(){
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
    self.toggleBounce = markerEventHandler;

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
  };
};

},{}]},{},[1]);
