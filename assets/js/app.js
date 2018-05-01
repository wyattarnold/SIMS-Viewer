// Basemap Layers

  var topographic = L.esri.basemapLayer("Topographic", {detectRetina:false})

  var gray = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}@2x.png', {
          maxZoom: 18, detectRetina:false,attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, \
          &copy;<a href="https://carto.com/attribution">CARTO</a>'
        });

  var esriSat = new L.layerGroup([])

  var imagery = L.esri.basemapLayer("Imagery", {
    detectRetina:false}).addTo(esriSat)
  var labels = L.esri.basemapLayer("ImageryLabels", {
    detectRetina:false}).addTo(esriSat)



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

  map.createPane('sims');
  map.getPane('sims').style.zIndex = 1000;

  var periodMostRecentIndex = config.periods.length - 1

  var ndviTMS = L.tileLayer(config.ndviTMS + config.periods[periodMostRecentIndex] +'/{z}/{x}/{-y}.png',{
    pane: 'sims',
    detectRetina: false
  }).addTo(map);

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
  });

  // Time-slider
  var periodMostRecentIndex = config.periods.length - 1

  var timeSlider = L.control.slider(
    function(value) {

      console.log(value)

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


  var SIMSoverlays = {
    "Veg. Index (NDVI)":ndviTMS, 
    "Fractional Cover (Fc)":fcTMS, 
    "Crop Coefficient (Kcb)":KcbTMS, 
    "Basal Crop Evapotranspiration (ETcb)":ETcbTMS};
  L.control.layers(SIMSoverlays,{},{
    position: 'topright',
    collapsed: false
  }).addTo(map);

// Add zoom control
  var zoomControl = L.Control.zoomHome({position:'topleft'}).addTo(map);


/// Basemap Selector
// Add Basemap Selector
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


// Search control
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

  var results = L.layerGroup().addTo(map);

  searchControl.on('results', function(data){
    results.clearLayers();
    for (var i = data.results.length - 1; i >= 0; i--) {
      results.addLayer(L.marker(data.results[i].latlng));
      console.log(data.results[i].properties)
    }

  });




/// Map onClick Feature Info
// Add popup info control
var popupInfo = new L.Control.PopupInfo({}).addTo(map);

$('[data-toggle="tooltip"]').tooltip({
    trigger : 'hover'
  });


var years = ['2010','2011','2012','2013','2014','2015','2016','2017']


function query(e) {
    $('.leaflet-popup-content-wrapper').fadeIn();
    console.log(e.latlng)
    lat = e.latlng.lat
    lng = e.latlng.lng
    projected = proj4(config.ncProjection,[lng,lat])
    x = projected[0]
    y = projected[1]

    var deferreds = [];


    $.each(years, function(index, stat){
        deferreds.push(
            // No success handler - don't want to trigger the deferred object
            $.ajax({
                url: config.ncPointQuery+ 'r='+config.value+ '&x='+x+'&y='+y+ '&srid='+config.ncProjection,
                data: {
                  yr: stat,
                  format: 'csv'
                },
                crossDomain: true,
                dataType: 'text/csv',
                type: 'GET'
            })
        );
    });
    // Can't pass a literal array, so use apply.
    $.when.apply($, deferreds).then(function(){
        console.log(deferreds)
    }).fail(function(){
        // Probably want to catch failure
    })

    results.clearLayers();
    results.addLayer(L.marker(L.latLng(e.latlng)));
  };

map.clicked = 0;                                                                      

map.on('click', function(e){
    map.clicked = map.clicked + 1;
    setTimeout(function(){
        if(map.clicked == 1){
            query(e)              
            map.clicked = 0;
        }
     }, 300);
});

map.on('dblclick', function(event){
    map.clicked = 0;
    map.zoomIn();
});





/// Highlights
  var highlight = L.geoJSON(null).addTo(map);
  highlightStyle = {
    style: {
      color:'#f5ff00', 
      fillColor:'#f5ff00',
      weight: 0.2,
      opacity: 0.5
    }
  }

  highlight.on('layeradd', function(e){
    e.layer.setStyle(highlightStyle)
  })

  if ( !("ontouchstart" in window) ) {

    $(document).on("mouseover", ".showFeature", function(e) {
      json = $(this).attr('json')
      var feature = L.geoJson(JSON.parse(json));
      highlight.addLayer(feature);
      });

    }

  $(document).on("mouseout", ".highlight", function(e) {
    highlight.clearLayers()
  });


$('#loading-mask').fadeOut();
