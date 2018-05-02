$('.geocoder-control-input').focus(function() {
  $('.geocoder-control-expanded').width(290)
});

$('.geocoder-control-input').focusout(function() {
  $('.geocoder-control-expanded').width(65)
});

$('.geocoder-control').on("focusout", function() {
  $('.geocoder-control').popover('disable').popover("hide");
});

$('#identity-btn').on("click", function(){
	$('.leaflet-popup-content-wrapper').toggle();
})

$("#layers-btn").click(function() {
  	$('[data-toggle="tooltip"]').tooltip('hide')
  	$('.leaflet-control-layers').toggle()
  	return false;
});

$("#basemap-btn").click(function() {
  	$('[data-toggle="tooltip"]').tooltip('hide')
  	$('.leaflet-iconLayers').toggle()
  	return false;
});


