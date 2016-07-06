(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
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

},{"./markers.js":2,"./placesViewModel.js":3}],2:[function(require,module,exports){
"use strict";
module.exports = function(map, google, markerEvent){
  /*
    The purpose of this code is for the Google Maps infowindow object to keep an instance variable
    named _openedState that is true whenever the infow window is open and false otherwise. I use this
    in the viewmodel to

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
  };*/

  //labels for map markers:
  var infoWindowStrings = [
    "IBM research center",
    "Big Boss Barbell Club",
    "Neverland Teleportation Lobby",
    "Unicorns and Pickup Trucks",
    "Machine Gun Store"
  ];

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
    ret.infoWindow = new google.maps.InfoWindow({content: infoWindowStrings[i]});

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
"use strict";
module.exports = function (markerEventHandler, fakeDatabase){

  return function(){
    var self = this;
    self.markers = ko.observableArray(getMarkers(''));
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
        fakeDatabase[x].infoWindow.close();
        fakeDatabase[x].setAnimation(null);
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

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvbWFpbi1hcHAuanMiLCJzcmMvbWFya2Vycy5qcyIsInNyYy9wbGFjZXNWaWV3TW9kZWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiXCJ1c2Ugc3RyaWN0XCI7XG4vKlxyXG4gIFRoZSBOZWlnaGJvcmhvb2QgTWFwIFByb2plY3QsIGJ5IFZpY3RvciBNb3Jlbm8uXHJcbiAgVGhpcyBhcHAgaWxsdXN0cmF0ZXMgdGhlIHVzZSBvZiBrbm9ja291dC5qcyBhbmQgdHdvIEFQSXMuIFRoaXMgZmlsZSBpcyB0aGUgZW50cnkgcG9pbnQuXHJcblxyXG4gIEluIHBhcnRpY3VsYXIsIHRoZSBhc3luYyBsb2FkaW5nIG9mIHRoZSBnb29nbGUgbWFwcyBzY3JpcHQgdmlhIGpRdWVyeSBpcyB3aGF0IGtpY2tzIGV2ZXJ5dGhpbmcgb2ZmLlxyXG4gIElmIHRoaXMgYXN5bmMgbG9hZGluZyBmYWlscywgdGhlcmUncyBhbiBhbGVydCBsZXR0aW5nIHRoZSB1c2VyIGtub3cgdG8gcmVsb2FkIHRoZSBwYWdlLiBpZiBpdCBzdWNjZWVkcyxcclxuICB0aGVuIHRoZSBpbml0aWFsaXplKCkgZnVuY3Rpb24gaXMgY2FsbGVkLlxyXG4qL1xyXG5cclxuLy9nbG9iYWwgdmFyczpcclxudmFyIGZha2VEYXRhYmFzZSwgbWFwLCB2aWV3TW9kZWwsIGluZm9XaW5kb3csXHJcbiAgICB1cmwgPSAnaHR0cHM6Ly9tYXBzLmdvb2dsZWFwaXMuY29tL21hcHMvYXBpL2pzP2tleT1BSXphU3lEQjhhWEl4djdwX2FpU2h6N1lJOFpaSDBlb19mUTIxTnMnOyAvLyZjYWxsYmFjaz1pbml0aWFsaXplXCI7XHJcblxyXG5cclxuLy9UaGlzIGlzIHRoZSBhc3luYyBlbnRyeSBwb2ludCBvZiB0aGUgd2hvbGUgYXBwbGljYXRpb25cclxuJC5nZXRTY3JpcHQodXJsKS5kb25lKGluaXRpYWxpemUpLmZhaWwoZXJyb3JDYWxsYmFjayk7XHJcblxyXG5mdW5jdGlvbiBlcnJvckNhbGxiYWNrKCl7XHJcbiAgYWxlcnQoJ0ZhaWxlZCB0byBjb250YWN0IEdvb2dsZSBtYXBzIEFQSS4gUGxlYXNlIHRyeSByZWZyZXNoaW5nIHRoZSBwYWdlJyk7XHJcbn1cclxuXHJcblxyXG5mdW5jdGlvbiBpbml0aWFsaXplKCkge1xyXG4gIHZhciBtYXBPcHRpb25zID0ge1xyXG4gICAgY2VudGVyOiB7IGxhdDogMzAuMjUsIGxuZzogLTk3Ljc1MDB9LFxyXG4gICAgem9vbTogOFxyXG4gIH07XHJcbiAgbWFwID0gbmV3IGdvb2dsZS5tYXBzLk1hcChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWFwLWNhbnZhcycpLFxyXG4gICAgICBtYXBPcHRpb25zKTtcclxuXHJcbiAgZmFrZURhdGFiYXNlID0gcmVxdWlyZSgnLi9tYXJrZXJzLmpzJykobWFwLCBnb29nbGUsIG1hcmtlckV2ZW50SGFuZGxlcik7XHJcbiAgdmFyIFBsYWNlc1ZpZXdNb2RlbCA9IHJlcXVpcmUoJy4vcGxhY2VzVmlld01vZGVsLmpzJykobWFya2VyRXZlbnRIYW5kbGVyLCBmYWtlRGF0YWJhc2UpO1xyXG4gIHZpZXdNb2RlbCA9IG5ldyBQbGFjZXNWaWV3TW9kZWwoKTtcclxuICBrby5hcHBseUJpbmRpbmdzKHZpZXdNb2RlbCk7XHJcbiAgdmlld01vZGVsLnF1ZXJ5LnN1YnNjcmliZSh2aWV3TW9kZWwudXBkYXRlKTtcclxufVxyXG5cclxuXHJcbi8vVGhpcyBpcyB0aGUgaGVscGVyIGZ1bmN0aW9uIHRoYXQgdG9nZ2xlcyBpbmZvd2luZG93cyBhcyB3ZWxsIGFzXHJcbi8vdGhlIGJvdW5jaW5nIGFuaW1hdGlvbi4gSXQgaXMgcGFzc2VkIHRvIHRoZSBtb2R1bGUgdGhhdCBjcmVhdGVzIGFuZCBsb2FkcyB0aGVcclxuLy9tYXAgbWFya2VycywgYW5kIHVzZWQgaW4gdGhpcyBzY3JpcHQgYXMgd2VsbFxyXG5mdW5jdGlvbiBtYXJrZXJFdmVudEhhbmRsZXIobWFya2VyKXtcclxuICAvL2Nsb3NlIGFsbCBvcGVuIG1hcmtlcnMsIGNhbmNlbCBhbmltYXRpb25zOlxyXG4gIGZha2VEYXRhYmFzZS5tYXAoKGUpPT4geyBlLmluZm9XaW5kb3cuY2xvc2UoKTsgZS5zZXRBbmltYXRpb24obnVsbCk7fSk7XHJcbiAgLy9oYW5kbGUgbWFya2VyIG9wZW5pbmlnOlxyXG4gIG1hcmtlci5pbmZvV2luZG93Lm9wZW4obWFwLCBtYXJrZXIpO1xyXG4gIC8vcGFuIHRvIHRoZSBtYXJrZXIgYW5kIHpvb20gaW46XHJcbiAgbWFwLnNldFpvb20oMTApO1xyXG4gIG1hcC5wYW5UbyhtYXJrZXIuZ2V0UG9zaXRpb24oKSk7XHJcblxyXG4gIC8vc2V0IHRoZSBhbmltYXRpb24gYW5kIG1ha2Ugc3VyZSBpdCBzdG9wcyBpbiBhIGxpdHRsZSBiaXRcclxuICBtYXJrZXIuc2V0QW5pbWF0aW9uKGdvb2dsZS5tYXBzLkFuaW1hdGlvbi5CT1VOQ0UpO1xyXG4gIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcclxuICAgIG1hcmtlci5zZXRBbmltYXRpb24obnVsbCk7XHJcbiAgfSwgMjEwMCk7XHJcblxyXG4gIC8vbG9hZCB0aGUgaW1hZ2UgaWYgaXQgaGFzbnQgYmVlbiBsb2FkZWQgYWxyZWFkeVxyXG4gIGlmICghbWFya2VyLmhhc1RodW1ibmFpbClcclxuICAgIGxvYWRJbWFnZShtYXJrZXIpO1xyXG59XHJcbi8vVGhpcyBmdW5jdGlvbiBsb2FkcyB0aGUgaW1hZ2UgdGh1bWJuYWlscyBmb3IgYSBnaXZlbiBtYXAgbWFya2VyXHJcbmZ1bmN0aW9uIGxvYWRJbWFnZShtYXJrZXIpe1xyXG4gIC8vVGhlIGZvbGxvd2luZyBpcyBhbiBFUzYgdGVtcGxhdGUgc3RyaW5nLCBpdCBpcyBub3QgdGhlIHdyb25nIHF1b3RlIGNoYXJhY3Rlci4gVGVtcGxhdGUgc3RyaW5ncyBhcmUgbW9yZSBsZWdpYmxlXHJcbiAgdmFyIHVybCA9IGBodHRwczovL3BpeGFiYXkuY29tL2FwaS8/a2V5PTI1NzQyNTQtMDY4ZGEyMTRlMmI3YTc0OWUwMjhkNDg4NCZxPSR7bWFya2VyLnNlYXJjaFN0cn0maW1hZ2VfdHlwZT1waG90b2A7XHJcbiAgJC5nZXQodXJsLCAocmVzcCwgdHh0LCB4aHIpID0+IHtcclxuICAgIHZhciBpbWdJZHggPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqcmVzcC5oaXRzLmxlbmd0aCk7XHJcbiAgICAvL2Fub3RoZXIgZXM2IHRlbXBsYXRlIHN0cmluZzpcclxuICAgIHZhciBuZXdDb250ZW50ID0gbWFya2VyLmluZm9XaW5kb3cuY29udGVudCtgPGJyPjxpbWcgc3JjPVwiJHtyZXNwLmhpdHNbaW1nSWR4XS5wcmV2aWV3VVJMfVwiIGJvcmRlcj1cIjBcIiBhbGlnbj1cImxlZnRcIiB3aWR0aD1cIjEwMHB4XCIgaGVpZ2h0PVwiYXV0b1wiPmA7XHJcbiAgICBtYXJrZXIuaW5mb1dpbmRvdy5zZXRDb250ZW50KG5ld0NvbnRlbnQpO1xyXG4gICAgbWFya2VyLmhhc1RodW1ibmFpbCA9IHRydWU7XHJcbiAgfSkuZmFpbChmdW5jdGlvbihlcnIpeyAvL2Vycm9yIGhhbmRsaW5nIGZvciBwaXhhYmF5IGFqYXggY2FsbFxyXG4gICAgYWxlcnQoXCJGYWlsZWQgbG9hZGluZyBpbWFnZSBmcm9tIHBpeGFiYXkhIFBsZWFzZSBjb250YWN0IHRoZSBzaXRlIGFkbWluLlwiKVxyXG4gIH0pO1xyXG59XHJcbiIsIlwidXNlIHN0cmljdFwiO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihtYXAsIGdvb2dsZSwgbWFya2VyRXZlbnQpe1xyXG4gIC8qXHJcbiAgICBUaGUgcHVycG9zZSBvZiB0aGlzIGNvZGUgaXMgZm9yIHRoZSBHb29nbGUgTWFwcyBpbmZvd2luZG93IG9iamVjdCB0byBrZWVwIGFuIGluc3RhbmNlIHZhcmlhYmxlXHJcbiAgICBuYW1lZCBfb3BlbmVkU3RhdGUgdGhhdCBpcyB0cnVlIHdoZW5ldmVyIHRoZSBpbmZvdyB3aW5kb3cgaXMgb3BlbiBhbmQgZmFsc2Ugb3RoZXJ3aXNlLiBJIHVzZSB0aGlzXHJcbiAgICBpbiB0aGUgdmlld21vZGVsIHRvXHJcblxyXG4gIGdvb2dsZS5tYXBzLkluZm9XaW5kb3cucHJvdG90eXBlLl9vcGVuID0gZ29vZ2xlLm1hcHMuSW5mb1dpbmRvdy5wcm90b3R5cGUub3BlbjtcclxuICBnb29nbGUubWFwcy5JbmZvV2luZG93LnByb3RvdHlwZS5fY2xvc2UgPSBnb29nbGUubWFwcy5JbmZvV2luZG93LnByb3RvdHlwZS5jbG9zZTtcclxuICBnb29nbGUubWFwcy5JbmZvV2luZG93LnByb3RvdHlwZS5fb3BlbmVkU3RhdGUgPSBmYWxzZTtcclxuXHJcbiAgZ29vZ2xlLm1hcHMuSW5mb1dpbmRvdy5wcm90b3R5cGUub3BlbiA9IGZ1bmN0aW9uIChtYXAsIGFuY2hvcikge1xyXG4gICAgICB0aGlzLl9vcGVuZWRTdGF0ZSA9IHRydWU7XHJcbiAgICAgIHRoaXMuX29wZW4obWFwLCBhbmNob3IpO1xyXG4gIH07XHJcblxyXG4gIGdvb2dsZS5tYXBzLkluZm9XaW5kb3cucHJvdG90eXBlLmNsb3NlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICB0aGlzLl9vcGVuZWRTdGF0ZSA9IGZhbHNlO1xyXG4gICAgICB0aGlzLl9jbG9zZSgpO1xyXG4gIH07Ki9cclxuXHJcbiAgLy9sYWJlbHMgZm9yIG1hcCBtYXJrZXJzOlxyXG4gIHZhciBpbmZvV2luZG93U3RyaW5ncyA9IFtcclxuICAgIFwiSUJNIHJlc2VhcmNoIGNlbnRlclwiLFxyXG4gICAgXCJCaWcgQm9zcyBCYXJiZWxsIENsdWJcIixcclxuICAgIFwiTmV2ZXJsYW5kIFRlbGVwb3J0YXRpb24gTG9iYnlcIixcclxuICAgIFwiVW5pY29ybnMgYW5kIFBpY2t1cCBUcnVja3NcIixcclxuICAgIFwiTWFjaGluZSBHdW4gU3RvcmVcIlxyXG4gIF07XHJcblxyXG4gIC8vY3JlYXRlIHBvc2l0aW9ucyBmb3IgbWFwIG1hcmtlcnNcclxuICB2YXIgbWFya2VyRGF0YSA9IFtcclxuICAgIHtwb3NpdGlvbjogbmV3IGdvb2dsZS5tYXBzLkxhdExuZygzMC4zOTc2MjEsIC05Ny43MTk2MDQpLCBzZWFyY2hTdHI6IFwiSUJNXCJ9LFxyXG4gICAge3Bvc2l0aW9uOiBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKDMwLjc5NzYyMSwgLTk3LjYxOTYwNCksIHNlYXJjaFN0cjogXCJCYXJiZWxsXCJ9LFxyXG4gICAge3Bvc2l0aW9uOiBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKDMwLjE5NzYyMSwgLTk3LjgxOTYwNCksIHNlYXJjaFN0cjogXCJwZXRlcitwYW5cIn0sXHJcbiAgICB7cG9zaXRpb246IG5ldyBnb29nbGUubWFwcy5MYXRMbmcoMjkuODk3NjIxLCAtOTcuNDE5NjA0KSwgc2VhcmNoU3RyOiBcInVuaWNvcm5cIn0sXHJcbiAgICB7cG9zaXRpb246IG5ldyBnb29nbGUubWFwcy5MYXRMbmcoMjkuNTk3NjIxLCAtOTcuOTE5NjA0KSwgc2VhcmNoU3RyOiBcIm1hY2hpbmUrZ3VuXCJ9XHJcbiAgXTtcclxuXHJcbiAgbWFya2VyRGF0YS5mb3JFYWNoKGZ1bmN0aW9uKGUsIGkpe1xyXG4gICAgLy9maWxsIGluIHRoZSByZXN0IG9mIHRoZSBkYXRhIHJlcXVpcmVkIHRvIGluc3RhbnRpYXRlIG1hcCBtYXJrZXJzXHJcbiAgICBlLm1hcCA9IG1hcDtcclxuICAgIGUudGl0bGUgPSBpbmZvV2luZG93U3RyaW5nc1tpXTtcclxuICB9KTtcclxuXHJcbiAgLy9pbnN0YW50aWF0ZSBtYXAgbWFya2Vyc1xyXG4gIHZhciBtYXJrZXJzID0gbWFya2VyRGF0YS5tYXAoZnVuY3Rpb24oZSwgaSl7XHJcbiAgICB2YXIgcmV0ID0gbmV3IGdvb2dsZS5tYXBzLk1hcmtlcihlKTtcclxuICAgIHJldC5zZXRBbmltYXRpb24oZ29vZ2xlLm1hcHMuQW5pbWF0aW9uLkJPVU5DRSk7XHJcbiAgICByZXQuc2V0QW5pbWF0aW9uKG51bGwpO1xyXG4gICAgcmV0LmluZm9XaW5kb3cgPSBuZXcgZ29vZ2xlLm1hcHMuSW5mb1dpbmRvdyh7Y29udGVudDogaW5mb1dpbmRvd1N0cmluZ3NbaV19KTtcclxuXHJcbiAgICAvL3ZhcmlhYmxlIHRvIHNob3cgd2hldGhlciBhIGdpdmVuIG1hcmtlciBoYXNcclxuICAgIC8vYWxyZWFkeSBsb2FkZWQgaXRzIHRodW1ibmFpbCBmcm9tIHBpeGFiYXkgb3Igbm90XHJcbiAgICByZXQuaGFzVGh1bWJuYWlsID0gZmFsc2U7XHJcblxyXG4gICAgLy9hZGQgZXZlbnQgbGlzdGVuZXIgdG8gZWFjaCBNYXJrZXIgb2JqZWN0XHJcbiAgICBnb29nbGUubWFwcy5ldmVudC5hZGRMaXN0ZW5lcihyZXQsICdjbGljaycsIGZ1bmN0aW9uKCl7XHJcbiAgICAgIG1hcmtlckV2ZW50KHJldCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gcmV0O1xyXG4gIH0pO1xyXG5cclxuICByZXR1cm4gbWFya2VycztcclxufTtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChtYXJrZXJFdmVudEhhbmRsZXIsIGZha2VEYXRhYmFzZSl7XHJcblxyXG4gIHJldHVybiBmdW5jdGlvbigpe1xyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgc2VsZi5tYXJrZXJzID0ga28ub2JzZXJ2YWJsZUFycmF5KGdldE1hcmtlcnMoJycpKTtcclxuICAgIHNlbGYucXVlcnkgPSBrby5vYnNlcnZhYmxlKCcnKTtcclxuXHJcbiAgICBzZWxmLnVwZGF0ZSA9IGZ1bmN0aW9uKHR5cGVkVGV4dCl7XHJcbiAgICAgIHNlbGYubWFya2VycyhbXSk7XHJcbiAgICAgIHZhciBtYXJrZXJzID0gZ2V0TWFya2Vycyh0eXBlZFRleHQpO1xyXG4gICAgICBmb3IgKHZhciB4IGluIG1hcmtlcnMpe1xyXG4gICAgICAgIHNlbGYubWFya2Vycy5wdXNoKG1hcmtlcnNbeF0pO1xyXG5cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vZnVuY3Rpb24gdG8gbWFrZSBtYXAgbWFya2VycyBib3VuY2VcclxuICAgIHNlbGYudG9nZ2xlQm91bmNlID0gbWFya2VyRXZlbnRIYW5kbGVyO1xyXG5cclxuICAgIC8vZGVidWcgZnVuY3Rpb24gdG8gcHJpbnQgbWFwIG1hcmtlcnNcclxuICAgIHNlbGYucHJpbnRNYXJrZXJzID0gZnVuY3Rpb24oKXsgZm9yKHZhciB4IGluIHNlbGYubWFya2Vycyljb25zb2xlLmxvZyhzZWxmLm1hcmtlcnNbeF0pO31cclxuXHJcblxyXG4gICAgZnVuY3Rpb24gZ2V0TWFya2VycyhzdHIpe1xyXG4gICAgICAvL3RoaXMgZnVuY3Rpb24gY291bGQgZXZlbnR1YWxseSBnZXQgcmVwbGFjZWQgd2l0aCBhbiBpbnRlcmFjdGlvblxyXG4gICAgICAvL3dpdGggYSBiYWNrIGVuZFxyXG4gICAgICB2YXIgcmV0ID0gW107XHJcbiAgICAgIGZvciAodmFyIHggaW4gZmFrZURhdGFiYXNlKXtcclxuICAgICAgICBmYWtlRGF0YWJhc2VbeF0uaW5mb1dpbmRvdy5jbG9zZSgpO1xyXG4gICAgICAgIGZha2VEYXRhYmFzZVt4XS5zZXRBbmltYXRpb24obnVsbCk7XHJcbiAgICAgICAgaWYgKGZha2VEYXRhYmFzZVt4XS50aXRsZS50b0xvd2VyQ2FzZSgpLmluZGV4T2Yoc3RyLnRvTG93ZXJDYXNlKCkpID49IDBcclxuICAgICAgICAgICB8fCBzdHIubGVuZ3RoID09PSAwKXtcclxuICAgICAgICAgIHJldC5wdXNoKGZha2VEYXRhYmFzZVt4XSk7XHJcbiAgICAgICAgICBmYWtlRGF0YWJhc2VbeF0uc2V0VmlzaWJsZSh0cnVlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgZmFrZURhdGFiYXNlW3hdLnNldFZpc2libGUoZmFsc2UpO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiByZXQ7XHJcbiAgICB9XHJcbiAgfTtcclxufTtcclxuIl19
