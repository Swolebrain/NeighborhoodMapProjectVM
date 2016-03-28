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
    var ret = new google.maps.Marker(e);  
    ret.setAnimation(google.maps.Animation.BOUNCE);
    ret.setAnimation(null);
    return ret;
  });
  
  markers.forEach(function(e,i){
    //add event listener to each Marker object
    google.maps.event.addListener(e, 'click', () => infoWindows[i].open(map, e));
  });
  return markers;
};