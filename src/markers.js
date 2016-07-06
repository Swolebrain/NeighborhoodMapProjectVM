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
