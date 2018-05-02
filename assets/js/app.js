/// Map
var map = L.map('map', {
    layers: [],
    center: [37.1603, -120.8605],
    minZoom: 7,
    maxZoom: 15,
    zoom: 8,
    zoomControl: false,
    loadingControl: false
});
map.createPane('pin');
map.getPane('pin').style.zIndex = 1001;
map.createPane('sims');
map.getPane('sims').style.zIndex = 300;



/// SIMS overlays
var periodMostRecentIndex = config.periods.length - 1

var ndviTMS = L.tileLayer(config.ndviTMS + config.periods[periodMostRecentIndex] +'/{z}/{x}/{-y}.png',{
  pane: 'sims',
  detectRetina: false
});

var fcTMS = L.tileLayer(config.fcTMS + config.periods[periodMostRecentIndex] +'/{z}/{x}/{-y}.png',{
  pane: 'sims',
  detectRetina: false
});

var KcbTMS = L.tileLayer(config.KcbTMS + config.periods[periodMostRecentIndex] +'/{z}/{x}/{-y}.png',{
  pane: 'sims',
  detectRetina: false
});

var ETcbTMS = L.tileLayer(config.ETcbTMS + config.periods[periodMostRecentIndex] +'/{z}/{x}/{-y}.png',{
  pane: 'sims',
  detectRetina: false
}).addTo(map);



/// Time-slider
var timeSlider = L.control.slider(
  function(value) {

    period = config.periods[parseInt(value)]

    ndviTMS.setUrl(config.ndviTMS + period +'/{z}/{x}/{-y}.png',false)
    fcTMS.setUrl(config.fcTMS + period +'/{z}/{x}/{-y}.png',false)
    KcbTMS.setUrl(config.KcbTMS + period +'/{z}/{x}/{-y}.png',false)
    ETcbTMS.setUrl(config.ETcbTMS + period +'/{z}/{x}/{-y}.png',false)

    return period

  }, {

    width: '320px',
    position:'topright',
    min: 0,
    max: periodMostRecentIndex,
    increment: true,
    id: 'timeSlider',
    value: periodMostRecentIndex,
    collapsed: false,
    getValue: function(value){
      period = config.periods[value]
      return period
    }

  }).addTo(map);



/// Overlays for Layer Control
var SIMSoverlays = {
  "Veg. Index (NDVI)":ndviTMS, 
  "Fractional Cover (Fc)":fcTMS, 
  "Crop Coefficient (Kcb)":KcbTMS, 
  "Basal Crop Evapotranspiration (ETcb)":ETcbTMS
};

L.control.layers(SIMSoverlays,{},{
  position: 'topright',
  collapsed: false
}).addTo(map);



/// Add zoom control
var zoomControl = L.Control.zoomHome({position:'topleft'}).addTo(map);



// Basemap Layers
var topographic = L.esri.basemapLayer("Topographic", {detectRetina:false})

var gray = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}@2x.png', {
        maxZoom: 18, detectRetina:false,attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, \
        &copy;<a href="https://carto.com/attribution">CARTO</a>'
      });

var esriSat = new L.layerGroup([])
var imagery = L.esri.basemapLayer("Imagery", {
  detectRetina:false}).addTo(esriSat);
var labels = L.esri.basemapLayer("ImageryLabels", {
  detectRetina:false}).addTo(esriSat);



/// Basemap Selector
var iconLayersControl = new L.Control.IconLayers(
  [
      {
          title: 'Topographic', // use any string
          layer: topographic, // any ILayer
          icon: 'assets/css/images/topo.png' // 80x80 icon
      },
      {
          title: 'Satellite',
          layer: esriSat,
          icon: 'assets/css/images/sattelite.png'
      },
      {
          title: 'Grayscale',
          layer: gray,
          icon: 'assets/css/images/grayscale.png'
      }
  ], {
      position: 'bottomright',
      maxLayersInRow: 5
  }
);
iconLayersControl.addTo(map);
iconLayersControl.setActiveLayer(gray);



/// Search control
var B118 = L.esri.Geocoding.featureLayerProvider({
  url: 'https://gis.water.ca.gov/arcgis/rest/services/Geoscientific/i08_B118_CA_GroundwaterBasins/FeatureServer/0',
  searchFields: ['Basin_Subbasin_Name', 'Basin_Subbasin_Number'], // Search these fields for text matches
  label: 'B118 Groundwater Basins', // Group suggestions under this header
  formatSuggestion: function(feature){
    return feature.properties.Basin_Subbasin_Name + '  (' + feature.properties.Basin_Subbasin_Number + ')'; // format suggestions like this.
  }
});

var arcgisOnline = L.esri.Geocoding.arcgisOnlineProvider({
  countries: 'USA'
});

var searchControl = L.esri.Geocoding.geosearch({
  providers: [arcgisOnline, B118], // will geocode via ArcGIS Online and search the GIS Day feature service.
  placeholder: 'Search...',
  useMapBounds: false,
  position: 'bottomleft',
  expanded: true,
  collapseAfterResult: false
}).addTo(map);
$('.navTools').prepend($('.geocoder-control'))

