//global vars
var fakeDatabase, map, viewModel;

initialize = function() {
  var mapOptions = {
    center: { lat: 30.25, lng: -97.7500},
    zoom: 8
  };
  map = new google.maps.Map(document.getElementById('map-canvas'),
      mapOptions);

  fakeDatabase = require("./markers.js")(map, google);
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

