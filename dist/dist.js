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

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvbWFpbi1hcHAuanMiLCJzcmMvbWFya2Vycy5qcyIsInNyYy9wbGFjZXNWaWV3TW9kZWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvL2dsb2JhbCB2YXJzOlxyXG52YXIgZmFrZURhdGFiYXNlLCBtYXAsIHZpZXdNb2RlbCxcclxuICAgIHVybCA9IFwiaHR0cHM6Ly9tYXBzLmdvb2dsZWFwaXMuY29tL21hcHMvYXBpL2pzP2tleT1BSXphU3lEQjhhWEl4djdwX2FpU2h6N1lJOFpaSDBlb19mUTIxTnNcIjsgLy8mY2FsbGJhY2s9aW5pdGlhbGl6ZVwiO1xyXG5cclxuXHJcbi8vVGhpcyBpcyB0aGUgYXN5bmMgZW50cnkgcG9pbnQgb2YgdGhlIHdob2xlIGFwcGxpY2F0aW9uXHJcbiQuZ2V0U2NyaXB0KHVybCkuZG9uZShpbml0aWFsaXplKS5mYWlsKGVycm9yQ2FsbGJhY2spO1xyXG5cclxuZnVuY3Rpb24gZXJyb3JDYWxsYmFjaygpe1xyXG4gIGFsZXJ0KFwiRmFpbGVkIHRvIGNvbnRhY3QgR29vZ2xlIG1hcHMgQVBJLiBQbGVhc2UgdHJ5IHJlZnJlc2hpbmcgdGhlIHBhZ2VcIik7XHJcbn1cclxuXHJcblxyXG5mdW5jdGlvbiBpbml0aWFsaXplKCkge1xyXG4gIHZhciBtYXBPcHRpb25zID0ge1xyXG4gICAgY2VudGVyOiB7IGxhdDogMzAuMjUsIGxuZzogLTk3Ljc1MDB9LFxyXG4gICAgem9vbTogOFxyXG4gIH07XHJcbiAgbWFwID0gbmV3IGdvb2dsZS5tYXBzLk1hcChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWFwLWNhbnZhcycpLFxyXG4gICAgICBtYXBPcHRpb25zKTtcclxuXHJcbiAgZmFrZURhdGFiYXNlID0gcmVxdWlyZShcIi4vbWFya2Vycy5qc1wiKShtYXAsIGdvb2dsZSwgbWFya2VyRXZlbnRIYW5kbGVyKTtcclxuICBwbGFjZXNWaWV3TW9kZWwgPSByZXF1aXJlKCcuL3BsYWNlc1ZpZXdNb2RlbC5qcycpKG1hcmtlckV2ZW50SGFuZGxlciwgZmFrZURhdGFiYXNlKTtcclxuICB2aWV3TW9kZWwgPSBuZXcgcGxhY2VzVmlld01vZGVsKCk7XHJcbiAga28uYXBwbHlCaW5kaW5ncyh2aWV3TW9kZWwpO1xyXG4gIHZpZXdNb2RlbC5xdWVyeS5zdWJzY3JpYmUodmlld01vZGVsLnVwZGF0ZSk7XHJcbn1cclxuXHJcblxyXG4vL1RoaXMgaXMgdGhlIGhlbHBlciBmdW5jdGlvbiB0aGF0IHRvZ2dsZXMgaW5mb3dpbmRvd3MgYXMgd2VsbCBhc1xyXG4vL3RoZSBib3VuY2luZyBhbmltYXRpb24uIEl0IGlzIHBhc3NlZCB0byB0aGUgbW9kdWxlIHRoYXQgY3JlYXRlcyBhbmQgbG9hZHMgdGhlXHJcbi8vbWFwIG1hcmtlcnMsIGFuZCB1c2VkIGluIHRoaXMgc2NyaXB0IGFzIHdlbGxcclxuZnVuY3Rpb24gbWFya2VyRXZlbnRIYW5kbGVyKG1hcmtlcil7XHJcbiAgLy9oYW5kbGUgbWFya2VyIG9wZW5pbmlnL2Nsb3Npbmc6XHJcbiAgaWYgKCFtYXJrZXIuX29wZW5lZFN0YXRlICYmIG1hcmtlci5oYXNUaHVtYm5haWwpXHJcbiAgICBtYXJrZXIuaW5mb1dpbmRvdy5vcGVuKG1hcCwgbWFya2VyKTtcclxuICBlbHNlIGlmIChtYXJrZXIuX29wZW5lZFN0YXRlKVxyXG4gICAgbWFya2VyLmNsb3NlKCk7XHJcbiAgLy9oYW5kbGUgbWFya2VyIGFuaW1hdGlvbiB0b2dnbGluZzpcclxuICBpZiAobWFya2VyLmdldEFuaW1hdGlvbigpICE9PSBudWxsKSB7XHJcbiAgICBtYXJrZXIuc2V0QW5pbWF0aW9uKG51bGwpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBtYXJrZXIuc2V0QW5pbWF0aW9uKGdvb2dsZS5tYXBzLkFuaW1hdGlvbi5CT1VOQ0UpO1xyXG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xyXG4gICAgICBtYXJrZXIuc2V0QW5pbWF0aW9uKG51bGwpO1xyXG4gICAgfSwgMjIwMCk7XHJcbiAgfVxyXG4gIC8vY29kZSB0byBsb2FkIGltYWdlc1xyXG4gIGlmICghbWFya2VyLmhhc1RodW1ibmFpbClcclxuICAgIGxvYWRJbWFnZShtYXJrZXIpO1xyXG59XHJcbi8vVGhpcyBmdW5jdGlvbiBsb2FkcyB0aGUgaW1hZ2UgdGh1bWJuYWlscyBmb3IgYSBnaXZlbiBtYXAgbWFya2VyXHJcbmZ1bmN0aW9uIGxvYWRJbWFnZShtYXJrZXIpe1xyXG4gIHZhciB1cmwgPSBgaHR0cHM6Ly9waXhhYmF5LmNvbS9hcGkvP2tleT0yNTc0MjU0LTA2OGRhMjE0ZTJiN2E3NDllMDI4ZDQ4ODQmcT0ke21hcmtlci5zZWFyY2hTdHJ9JmltYWdlX3R5cGU9cGhvdG9gO1xyXG4gICQuZ2V0KHVybCwgKHJlc3AsIHR4dCwgeGhyKSA9PiB7XHJcbiAgICBjb25zb2xlLmxvZyhcIlRoaXMgZmlyZWQuIEluZm93aW5kb3c6IFwiKTtcclxuICAgIGNvbnNvbGUubG9nKG1hcmtlci5pbmZvV2luZG93KTtcclxuICAgIGxldCBpbWdJZHggPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqcmVzcC5oaXRzLmxlbmd0aCk7XHJcbiAgICBuZXdDb250ZW50ID0gbWFya2VyLmluZm9XaW5kb3cuY29udGVudCtgPGJyPjxpbWcgc3JjPVwiJHtyZXNwLmhpdHNbaW1nSWR4XS5wcmV2aWV3VVJMfVwiIGJvcmRlcj1cIjBcIiBhbGlnbj1cImxlZnRcIiB3aWR0aD1cIjEwMHB4XCIgaGVpZ2h0PVwiYXV0b1wiPmA7XHJcbiAgICBtYXJrZXIuaW5mb1dpbmRvdyA9IG5ldyBnb29nbGUubWFwcy5JbmZvV2luZG93KHtjb250ZW50OiBuZXdDb250ZW50fSk7XHJcbiAgICAvL21hcmtlci5pbmZvV2luZG93LmNvbnRlbnQrPWA8YnI+PGltZyBzcmM9XCIke3Jlc3AuaGl0c1tpbWdJZHhdLnByZXZpZXdVUkx9XCIgYm9yZGVyPVwiMFwiIGFsaWduPVwibGVmdFwiIHdpZHRoPVwiMTAwcHhcIiBoZWlnaHQ9XCJhdXRvXCI+YDtcclxuICAgIG1hcmtlci5oYXNUaHVtYm5haWwgPSB0cnVlO1xyXG4gICAgbWFya2VyLmluZm9XaW5kb3cub3BlbihtYXAsIG1hcmtlcik7XHJcbiAgfSk7XHJcbn1cclxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihtYXAsIGdvb2dsZSwgbWFya2VyRXZlbnQpe1xyXG4gIGdvb2dsZS5tYXBzLkluZm9XaW5kb3cucHJvdG90eXBlLl9vcGVuID0gZ29vZ2xlLm1hcHMuSW5mb1dpbmRvdy5wcm90b3R5cGUub3BlbjtcclxuICBnb29nbGUubWFwcy5JbmZvV2luZG93LnByb3RvdHlwZS5fY2xvc2UgPSBnb29nbGUubWFwcy5JbmZvV2luZG93LnByb3RvdHlwZS5jbG9zZTtcclxuICBnb29nbGUubWFwcy5JbmZvV2luZG93LnByb3RvdHlwZS5fb3BlbmVkU3RhdGUgPSBmYWxzZTtcclxuXHJcbiAgZ29vZ2xlLm1hcHMuSW5mb1dpbmRvdy5wcm90b3R5cGUub3BlbiA9IGZ1bmN0aW9uIChtYXAsIGFuY2hvcikge1xyXG4gICAgICB0aGlzLl9vcGVuZWRTdGF0ZSA9IHRydWU7XHJcbiAgICAgIHRoaXMuX29wZW4obWFwLCBhbmNob3IpO1xyXG4gIH07XHJcblxyXG4gIGdvb2dsZS5tYXBzLkluZm9XaW5kb3cucHJvdG90eXBlLmNsb3NlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICB0aGlzLl9vcGVuZWRTdGF0ZSA9IGZhbHNlO1xyXG4gICAgICB0aGlzLl9jbG9zZSgpO1xyXG4gIH07XHJcblxyXG4gIC8vbGFiZWxzIGZvciBtYXAgbWFya2VyczpcclxuICB2YXIgaW5mb1dpbmRvd1N0cmluZ3MgPSBbXHJcbiAgICBcIklCTSByZXNlYXJjaCBjZW50ZXJcIixcclxuICAgIFwiQmlnIEJvc3MgQmFyYmVsbCBDbHViXCIsXHJcbiAgICBcIk5ldmVybGFuZCBUZWxlcG9ydGF0aW9uIExvYmJ5XCIsXHJcbiAgICBcIlVuaWNvcm5zIGFuZCBQaWNrdXAgVHJ1Y2tzXCIsXHJcbiAgICBcIk1hY2hpbmUgR3VuIFN0b3JlXCJcclxuICBdO1xyXG5cclxuICAvL3VzZSBsYWJlbHMgdG8gbWFrZSBhbiBhcnJheSBvZiBpbmZvV2luZG93IG9iamVjdHNcclxuICB2YXIgaW5mb1dpbmRvd3MgPSBpbmZvV2luZG93U3RyaW5ncy5tYXAoZnVuY3Rpb24oZSl7XHJcbiAgICByZXR1cm4gbmV3IGdvb2dsZS5tYXBzLkluZm9XaW5kb3coe2NvbnRlbnQ6IGV9KTtcclxuICB9KTtcclxuXHJcbiAgLy9jcmVhdGUgcG9zaXRpb25zIGZvciBtYXAgbWFya2Vyc1xyXG4gIHZhciBtYXJrZXJEYXRhID0gW1xyXG4gICAge3Bvc2l0aW9uOiBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKDMwLjM5NzYyMSwgLTk3LjcxOTYwNCksIHNlYXJjaFN0cjogXCJJQk1cIn0sXHJcbiAgICB7cG9zaXRpb246IG5ldyBnb29nbGUubWFwcy5MYXRMbmcoMzAuNzk3NjIxLCAtOTcuNjE5NjA0KSwgc2VhcmNoU3RyOiBcIkJhcmJlbGxcIn0sXHJcbiAgICB7cG9zaXRpb246IG5ldyBnb29nbGUubWFwcy5MYXRMbmcoMzAuMTk3NjIxLCAtOTcuODE5NjA0KSwgc2VhcmNoU3RyOiBcInBldGVyK3BhblwifSxcclxuICAgIHtwb3NpdGlvbjogbmV3IGdvb2dsZS5tYXBzLkxhdExuZygyOS44OTc2MjEsIC05Ny40MTk2MDQpLCBzZWFyY2hTdHI6IFwidW5pY29yblwifSxcclxuICAgIHtwb3NpdGlvbjogbmV3IGdvb2dsZS5tYXBzLkxhdExuZygyOS41OTc2MjEsIC05Ny45MTk2MDQpLCBzZWFyY2hTdHI6IFwibWFjaGluZStndW5cIn1cclxuICBdO1xyXG5cclxuICBtYXJrZXJEYXRhLmZvckVhY2goZnVuY3Rpb24oZSwgaSl7XHJcbiAgICAvL2ZpbGwgaW4gdGhlIHJlc3Qgb2YgdGhlIGRhdGEgcmVxdWlyZWQgdG8gaW5zdGFudGlhdGUgbWFwIG1hcmtlcnNcclxuICAgIGUubWFwID0gbWFwO1xyXG4gICAgZS50aXRsZSA9IGluZm9XaW5kb3dTdHJpbmdzW2ldO1xyXG4gIH0pO1xyXG5cclxuICAvL2luc3RhbnRpYXRlIG1hcCBtYXJrZXJzXHJcbiAgdmFyIG1hcmtlcnMgPSBtYXJrZXJEYXRhLm1hcChmdW5jdGlvbihlLCBpKXtcclxuICAgIHZhciByZXQgPSBuZXcgZ29vZ2xlLm1hcHMuTWFya2VyKGUpO1xyXG4gICAgcmV0LnNldEFuaW1hdGlvbihnb29nbGUubWFwcy5BbmltYXRpb24uQk9VTkNFKTtcclxuICAgIHJldC5zZXRBbmltYXRpb24obnVsbCk7XHJcbiAgICByZXQuaW5mb1dpbmRvdyA9IGluZm9XaW5kb3dzW2ldO1xyXG5cclxuICAgIC8vdmFyaWFibGUgdG8gc2hvdyB3aGV0aGVyIGEgZ2l2ZW4gbWFya2VyIGhhc1xyXG4gICAgLy9hbHJlYWR5IGxvYWRlZCBpdHMgdGh1bWJuYWlsIGZyb20gcGl4YWJheSBvciBub3RcclxuICAgIHJldC5oYXNUaHVtYm5haWwgPSBmYWxzZTtcclxuXHJcbiAgICAvL2FkZCBldmVudCBsaXN0ZW5lciB0byBlYWNoIE1hcmtlciBvYmplY3RcclxuICAgIGdvb2dsZS5tYXBzLmV2ZW50LmFkZExpc3RlbmVyKHJldCwgJ2NsaWNrJywgZnVuY3Rpb24oKXtcclxuICAgICAgbWFya2VyRXZlbnQocmV0KTtcclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiByZXQ7XHJcbiAgfSk7XHJcblxyXG4gIHJldHVybiBtYXJrZXJzO1xyXG59O1xyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChtYXJrZXJFdmVudEhhbmRsZXIsIGZha2VEYXRhYmFzZSl7XHJcblxyXG4gIHJldHVybiBmdW5jdGlvbigpe1xyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgc2VsZi5tYXJrZXJzID0ga28ub2JzZXJ2YWJsZUFycmF5KGdldE1hcmtlcnMoXCJcIikpO1xyXG4gICAgc2VsZi5xdWVyeSA9IGtvLm9ic2VydmFibGUoJycpO1xyXG5cclxuICAgIHNlbGYudXBkYXRlID0gZnVuY3Rpb24odHlwZWRUZXh0KXtcclxuICAgICAgc2VsZi5tYXJrZXJzKFtdKTtcclxuICAgICAgdmFyIG1hcmtlcnMgPSBnZXRNYXJrZXJzKHR5cGVkVGV4dCk7XHJcbiAgICAgIGZvciAodmFyIHggaW4gbWFya2Vycyl7XHJcbiAgICAgICAgc2VsZi5tYXJrZXJzLnB1c2gobWFya2Vyc1t4XSk7XHJcblxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy9mdW5jdGlvbiB0byBtYWtlIG1hcCBtYXJrZXJzIGJvdW5jZVxyXG4gICAgc2VsZi50b2dnbGVCb3VuY2UgPSBtYXJrZXJFdmVudEhhbmRsZXI7XHJcblxyXG4gICAgLy9kZWJ1ZyBmdW5jdGlvbiB0byBwcmludCBtYXAgbWFya2Vyc1xyXG4gICAgc2VsZi5wcmludE1hcmtlcnMgPSBmdW5jdGlvbigpeyBmb3IodmFyIHggaW4gc2VsZi5tYXJrZXJzKWNvbnNvbGUubG9nKHNlbGYubWFya2Vyc1t4XSk7fVxyXG5cclxuXHJcbiAgICBmdW5jdGlvbiBnZXRNYXJrZXJzKHN0cil7XHJcbiAgICAgIC8vdGhpcyBmdW5jdGlvbiBjb3VsZCBldmVudHVhbGx5IGdldCByZXBsYWNlZCB3aXRoIGFuIGludGVyYWN0aW9uXHJcbiAgICAgIC8vd2l0aCBhIGJhY2sgZW5kXHJcbiAgICAgIHZhciByZXQgPSBbXTtcclxuICAgICAgZm9yICh2YXIgeCBpbiBmYWtlRGF0YWJhc2Upe1xyXG4gICAgICAgIGlmIChmYWtlRGF0YWJhc2VbeF0udGl0bGUudG9Mb3dlckNhc2UoKS5pbmRleE9mKHN0ci50b0xvd2VyQ2FzZSgpKSA+PSAwXHJcbiAgICAgICAgICAgfHwgc3RyLmxlbmd0aCA9PT0gMCl7XHJcbiAgICAgICAgICByZXQucHVzaChmYWtlRGF0YWJhc2VbeF0pO1xyXG4gICAgICAgICAgZmFrZURhdGFiYXNlW3hdLnNldFZpc2libGUodHJ1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgIGZha2VEYXRhYmFzZVt4XS5zZXRWaXNpYmxlKGZhbHNlKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gcmV0O1xyXG4gICAgfVxyXG4gIH07XHJcbn07XHJcbiJdfQ==
