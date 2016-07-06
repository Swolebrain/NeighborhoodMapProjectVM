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

},{"./markers.js":2,"./placesViewModel.js":3}],2:[function(require,module,exports){
"use strict";
module.exports = function(map, google){

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
    ret.clickHandler = function(){
      markerEventHandler(ret);
    };
    google.maps.event.addListener(ret, 'click', ret.clickHandler);

    return ret;
  });

  return markers;


  //This is the helper function that toggles infowindows as well as
  //the bouncing animation. It is passed to the module that creates and loads the
  //map markers, and used in this script as well
  function markerEventHandler(marker){
    //close all open markers, cancel animations:
    markers.map((e)=> { e.infoWindow.close(); e.setAnimation(null);});
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
};

},{}],3:[function(require,module,exports){
"use strict";
module.exports = function (fakeDatabase){

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

    //function to open infowindow and make mapmarker bounce:
    self.clickEvent = function(marker){
      marker.clickHandler();
    };

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvbWFpbi1hcHAuanMiLCJzcmMvbWFya2Vycy5qcyIsInNyYy9wbGFjZXNWaWV3TW9kZWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcInVzZSBzdHJpY3RcIjtcbi8qXHJcbiAgVGhlIE5laWdoYm9yaG9vZCBNYXAgUHJvamVjdCwgYnkgVmljdG9yIE1vcmVuby5cclxuICBUaGlzIGFwcCBpbGx1c3RyYXRlcyB0aGUgdXNlIG9mIGtub2Nrb3V0LmpzIGFuZCB0d28gQVBJcy4gVGhpcyBmaWxlIGlzIHRoZSBlbnRyeSBwb2ludC5cclxuXHJcbiAgSW4gcGFydGljdWxhciwgdGhlIGFzeW5jIGxvYWRpbmcgb2YgdGhlIGdvb2dsZSBtYXBzIHNjcmlwdCB2aWEgalF1ZXJ5IGlzIHdoYXQga2lja3MgZXZlcnl0aGluZyBvZmYuXHJcbiAgSWYgdGhpcyBhc3luYyBsb2FkaW5nIGZhaWxzLCB0aGVyZSdzIGFuIGFsZXJ0IGxldHRpbmcgdGhlIHVzZXIga25vdyB0byByZWxvYWQgdGhlIHBhZ2UuIGlmIGl0IHN1Y2NlZWRzLFxyXG4gIHRoZW4gdGhlIGluaXRpYWxpemUoKSBmdW5jdGlvbiBpcyBjYWxsZWQuXHJcbiovXHJcblxyXG4vL2dsb2JhbCB2YXJzOlxyXG4vL1RoZXNlIGFyZW4ndCByZWFsbHkgZ2xvYmFsIHNpbmNlIGJyb3dzZXJpZnkgcHJvdmlkZXMgYSBjbG9zdXJlXHJcbnZhciBmYWtlRGF0YWJhc2UsIG1hcCwgdmlld01vZGVsLCBpbmZvV2luZG93LFxyXG4gICAgdXJsID0gJ2h0dHBzOi8vbWFwcy5nb29nbGVhcGlzLmNvbS9tYXBzL2FwaS9qcz9rZXk9QUl6YVN5REI4YVhJeHY3cF9haVNoejdZSThaWkgwZW9fZlEyMU5zJzsgLy8mY2FsbGJhY2s9aW5pdGlhbGl6ZVwiO1xyXG5cclxuXHJcbi8vVGhpcyBpcyB0aGUgYXN5bmMgZW50cnkgcG9pbnQgb2YgdGhlIHdob2xlIGFwcGxpY2F0aW9uXHJcbiQuZ2V0U2NyaXB0KHVybCkuZG9uZShpbml0aWFsaXplKS5mYWlsKGVycm9yQ2FsbGJhY2spO1xyXG5cclxuZnVuY3Rpb24gZXJyb3JDYWxsYmFjaygpe1xyXG4gIGFsZXJ0KCdGYWlsZWQgdG8gY29udGFjdCBHb29nbGUgbWFwcyBBUEkuIFBsZWFzZSB0cnkgcmVmcmVzaGluZyB0aGUgcGFnZScpO1xyXG59XHJcblxyXG5cclxuZnVuY3Rpb24gaW5pdGlhbGl6ZSgpIHtcclxuICB2YXIgbWFwT3B0aW9ucyA9IHtcclxuICAgIGNlbnRlcjogeyBsYXQ6IDMwLjI1LCBsbmc6IC05Ny43NTAwfSxcclxuICAgIHpvb206IDhcclxuICB9O1xyXG4gIG1hcCA9IG5ldyBnb29nbGUubWFwcy5NYXAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21hcC1jYW52YXMnKSxcclxuICAgICAgbWFwT3B0aW9ucyk7XHJcblxyXG4gIGZha2VEYXRhYmFzZSA9IHJlcXVpcmUoJy4vbWFya2Vycy5qcycpKG1hcCwgZ29vZ2xlKTtcclxuICB2YXIgUGxhY2VzVmlld01vZGVsID0gcmVxdWlyZSgnLi9wbGFjZXNWaWV3TW9kZWwuanMnKShmYWtlRGF0YWJhc2UpO1xyXG4gIHZpZXdNb2RlbCA9IG5ldyBQbGFjZXNWaWV3TW9kZWwoKTtcclxuICBrby5hcHBseUJpbmRpbmdzKHZpZXdNb2RlbCk7XHJcbiAgdmlld01vZGVsLnF1ZXJ5LnN1YnNjcmliZSh2aWV3TW9kZWwudXBkYXRlKTtcclxufVxyXG4iLCJcInVzZSBzdHJpY3RcIjtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24obWFwLCBnb29nbGUpe1xyXG5cclxuICAvL2xhYmVscyBmb3IgbWFwIG1hcmtlcnM6XHJcbiAgdmFyIGluZm9XaW5kb3dTdHJpbmdzID0gW1xyXG4gICAgXCJJQk0gcmVzZWFyY2ggY2VudGVyXCIsXHJcbiAgICBcIkJpZyBCb3NzIEJhcmJlbGwgQ2x1YlwiLFxyXG4gICAgXCJOZXZlcmxhbmQgVGVsZXBvcnRhdGlvbiBMb2JieVwiLFxyXG4gICAgXCJVbmljb3JucyBhbmQgUGlja3VwIFRydWNrc1wiLFxyXG4gICAgXCJNYWNoaW5lIEd1biBTdG9yZVwiXHJcbiAgXTtcclxuXHJcbiAgLy9jcmVhdGUgcG9zaXRpb25zIGZvciBtYXAgbWFya2Vyc1xyXG4gIHZhciBtYXJrZXJEYXRhID0gW1xyXG4gICAge3Bvc2l0aW9uOiBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKDMwLjM5NzYyMSwgLTk3LjcxOTYwNCksIHNlYXJjaFN0cjogXCJJQk1cIn0sXHJcbiAgICB7cG9zaXRpb246IG5ldyBnb29nbGUubWFwcy5MYXRMbmcoMzAuNzk3NjIxLCAtOTcuNjE5NjA0KSwgc2VhcmNoU3RyOiBcIkJhcmJlbGxcIn0sXHJcbiAgICB7cG9zaXRpb246IG5ldyBnb29nbGUubWFwcy5MYXRMbmcoMzAuMTk3NjIxLCAtOTcuODE5NjA0KSwgc2VhcmNoU3RyOiBcInBldGVyK3BhblwifSxcclxuICAgIHtwb3NpdGlvbjogbmV3IGdvb2dsZS5tYXBzLkxhdExuZygyOS44OTc2MjEsIC05Ny40MTk2MDQpLCBzZWFyY2hTdHI6IFwidW5pY29yblwifSxcclxuICAgIHtwb3NpdGlvbjogbmV3IGdvb2dsZS5tYXBzLkxhdExuZygyOS41OTc2MjEsIC05Ny45MTk2MDQpLCBzZWFyY2hTdHI6IFwibWFjaGluZStndW5cIn1cclxuICBdO1xyXG5cclxuICBtYXJrZXJEYXRhLmZvckVhY2goZnVuY3Rpb24oZSwgaSl7XHJcbiAgICAvL2ZpbGwgaW4gdGhlIHJlc3Qgb2YgdGhlIGRhdGEgcmVxdWlyZWQgdG8gaW5zdGFudGlhdGUgbWFwIG1hcmtlcnNcclxuICAgIGUubWFwID0gbWFwO1xyXG4gICAgZS50aXRsZSA9IGluZm9XaW5kb3dTdHJpbmdzW2ldO1xyXG4gIH0pO1xyXG5cclxuICAvL2luc3RhbnRpYXRlIG1hcCBtYXJrZXJzXHJcbiAgdmFyIG1hcmtlcnMgPSBtYXJrZXJEYXRhLm1hcChmdW5jdGlvbihlLCBpKXtcclxuICAgIHZhciByZXQgPSBuZXcgZ29vZ2xlLm1hcHMuTWFya2VyKGUpO1xyXG4gICAgcmV0LnNldEFuaW1hdGlvbihnb29nbGUubWFwcy5BbmltYXRpb24uQk9VTkNFKTtcclxuICAgIHJldC5zZXRBbmltYXRpb24obnVsbCk7XHJcbiAgICByZXQuaW5mb1dpbmRvdyA9IG5ldyBnb29nbGUubWFwcy5JbmZvV2luZG93KHtjb250ZW50OiBpbmZvV2luZG93U3RyaW5nc1tpXX0pO1xyXG5cclxuICAgIC8vdmFyaWFibGUgdG8gc2hvdyB3aGV0aGVyIGEgZ2l2ZW4gbWFya2VyIGhhc1xyXG4gICAgLy9hbHJlYWR5IGxvYWRlZCBpdHMgdGh1bWJuYWlsIGZyb20gcGl4YWJheSBvciBub3RcclxuICAgIHJldC5oYXNUaHVtYm5haWwgPSBmYWxzZTtcclxuXHJcbiAgICAvL2FkZCBldmVudCBsaXN0ZW5lciB0byBlYWNoIE1hcmtlciBvYmplY3RcclxuICAgIHJldC5jbGlja0hhbmRsZXIgPSBmdW5jdGlvbigpe1xyXG4gICAgICBtYXJrZXJFdmVudEhhbmRsZXIocmV0KTtcclxuICAgIH07XHJcbiAgICBnb29nbGUubWFwcy5ldmVudC5hZGRMaXN0ZW5lcihyZXQsICdjbGljaycsIHJldC5jbGlja0hhbmRsZXIpO1xyXG5cclxuICAgIHJldHVybiByZXQ7XHJcbiAgfSk7XHJcblxyXG4gIHJldHVybiBtYXJrZXJzO1xyXG5cclxuXHJcbiAgLy9UaGlzIGlzIHRoZSBoZWxwZXIgZnVuY3Rpb24gdGhhdCB0b2dnbGVzIGluZm93aW5kb3dzIGFzIHdlbGwgYXNcclxuICAvL3RoZSBib3VuY2luZyBhbmltYXRpb24uIEl0IGlzIHBhc3NlZCB0byB0aGUgbW9kdWxlIHRoYXQgY3JlYXRlcyBhbmQgbG9hZHMgdGhlXHJcbiAgLy9tYXAgbWFya2VycywgYW5kIHVzZWQgaW4gdGhpcyBzY3JpcHQgYXMgd2VsbFxyXG4gIGZ1bmN0aW9uIG1hcmtlckV2ZW50SGFuZGxlcihtYXJrZXIpe1xyXG4gICAgLy9jbG9zZSBhbGwgb3BlbiBtYXJrZXJzLCBjYW5jZWwgYW5pbWF0aW9uczpcclxuICAgIG1hcmtlcnMubWFwKChlKT0+IHsgZS5pbmZvV2luZG93LmNsb3NlKCk7IGUuc2V0QW5pbWF0aW9uKG51bGwpO30pO1xyXG4gICAgLy9oYW5kbGUgbWFya2VyIG9wZW5pbmlnOlxyXG4gICAgbWFya2VyLmluZm9XaW5kb3cub3BlbihtYXAsIG1hcmtlcik7XHJcbiAgICAvL3BhbiB0byB0aGUgbWFya2VyIGFuZCB6b29tIGluOlxyXG4gICAgbWFwLnNldFpvb20oMTApO1xyXG4gICAgbWFwLnBhblRvKG1hcmtlci5nZXRQb3NpdGlvbigpKTtcclxuXHJcbiAgICAvL3NldCB0aGUgYW5pbWF0aW9uIGFuZCBtYWtlIHN1cmUgaXQgc3RvcHMgaW4gYSBsaXR0bGUgYml0XHJcbiAgICBtYXJrZXIuc2V0QW5pbWF0aW9uKGdvb2dsZS5tYXBzLkFuaW1hdGlvbi5CT1VOQ0UpO1xyXG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xyXG4gICAgICBtYXJrZXIuc2V0QW5pbWF0aW9uKG51bGwpO1xyXG4gICAgfSwgMjEwMCk7XHJcblxyXG4gICAgLy9sb2FkIHRoZSBpbWFnZSBpZiBpdCBoYXNudCBiZWVuIGxvYWRlZCBhbHJlYWR5XHJcbiAgICBpZiAoIW1hcmtlci5oYXNUaHVtYm5haWwpXHJcbiAgICAgIGxvYWRJbWFnZShtYXJrZXIpO1xyXG4gIH1cclxuICAvL1RoaXMgZnVuY3Rpb24gbG9hZHMgdGhlIGltYWdlIHRodW1ibmFpbHMgZm9yIGEgZ2l2ZW4gbWFwIG1hcmtlclxyXG4gIGZ1bmN0aW9uIGxvYWRJbWFnZShtYXJrZXIpe1xyXG4gICAgLy9UaGUgZm9sbG93aW5nIGlzIGFuIEVTNiB0ZW1wbGF0ZSBzdHJpbmcsIGl0IGlzIG5vdCB0aGUgd3JvbmcgcXVvdGUgY2hhcmFjdGVyLiBUZW1wbGF0ZSBzdHJpbmdzIGFyZSBtb3JlIGxlZ2libGVcclxuICAgIHZhciB1cmwgPSBgaHR0cHM6Ly9waXhhYmF5LmNvbS9hcGkvP2tleT0yNTc0MjU0LTA2OGRhMjE0ZTJiN2E3NDllMDI4ZDQ4ODQmcT0ke21hcmtlci5zZWFyY2hTdHJ9JmltYWdlX3R5cGU9cGhvdG9gO1xyXG4gICAgJC5nZXQodXJsLCAocmVzcCwgdHh0LCB4aHIpID0+IHtcclxuICAgICAgdmFyIGltZ0lkeCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSpyZXNwLmhpdHMubGVuZ3RoKTtcclxuICAgICAgLy9hbm90aGVyIGVzNiB0ZW1wbGF0ZSBzdHJpbmc6XHJcbiAgICAgIHZhciBuZXdDb250ZW50ID0gbWFya2VyLmluZm9XaW5kb3cuY29udGVudCtgPGJyPjxpbWcgc3JjPVwiJHtyZXNwLmhpdHNbaW1nSWR4XS5wcmV2aWV3VVJMfVwiIGJvcmRlcj1cIjBcIiBhbGlnbj1cImxlZnRcIiB3aWR0aD1cIjEwMHB4XCIgaGVpZ2h0PVwiYXV0b1wiPmA7XHJcbiAgICAgIG1hcmtlci5pbmZvV2luZG93LnNldENvbnRlbnQobmV3Q29udGVudCk7XHJcbiAgICAgIG1hcmtlci5oYXNUaHVtYm5haWwgPSB0cnVlO1xyXG4gICAgfSkuZmFpbChmdW5jdGlvbihlcnIpeyAvL2Vycm9yIGhhbmRsaW5nIGZvciBwaXhhYmF5IGFqYXggY2FsbFxyXG4gICAgICBhbGVydChcIkZhaWxlZCBsb2FkaW5nIGltYWdlIGZyb20gcGl4YWJheSEgUGxlYXNlIGNvbnRhY3QgdGhlIHNpdGUgYWRtaW4uXCIpXHJcbiAgICB9KTtcclxuICB9XHJcbn07XHJcbiIsIlwidXNlIHN0cmljdFwiO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoZmFrZURhdGFiYXNlKXtcclxuXHJcbiAgcmV0dXJuIGZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICBzZWxmLm1hcmtlcnMgPSBrby5vYnNlcnZhYmxlQXJyYXkoZ2V0TWFya2VycygnJykpO1xyXG4gICAgc2VsZi5xdWVyeSA9IGtvLm9ic2VydmFibGUoJycpO1xyXG5cclxuICAgIHNlbGYudXBkYXRlID0gZnVuY3Rpb24odHlwZWRUZXh0KXtcclxuICAgICAgc2VsZi5tYXJrZXJzKFtdKTtcclxuICAgICAgdmFyIG1hcmtlcnMgPSBnZXRNYXJrZXJzKHR5cGVkVGV4dCk7XHJcbiAgICAgIGZvciAodmFyIHggaW4gbWFya2Vycyl7XHJcbiAgICAgICAgc2VsZi5tYXJrZXJzLnB1c2gobWFya2Vyc1t4XSk7XHJcblxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy9mdW5jdGlvbiB0byBvcGVuIGluZm93aW5kb3cgYW5kIG1ha2UgbWFwbWFya2VyIGJvdW5jZTpcclxuICAgIHNlbGYuY2xpY2tFdmVudCA9IGZ1bmN0aW9uKG1hcmtlcil7XHJcbiAgICAgIG1hcmtlci5jbGlja0hhbmRsZXIoKTtcclxuICAgIH07XHJcblxyXG4gICAgLy9kZWJ1ZyBmdW5jdGlvbiB0byBwcmludCBtYXAgbWFya2Vyc1xyXG4gICAgc2VsZi5wcmludE1hcmtlcnMgPSBmdW5jdGlvbigpeyBmb3IodmFyIHggaW4gc2VsZi5tYXJrZXJzKWNvbnNvbGUubG9nKHNlbGYubWFya2Vyc1t4XSk7fVxyXG5cclxuXHJcbiAgICBmdW5jdGlvbiBnZXRNYXJrZXJzKHN0cil7XHJcbiAgICAgIC8vdGhpcyBmdW5jdGlvbiBjb3VsZCBldmVudHVhbGx5IGdldCByZXBsYWNlZCB3aXRoIGFuIGludGVyYWN0aW9uXHJcbiAgICAgIC8vd2l0aCBhIGJhY2sgZW5kXHJcbiAgICAgIHZhciByZXQgPSBbXTtcclxuICAgICAgZm9yICh2YXIgeCBpbiBmYWtlRGF0YWJhc2Upe1xyXG4gICAgICAgIGZha2VEYXRhYmFzZVt4XS5pbmZvV2luZG93LmNsb3NlKCk7XHJcbiAgICAgICAgZmFrZURhdGFiYXNlW3hdLnNldEFuaW1hdGlvbihudWxsKTtcclxuICAgICAgICBpZiAoZmFrZURhdGFiYXNlW3hdLnRpdGxlLnRvTG93ZXJDYXNlKCkuaW5kZXhPZihzdHIudG9Mb3dlckNhc2UoKSkgPj0gMFxyXG4gICAgICAgICAgIHx8IHN0ci5sZW5ndGggPT09IDApe1xyXG4gICAgICAgICAgcmV0LnB1c2goZmFrZURhdGFiYXNlW3hdKTtcclxuICAgICAgICAgIGZha2VEYXRhYmFzZVt4XS5zZXRWaXNpYmxlKHRydWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICBmYWtlRGF0YWJhc2VbeF0uc2V0VmlzaWJsZShmYWxzZSk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHJldDtcclxuICAgIH1cclxuICB9O1xyXG59O1xyXG4iXX0=
