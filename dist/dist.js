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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvbWFpbi1hcHAuanMiLCJzcmMvbWFya2Vycy5qcyIsInNyYy9wbGFjZXNWaWV3TW9kZWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcInVzZSBzdHJpY3RcIjtcbi8qXHJcbiAgVGhlIE5laWdoYm9yaG9vZCBNYXAgUHJvamVjdCwgYnkgVmljdG9yIE1vcmVuby5cclxuICBUaGlzIGFwcCBpbGx1c3RyYXRlcyB0aGUgdXNlIG9mIGtub2Nrb3V0LmpzIGFuZCB0d28gQVBJcy4gVGhpcyBmaWxlIGlzIHRoZSBlbnRyeSBwb2ludC5cclxuXHJcbiAgSW4gcGFydGljdWxhciwgdGhlIGFzeW5jIGxvYWRpbmcgb2YgdGhlIGdvb2dsZSBtYXBzIHNjcmlwdCB2aWEgalF1ZXJ5IGlzIHdoYXQga2lja3MgZXZlcnl0aGluZyBvZmYuXHJcbiAgSWYgdGhpcyBhc3luYyBsb2FkaW5nIGZhaWxzLCB0aGVyZSdzIGFuIGFsZXJ0IGxldHRpbmcgdGhlIHVzZXIga25vdyB0byByZWxvYWQgdGhlIHBhZ2UuIGlmIGl0IHN1Y2NlZWRzLFxyXG4gIHRoZW4gdGhlIGluaXRpYWxpemUoKSBmdW5jdGlvbiBpcyBjYWxsZWQuXHJcbiovXHJcblxyXG4vL2dsb2JhbCB2YXJzOlxyXG52YXIgZmFrZURhdGFiYXNlLCBtYXAsIHZpZXdNb2RlbCwgaW5mb1dpbmRvdyxcclxuICAgIHVybCA9ICdodHRwczovL21hcHMuZ29vZ2xlYXBpcy5jb20vbWFwcy9hcGkvanM/a2V5PUFJemFTeURCOGFYSXh2N3BfYWlTaHo3WUk4WlpIMGVvX2ZRMjFOcyc7IC8vJmNhbGxiYWNrPWluaXRpYWxpemVcIjtcclxuXHJcblxyXG4vL1RoaXMgaXMgdGhlIGFzeW5jIGVudHJ5IHBvaW50IG9mIHRoZSB3aG9sZSBhcHBsaWNhdGlvblxyXG4kLmdldFNjcmlwdCh1cmwpLmRvbmUoaW5pdGlhbGl6ZSkuZmFpbChlcnJvckNhbGxiYWNrKTtcclxuXHJcbmZ1bmN0aW9uIGVycm9yQ2FsbGJhY2soKXtcclxuICBhbGVydCgnRmFpbGVkIHRvIGNvbnRhY3QgR29vZ2xlIG1hcHMgQVBJLiBQbGVhc2UgdHJ5IHJlZnJlc2hpbmcgdGhlIHBhZ2UnKTtcclxufVxyXG5cclxuXHJcbmZ1bmN0aW9uIGluaXRpYWxpemUoKSB7XHJcbiAgdmFyIG1hcE9wdGlvbnMgPSB7XHJcbiAgICBjZW50ZXI6IHsgbGF0OiAzMC4yNSwgbG5nOiAtOTcuNzUwMH0sXHJcbiAgICB6b29tOiA4XHJcbiAgfTtcclxuICBtYXAgPSBuZXcgZ29vZ2xlLm1hcHMuTWFwKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtYXAtY2FudmFzJyksXHJcbiAgICAgIG1hcE9wdGlvbnMpO1xyXG5cclxuICBmYWtlRGF0YWJhc2UgPSByZXF1aXJlKCcuL21hcmtlcnMuanMnKShtYXAsIGdvb2dsZSwgbWFya2VyRXZlbnRIYW5kbGVyKTtcclxuICB2YXIgUGxhY2VzVmlld01vZGVsID0gcmVxdWlyZSgnLi9wbGFjZXNWaWV3TW9kZWwuanMnKShtYXJrZXJFdmVudEhhbmRsZXIsIGZha2VEYXRhYmFzZSk7XHJcbiAgdmlld01vZGVsID0gbmV3IFBsYWNlc1ZpZXdNb2RlbCgpO1xyXG4gIGtvLmFwcGx5QmluZGluZ3Modmlld01vZGVsKTtcclxuICB2aWV3TW9kZWwucXVlcnkuc3Vic2NyaWJlKHZpZXdNb2RlbC51cGRhdGUpO1xyXG59XHJcblxyXG5cclxuLy9UaGlzIGlzIHRoZSBoZWxwZXIgZnVuY3Rpb24gdGhhdCB0b2dnbGVzIGluZm93aW5kb3dzIGFzIHdlbGwgYXNcclxuLy90aGUgYm91bmNpbmcgYW5pbWF0aW9uLiBJdCBpcyBwYXNzZWQgdG8gdGhlIG1vZHVsZSB0aGF0IGNyZWF0ZXMgYW5kIGxvYWRzIHRoZVxyXG4vL21hcCBtYXJrZXJzLCBhbmQgdXNlZCBpbiB0aGlzIHNjcmlwdCBhcyB3ZWxsXHJcbmZ1bmN0aW9uIG1hcmtlckV2ZW50SGFuZGxlcihtYXJrZXIpe1xyXG4gIC8vY2xvc2UgYWxsIG9wZW4gbWFya2VycywgY2FuY2VsIGFuaW1hdGlvbnM6XHJcbiAgZmFrZURhdGFiYXNlLm1hcCgoZSk9PiB7IGUuaW5mb1dpbmRvdy5jbG9zZSgpOyBlLnNldEFuaW1hdGlvbihudWxsKTt9KTtcclxuICAvL2hhbmRsZSBtYXJrZXIgb3BlbmluaWc6XHJcbiAgbWFya2VyLmluZm9XaW5kb3cub3BlbihtYXAsIG1hcmtlcik7XHJcbiAgLy9wYW4gdG8gdGhlIG1hcmtlciBhbmQgem9vbSBpbjpcclxuICBtYXAuc2V0Wm9vbSgxMCk7XHJcbiAgbWFwLnBhblRvKG1hcmtlci5nZXRQb3NpdGlvbigpKTtcclxuXHJcbiAgLy9zZXQgdGhlIGFuaW1hdGlvbiBhbmQgbWFrZSBzdXJlIGl0IHN0b3BzIGluIGEgbGl0dGxlIGJpdFxyXG4gIG1hcmtlci5zZXRBbmltYXRpb24oZ29vZ2xlLm1hcHMuQW5pbWF0aW9uLkJPVU5DRSk7XHJcbiAgc2V0VGltZW91dChmdW5jdGlvbigpe1xyXG4gICAgbWFya2VyLnNldEFuaW1hdGlvbihudWxsKTtcclxuICB9LCAyMTAwKTtcclxuXHJcbiAgLy9sb2FkIHRoZSBpbWFnZSBpZiBpdCBoYXNudCBiZWVuIGxvYWRlZCBhbHJlYWR5XHJcbiAgaWYgKCFtYXJrZXIuaGFzVGh1bWJuYWlsKVxyXG4gICAgbG9hZEltYWdlKG1hcmtlcik7XHJcbn1cclxuLy9UaGlzIGZ1bmN0aW9uIGxvYWRzIHRoZSBpbWFnZSB0aHVtYm5haWxzIGZvciBhIGdpdmVuIG1hcCBtYXJrZXJcclxuZnVuY3Rpb24gbG9hZEltYWdlKG1hcmtlcil7XHJcbiAgLy9UaGUgZm9sbG93aW5nIGlzIGFuIEVTNiB0ZW1wbGF0ZSBzdHJpbmcsIGl0IGlzIG5vdCB0aGUgd3JvbmcgcXVvdGUgY2hhcmFjdGVyLiBUZW1wbGF0ZSBzdHJpbmdzIGFyZSBtb3JlIGxlZ2libGVcclxuICB2YXIgdXJsID0gYGh0dHBzOi8vcGl4YWJheS5jb20vYXBpLz9rZXk9MjU3NDI1NC0wNjhkYTIxNGUyYjdhNzQ5ZTAyOGQ0ODg0JnE9JHttYXJrZXIuc2VhcmNoU3RyfSZpbWFnZV90eXBlPXBob3RvYDtcclxuICAkLmdldCh1cmwsIChyZXNwLCB0eHQsIHhocikgPT4ge1xyXG4gICAgdmFyIGltZ0lkeCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSpyZXNwLmhpdHMubGVuZ3RoKTtcclxuICAgIC8vYW5vdGhlciBlczYgdGVtcGxhdGUgc3RyaW5nOlxyXG4gICAgdmFyIG5ld0NvbnRlbnQgPSBtYXJrZXIuaW5mb1dpbmRvdy5jb250ZW50K2A8YnI+PGltZyBzcmM9XCIke3Jlc3AuaGl0c1tpbWdJZHhdLnByZXZpZXdVUkx9XCIgYm9yZGVyPVwiMFwiIGFsaWduPVwibGVmdFwiIHdpZHRoPVwiMTAwcHhcIiBoZWlnaHQ9XCJhdXRvXCI+YDtcclxuICAgIG1hcmtlci5pbmZvV2luZG93LnNldENvbnRlbnQobmV3Q29udGVudCk7XHJcbiAgICBtYXJrZXIuaGFzVGh1bWJuYWlsID0gdHJ1ZTtcclxuICB9KS5mYWlsKGZ1bmN0aW9uKGVycil7IC8vZXJyb3IgaGFuZGxpbmcgZm9yIHBpeGFiYXkgYWpheCBjYWxsXHJcbiAgICBhbGVydChcIkZhaWxlZCBsb2FkaW5nIGltYWdlIGZyb20gcGl4YWJheSEgUGxlYXNlIGNvbnRhY3QgdGhlIHNpdGUgYWRtaW4uXCIpXHJcbiAgfSk7XHJcbn1cclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG1hcCwgZ29vZ2xlLCBtYXJrZXJFdmVudCl7XHJcbiAgLypcclxuICAgIFRoZSBwdXJwb3NlIG9mIHRoaXMgY29kZSBpcyBmb3IgdGhlIEdvb2dsZSBNYXBzIGluZm93aW5kb3cgb2JqZWN0IHRvIGtlZXAgYW4gaW5zdGFuY2UgdmFyaWFibGVcclxuICAgIG5hbWVkIF9vcGVuZWRTdGF0ZSB0aGF0IGlzIHRydWUgd2hlbmV2ZXIgdGhlIGluZm93IHdpbmRvdyBpcyBvcGVuIGFuZCBmYWxzZSBvdGhlcndpc2UuIEkgdXNlIHRoaXNcclxuICAgIGluIHRoZSB2aWV3bW9kZWwgdG9cclxuXHJcbiAgZ29vZ2xlLm1hcHMuSW5mb1dpbmRvdy5wcm90b3R5cGUuX29wZW4gPSBnb29nbGUubWFwcy5JbmZvV2luZG93LnByb3RvdHlwZS5vcGVuO1xyXG4gIGdvb2dsZS5tYXBzLkluZm9XaW5kb3cucHJvdG90eXBlLl9jbG9zZSA9IGdvb2dsZS5tYXBzLkluZm9XaW5kb3cucHJvdG90eXBlLmNsb3NlO1xyXG4gIGdvb2dsZS5tYXBzLkluZm9XaW5kb3cucHJvdG90eXBlLl9vcGVuZWRTdGF0ZSA9IGZhbHNlO1xyXG5cclxuICBnb29nbGUubWFwcy5JbmZvV2luZG93LnByb3RvdHlwZS5vcGVuID0gZnVuY3Rpb24gKG1hcCwgYW5jaG9yKSB7XHJcbiAgICAgIHRoaXMuX29wZW5lZFN0YXRlID0gdHJ1ZTtcclxuICAgICAgdGhpcy5fb3BlbihtYXAsIGFuY2hvcik7XHJcbiAgfTtcclxuXHJcbiAgZ29vZ2xlLm1hcHMuSW5mb1dpbmRvdy5wcm90b3R5cGUuY2xvc2UgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHRoaXMuX29wZW5lZFN0YXRlID0gZmFsc2U7XHJcbiAgICAgIHRoaXMuX2Nsb3NlKCk7XHJcbiAgfTsqL1xyXG5cclxuICAvL2xhYmVscyBmb3IgbWFwIG1hcmtlcnM6XHJcbiAgdmFyIGluZm9XaW5kb3dTdHJpbmdzID0gW1xyXG4gICAgXCJJQk0gcmVzZWFyY2ggY2VudGVyXCIsXHJcbiAgICBcIkJpZyBCb3NzIEJhcmJlbGwgQ2x1YlwiLFxyXG4gICAgXCJOZXZlcmxhbmQgVGVsZXBvcnRhdGlvbiBMb2JieVwiLFxyXG4gICAgXCJVbmljb3JucyBhbmQgUGlja3VwIFRydWNrc1wiLFxyXG4gICAgXCJNYWNoaW5lIEd1biBTdG9yZVwiXHJcbiAgXTtcclxuXHJcbiAgLy9jcmVhdGUgcG9zaXRpb25zIGZvciBtYXAgbWFya2Vyc1xyXG4gIHZhciBtYXJrZXJEYXRhID0gW1xyXG4gICAge3Bvc2l0aW9uOiBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKDMwLjM5NzYyMSwgLTk3LjcxOTYwNCksIHNlYXJjaFN0cjogXCJJQk1cIn0sXHJcbiAgICB7cG9zaXRpb246IG5ldyBnb29nbGUubWFwcy5MYXRMbmcoMzAuNzk3NjIxLCAtOTcuNjE5NjA0KSwgc2VhcmNoU3RyOiBcIkJhcmJlbGxcIn0sXHJcbiAgICB7cG9zaXRpb246IG5ldyBnb29nbGUubWFwcy5MYXRMbmcoMzAuMTk3NjIxLCAtOTcuODE5NjA0KSwgc2VhcmNoU3RyOiBcInBldGVyK3BhblwifSxcclxuICAgIHtwb3NpdGlvbjogbmV3IGdvb2dsZS5tYXBzLkxhdExuZygyOS44OTc2MjEsIC05Ny40MTk2MDQpLCBzZWFyY2hTdHI6IFwidW5pY29yblwifSxcclxuICAgIHtwb3NpdGlvbjogbmV3IGdvb2dsZS5tYXBzLkxhdExuZygyOS41OTc2MjEsIC05Ny45MTk2MDQpLCBzZWFyY2hTdHI6IFwibWFjaGluZStndW5cIn1cclxuICBdO1xyXG5cclxuICBtYXJrZXJEYXRhLmZvckVhY2goZnVuY3Rpb24oZSwgaSl7XHJcbiAgICAvL2ZpbGwgaW4gdGhlIHJlc3Qgb2YgdGhlIGRhdGEgcmVxdWlyZWQgdG8gaW5zdGFudGlhdGUgbWFwIG1hcmtlcnNcclxuICAgIGUubWFwID0gbWFwO1xyXG4gICAgZS50aXRsZSA9IGluZm9XaW5kb3dTdHJpbmdzW2ldO1xyXG4gIH0pO1xyXG5cclxuICAvL2luc3RhbnRpYXRlIG1hcCBtYXJrZXJzXHJcbiAgdmFyIG1hcmtlcnMgPSBtYXJrZXJEYXRhLm1hcChmdW5jdGlvbihlLCBpKXtcclxuICAgIHZhciByZXQgPSBuZXcgZ29vZ2xlLm1hcHMuTWFya2VyKGUpO1xyXG4gICAgcmV0LnNldEFuaW1hdGlvbihnb29nbGUubWFwcy5BbmltYXRpb24uQk9VTkNFKTtcclxuICAgIHJldC5zZXRBbmltYXRpb24obnVsbCk7XHJcbiAgICByZXQuaW5mb1dpbmRvdyA9IG5ldyBnb29nbGUubWFwcy5JbmZvV2luZG93KHtjb250ZW50OiBpbmZvV2luZG93U3RyaW5nc1tpXX0pO1xyXG5cclxuICAgIC8vdmFyaWFibGUgdG8gc2hvdyB3aGV0aGVyIGEgZ2l2ZW4gbWFya2VyIGhhc1xyXG4gICAgLy9hbHJlYWR5IGxvYWRlZCBpdHMgdGh1bWJuYWlsIGZyb20gcGl4YWJheSBvciBub3RcclxuICAgIHJldC5oYXNUaHVtYm5haWwgPSBmYWxzZTtcclxuXHJcbiAgICAvL2FkZCBldmVudCBsaXN0ZW5lciB0byBlYWNoIE1hcmtlciBvYmplY3RcclxuICAgIGdvb2dsZS5tYXBzLmV2ZW50LmFkZExpc3RlbmVyKHJldCwgJ2NsaWNrJywgZnVuY3Rpb24oKXtcclxuICAgICAgbWFya2VyRXZlbnQocmV0KTtcclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiByZXQ7XHJcbiAgfSk7XHJcblxyXG4gIHJldHVybiBtYXJrZXJzO1xyXG59O1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKG1hcmtlckV2ZW50SGFuZGxlciwgZmFrZURhdGFiYXNlKXtcclxuXHJcbiAgcmV0dXJuIGZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICBzZWxmLm1hcmtlcnMgPSBrby5vYnNlcnZhYmxlQXJyYXkoZ2V0TWFya2VycygnJykpO1xyXG4gICAgc2VsZi5xdWVyeSA9IGtvLm9ic2VydmFibGUoJycpO1xyXG5cclxuICAgIHNlbGYudXBkYXRlID0gZnVuY3Rpb24odHlwZWRUZXh0KXtcclxuICAgICAgc2VsZi5tYXJrZXJzKFtdKTtcclxuICAgICAgdmFyIG1hcmtlcnMgPSBnZXRNYXJrZXJzKHR5cGVkVGV4dCk7XHJcbiAgICAgIGZvciAodmFyIHggaW4gbWFya2Vycyl7XHJcbiAgICAgICAgc2VsZi5tYXJrZXJzLnB1c2gobWFya2Vyc1t4XSk7XHJcblxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy9mdW5jdGlvbiB0byBtYWtlIG1hcCBtYXJrZXJzIGJvdW5jZVxyXG4gICAgc2VsZi50b2dnbGVCb3VuY2UgPSBtYXJrZXJFdmVudEhhbmRsZXI7XHJcblxyXG4gICAgLy9kZWJ1ZyBmdW5jdGlvbiB0byBwcmludCBtYXAgbWFya2Vyc1xyXG4gICAgc2VsZi5wcmludE1hcmtlcnMgPSBmdW5jdGlvbigpeyBmb3IodmFyIHggaW4gc2VsZi5tYXJrZXJzKWNvbnNvbGUubG9nKHNlbGYubWFya2Vyc1t4XSk7fVxyXG5cclxuXHJcbiAgICBmdW5jdGlvbiBnZXRNYXJrZXJzKHN0cil7XHJcbiAgICAgIC8vdGhpcyBmdW5jdGlvbiBjb3VsZCBldmVudHVhbGx5IGdldCByZXBsYWNlZCB3aXRoIGFuIGludGVyYWN0aW9uXHJcbiAgICAgIC8vd2l0aCBhIGJhY2sgZW5kXHJcbiAgICAgIHZhciByZXQgPSBbXTtcclxuICAgICAgZm9yICh2YXIgeCBpbiBmYWtlRGF0YWJhc2Upe1xyXG4gICAgICAgIGlmIChmYWtlRGF0YWJhc2VbeF0udGl0bGUudG9Mb3dlckNhc2UoKS5pbmRleE9mKHN0ci50b0xvd2VyQ2FzZSgpKSA+PSAwXHJcbiAgICAgICAgICAgfHwgc3RyLmxlbmd0aCA9PT0gMCl7XHJcbiAgICAgICAgICByZXQucHVzaChmYWtlRGF0YWJhc2VbeF0pO1xyXG4gICAgICAgICAgZmFrZURhdGFiYXNlW3hdLnNldFZpc2libGUodHJ1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgIGZha2VEYXRhYmFzZVt4XS5zZXRWaXNpYmxlKGZhbHNlKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gcmV0O1xyXG4gICAgfVxyXG4gIH07XHJcbn07XHJcbiJdfQ==
