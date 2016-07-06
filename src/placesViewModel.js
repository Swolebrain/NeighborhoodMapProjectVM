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
