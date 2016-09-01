const mapid = 'map'


const map = L.map(mapid).setView([37.8, -96], 4)
L.tileLayer('http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpandmbXliNDBjZWd2M2x6bDk3c2ZtOTkifQ._QA7i5Mpkd_m30IGElHziw', {
      maxZoom: 18,
      attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
        '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery © <a href="http://mapbox.com">Mapbox</a>',
      id: 'mapbox.streets'
    }).addTo(map);

map._initPathRoot()
const svg = d3.select("#map").select("svg"),
      g = svg.append("g").attr("class", "leaflet-zoom-hide");


function projectPoint(x, y) {
  var point = map.latLngToLayerPoint(new L.LatLng(y, x));
  this.stream.point(point.x, point.y);
}

const transform = d3.geoTransform({point: projectPoint});

const path = d3.geoPath()
             .projection(transform);

function showAirports() {
  $.getJSON( "/api/airport", {
  tags: "mount rainier",
  tagmode: "any",
  format: "json"
 }).done(function( data ) {

    const airports = data
    let airportsGeo = {"type": "FeatureCollection",
                       "features": []}

    airports.forEach(function(element, index, array){

       const coor = [element.lat, element.long]

       airportsGeo.features.push({
         type: "Feature",
         geometry: {
           coordinates: coor,
           type: "Points"
         }
       })

     })

     airportsGeo.features.forEach(function(d) {
                      d.LatLng = new L.LatLng(d.geometry.coordinates[0],
                                  d.geometry.coordinates[1])
                    })

     const feature = g.selectAll("circle")
                       .data(airportsGeo.features)
                       .enter().append("circle")
                      .style("stroke", "black")
                      .style("opacity", .6)
                      .style("fill", "red")
                      .attr("r", 2);

     map.on("viewreset", update);
     update();

     function update() {
      feature.attr("transform",
      function(d) {
        return "translate("+
          map.latLngToLayerPoint(d.LatLng).x +","+
          map.latLngToLayerPoint(d.LatLng).y +")";
        }
      )
     }
})
}

function hideAirports() {
  d3.select("g").selectAll("*").remove();
}



function flightsim(date, time){
  $.getJSON( "/api/flight/"+date+'/'+time, {
  tags: "mount rainier",
  tagmode: "any",
  format: "json"
 }).done(function( data ) {

  let flightsGeo = {"type": "FeatureCollection",
                       "features": []}

    data.forEach(function(element, index, array){

       const coor = [element.coord_ori.split(',').map(parseFloat)]

       flightsGeo.features.push({
         type: "Feature",
         geometry: {
           coordinates: coor,
           type: "Points"
         }
       })

    })

  flightsGeo.features.forEach(function(d) {
      d.LatLng = new L.LatLng(d.geometry.coordinates[0][0],
                  d.geometry.coordinates[0][1])
    })

    var feature = g.selectAll(".departures")
                       .data(flightsGeo.features)
    feature.exit().remove()
    feature.enter().append("circle")
                      .style("stroke", "black")
                      .style("opacity", .6)
                      .style("fill", "blue")
                      .attr("r", 2)
                      .attr("class", "departures")
                      .attr("transform",
      function(d) {
        return "translate("+
          map.latLngToLayerPoint(d.LatLng).x +","+
          map.latLngToLayerPoint(d.LatLng).y +")";
        }
      )
      .transition().duration(1000)
        .attr("r", 15)
        .attr("stroke-width", 0)
            .style("opacity", 0)

    map.on("viewreset", update);
    update();

    function update() {
      feature.attr("transform",
      function(d) {
        return "translate("+
          map.latLngToLayerPoint(d.LatLng).x +","+
          map.latLngToLayerPoint(d.LatLng).y +")";
        }
      )
     }
 })
}

// Get start/end times
const startTime = new Date(2008, 0, 1)
const endTime = new Date(2008, 0, 31)

// Create a DataSet with data
const timelineData = new vis.DataSet([{ start: startTime, end: endTime, content: 'Flights Tracks' }])

// Set timeline options
const timelineOptions = {
  timeAxis: {scale: 'day'},
  "width":  "100%",
  "type": "box",
  "orientation": "top",
  "showCurrentTime":true,
  "clickToUse":true
}

// Setup timeline
timeline = new vis.Timeline(document.getElementById('timeline'), timelineData, timelineOptions)
timeline.addCustomTime(startTime, 'customTime');


function Playback(st, et, callback) {
  var interval = 2000;
  var period = 1;
  var startTime = st;
  var endTime = et;
  var timer_id;

  this.play = function() {

    timer_id = setInterval( function() {
      var datestring = startTime.getFullYear() + ("0"+(startTime.getMonth()+1)).slice(-2) + ("0" + startTime.getDate()).slice(-2)
      var hourstring = ("0" + startTime.getHours()).slice(-2) + ("0" + startTime.getMinutes()).slice(-2) + '00';
      flightsim(datestring, hourstring);
      startTime = addMinutes(startTime, period)
      timeline.setCustomTime(startTime, 'customTime');
      if(typeof(callback) === 'function') callback(startTime, endTime);
    }, interval);
    
  }

  this.stop = function() {
    clearInterval(timer_id);
  }

  function addMinutes(date, minutes) {
    return new Date(date.getTime() + minutes*60000);
  }

}

var playback;

cb = function(startTime, endTime) {
    if(startTime >= endTime)
    {
        timer.stop();
    }
}

playback = new Playback(startTime, endTime, cb)

const play = document.getElementById("play")
const show = document.getElementById("show")

play.onclick = function() {
  if (play.className == "play") {
    playback.play()
    play.className = "stop"
    play.value = "Stop"
  } else {
    playback.stop()
    play.className = "play"
    play.value = "Play"
  }
}

show.onclick = function() {
  if (show.className == "show") {
    showAirports()
    show.className = "hide"
    show.value = "Hide Airports"
  } else {
    hideAirports()
    show.className = "show"
    show.value = "Show Airports"
  }
}



