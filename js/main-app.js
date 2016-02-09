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