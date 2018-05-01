L.Control.PopupInfo = L.Control.extend({

  options: {
    position: 'bottomleft'
  },

  initialize: function (options) {
    L.Util.setOptions(this, options);
  },

  onAdd: function (map) {
    var container = L.DomUtil.create('div', 'leaflet-popup-content-wrapper');
    container.setAttribute('aria-haspopup', true);
    container.id = 'popupInfo'
    
    this.popupBox = L.DomUtil.create('div', 'popupBox', container)
    this.popupBox.id = 'popupBox'

    L.DomEvent.disableClickPropagation(this.popupBox);
    L.DomEvent.on(container, 'wheel', L.DomEvent.stopPropagation);

    return container;
  },

  onRemove: function (map) {
    // when removed
  }

});

L.control.popupInfo = function(options) {
  return new L.Control.PopupInfo(options);
}