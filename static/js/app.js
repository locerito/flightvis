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



function flightsim(date, time) {
  $.getJSON( "/api/flight/"+date+'/'+time, {
  tags: "mount rainier",
  tagmode: "any",
  format: "json"
 }).done(function( data ) {

    svg.selectAll("*").remove()

    var flights = data;

    function obj(ll) { return { y: ll[0], x: ll[1] } }

    flights.forEach(function(element, index, array){
      const ori = element.coord_ori.split(',').map(parseFloat);
      const dest = element.coord_dest.split(',').map(parseFloat);

      var generator = new arc.GreatCircle(obj(ori),
                                          obj(dest));
      var line = generator.Arc(100, { offset: 10 });
      var newLine = L.polyline(line.geometries[0].coords.map(function(c) {
                                    return c.reverse()
                                }), {
                                    color: '#a643af',
                                    weight: 1.5,
                                    opacity: 0.5
                                })
                                  .addTo(map)
      var totalLength = newLine._path.getTotalLength()
      newLine._path.classList.add('path-start')
      newLine._path.style.strokeDashoffset = totalLength
      newLine._path.style.strokeDasharray = totalLength
      setTimeout((function(path) {
        return function() {
            path.style.strokeDashoffset = 0
        };
      })(newLine._path), index * 10)
    })
  })
}

const show = document.getElementById("show")
document.getElementById("flightstime").value = "2008-01-01T00:00";

show.onclick = function() {
  var flightstime = document.getElementById("flightstime").value.split('T')  
  flightsim(flightstime[0].split('-').join(''), flightstime[1].split(':').join('')+'00')
}