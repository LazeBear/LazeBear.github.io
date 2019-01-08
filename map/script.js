var mapboxAccessToken =
  'pk.eyJ1IjoidmVlcmNnIiwiYSI6ImNpcmc3Z2dwYTAwMXVnZW5uNTlqMHR0a2oifQ.AnCcyx8qIcyABdTfpXzisg';
var geojson;
var info = L.control();
var map = L.map('mapid').setView([-24.34, 139.41], 4);
map.getRenderer(map).options.padding = 100;
var disputeLayer;

info.onAdd = function(map) {
  this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
  this.update();
  return this._div;
};

// method that we will use to update the control based on feature properties passed
info.update = function(props) {
  this._div.innerHTML =
    '<h4>World Map</h4>' +
    (props
      ? '<b>' + props.name + '</b><br />' + props.density + ' / ' + props.iso_a2
      : 'Hover over a economy');
};
var legend = L.control({ position: 'bottomright' });

legend.onAdd = function(map) {
  var div = L.DomUtil.create('div', 'info legend'),
    grades = [0, 100, 200, 500, 1000, 2000, 5000, 10000],
    labels = [];

  // loop through our density intervals and generate a label with a colored square for each interval
  for (var i = 0; i < grades.length; i++) {
    div.innerHTML +=
      '<i style="background:' +
      getColor(grades[i] + 1) +
      '"></i> ' +
      grades[i] +
      (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
  }

  return div;
};

function getColor(d) {
  return d > 10000
    ? '#800026'
    : d > 5000
    ? '#BD0026'
    : d > 2000
    ? '#E31A1C'
    : d > 1000
    ? '#FC4E2A'
    : d > 500
    ? '#FD8D3C'
    : d > 200
    ? '#FEB24C'
    : d > 100
    ? '#FED976'
    : '#FFEDA0';
}
function style(feature) {
  return {
    fillColor: getColor(feature.properties.density),
    weight: 2,
    opacity: 1,
    color: 'white',
    dashArray: '3',
    fillOpacity: 0.7
  };
}
function highlightFeature(e) {
  var layer = e.target;

  layer.setStyle({
    weight: 5,
    color: '#666',
    dashArray: '',
    fillOpacity: 0.7
  });

  if (!L.Browser.ie && !L.Browser.opera) {
    layer.bringToFront();
  }
  info.update(layer.feature.properties);
  disputeLayer.bringToFront();
  var centroid = turf.centroid(layer.feature);
  const [lng, lat] = centroid.geometry.coordinates;
  let lnglat;
  if (
    map.getBounds().contains(L.latLng(lat, lng)) &&
    turf.inside(centroid.geometry.coordinates, layer.feature)
  ) {
    lnglat = L.latLng(lat, lng);
  } else {
    lnglat = e.latlng;
  }
  var popup = L.popup()
    .setLatLng(lnglat)
    .setContent(
      `<div><h4>${layer.feature.properties.iso_a2}</h4><p>${
        layer.feature.properties.density
      }</p></div>`
    )
    .openOn(map);
}

function resetHighlight(e) {
  geojson.resetStyle(e.target);
  info.update();
  map.closePopup();
}

function zoomToFeature(e) {
  map.fitBounds(e.target.getBounds());
}

function onEachFeature(feature, layer) {
  layer.on({
    mouseover: highlightFeature,
    mouseout: resetHighlight,
    click: zoomToFeature
  });
}

$.getJSON(
  'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_admin_0_countries.geojson',
  function(data, status) {
    $.getJSON(
      'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_10m_admin_0_disputed_areas.geojson',
      function(data) {
        var stripes = new L.StripePattern({
          patternContentUnits: 'objectBoundingBox',
          patternUnits: 'objectBoundingBox',
          weight: 0.1,
          spaceWeight: 0.1,
          height: 0.2,
          angle: 45
        });
        stripes.addTo(map);
        disputeLayer = L.geoJson(data, {
          style: {
            fillPattern: stripes,
            stroke: false,
            fillOpacity: 0.5
          }
        });
        disputeLayer.addTo(map);
      }
    );
    drawMap(data);
  }
);

function drawMap(data) {
  L.tileLayer(
    'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=' +
      mapboxAccessToken,
    {
      id: 'mapbox.light',
      attribution:
        'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://mapbox.com">Mapbox</a>'
    }
  ).addTo(map);

  info.addTo(map);
  legend.addTo(map);
  console.log(data);
  //   const list = ['CN', 'HK', 'ID', 'IN', 'AU', 'JP', 'BU'];
  //   data = data['features'].filter(i => list.includes(i.properties.iso_a2));
  data.features.forEach(
    i => (i['properties']['density'] = i['geometry'].coordinates.length * 100)
  );
  console.log(data);
  geojson = L.geoJson(data, {
    style: style,
    onEachFeature: onEachFeature
  }).addTo(map);
}