var results = L.layerGroup({pane:'pin'}).addTo(map);

searchControl.on('results', function(data){
  results.clearLayers();
  for (var i = data.results.length - 1; i >= 0; i--) {
    results.addLayer(L.marker(data.results[i].latlng));
    console.log(data.results[i].properties)
  }
});




/// Add popup info control
var popupInfo = new L.Control.PopupInfo({}).addTo(map);



/// netCDF AJAX queries

function transpose(a) {
    return Object.keys(a[0]).map(function (c) {
        return a.map(function (r) {
            return r[c];
        });
    });
}

function queryYear(lat, lng, croptype, year) {
    
    $('.leaflet-popup-content-wrapper').fadeIn();

    $.ajax({
      url: config.ncPointQuery,
      data: {
        apikey: config.apiKey,
        lat: lat,
        lon: lng,
        year: year,
        croptype: croptype,
        format: 'json'
      },
      crossDomain: true,
      dataType: 'json',
      type: 'GET',
      success: function(data){
        console.log(data)
        timeSeries(transpose(data));
      }
    })
  };


function queryAllYears(lat, lng, croptype) {
    
    var allYearsData = [];

    $.each(config.availableYears, function(index, year) {
        allYearsData.push(
            // No success handler - don't want to trigger the deferred object
            $.ajax({
                url: config.ncPointQuery,
                data: {
                  apikey: apiKey,
                  lat: lat,
                  lon: lng,
                  year: year,
                  croptype: croptype,
                  format: 'json'
                },
                crossDomain: true,
                dataType: 'json',
                type: 'GET'
            })
        );
    });

    $.when.apply($, allYearsData).then(function(){
        console.log(allYearsData);
    }).fail(function(){
    });
};



/// Map Click/Query
map.clicked = 0;                                                                      

map.on('click', function(e){
    map.clicked = map.clicked + 1;
    setTimeout(function(){
        if(map.clicked == 1){
            $('#popupBox').html(spinner.el)
            queryYear(e.latlng.lat,e.latlng.lng,'',timeSlider._sliderValue.innerHTML.split("-")[0]);
            results.clearLayers();
            results.addLayer(L.marker(L.latLng(e.latlng)));          
            map.clicked = 0;
        }
     }, 300);
});

map.on('dblclick', function(event){
    map.clicked = 0;
    map.zoomIn();
});



/// Charts


function timeSeries (data) {

  Highcharts.chart('popupBox', {

      chart: {
          zoomType: 'x'
      },

      plotOptions: {
          spline: {
            pointStart: Date.UTC(timeSlider._sliderValue.innerHTML.split("-")[0],0,1),
            pointInterval: 24 * 3600 * 1000
          },
          scatter: {
            pointStart: Date.UTC(timeSlider._sliderValue.innerHTML.split("-")[0],0,1),
            pointInterval: 24 * 3600 * 1000
          }
      },

      title:{
          text:''
      },

      xAxis: [{
          type: 'datetime'
      }],

      yAxis: [{ // Primary yAxis
          labels: {
              format: '{value} in',
              style: {
                  color: Highcharts.getOptions().colors[1]
              }
          },
          title: {
              text: 'ETcb',
              style: {
                  color: Highcharts.getOptions().colors[1]
              }
          }
      }, { // Secondary yAxis2,
          max: 1.2,
          gridLineWidth: 0,
          title: {
              text: 'NDVI, Fc, Kcb',
              style: {
                  color: Highcharts.getOptions().colors[1]
              }
          },
          labels: {
              format: '{value}',
              style: {
                  color: Highcharts.getOptions().colors[1]
              }
          },
          opposite: true
      }],

      tooltip: {
          shared: true
      },

      legend: {
          layout: 'horizontal',
          align: 'center',
          verticalAlign: 'top',
          floating: true,
          backgroundColor: '#FFFFFF'
      },

      series: [{
          name: 'ETcb',
          type: 'spline',
          data: data[1].map(Number).map(function(val){return val === 0 ? null: val}),
          tooltip: {
              valueSuffix: 'in'
          }
      },{
          name: 'NDVI',
          type: 'scatter',
          yAxis: 1,
          data: data[5].map(Number).map(function(val){return val === 0 ? null: val}),
          tooltip: {
              valueSuffix: ''
          }
      }, {
          name: 'Fc',
          type: 'scatter',
          yAxis: 1,
          data: data[3].map(Number).map(function(val){return val === 0 ? null: val}),
          tooltip: {
              valueSuffix: ''
          }
      }, {
          name: 'Kcb',
          type: 'scatter',
          yAxis: 1,
          data: data[0].map(Number).map(function(val){return val === 0 ? null: val}),
          tooltip: {
              valueSuffix: ''
          }
      }]

  });
};



/// Remove loading mask
$('#loading-mask').fadeOut();
