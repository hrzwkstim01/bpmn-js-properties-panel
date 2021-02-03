'use strict';

var entryFactory = require('../../../../lib/factory/EntryFactory');

module.exports = function(element, group, plantitBaseConnectorService, translate) {
  var selectOptions = undefined;
  var id = '';
  if (plantitBaseConnectorService.plantitBaseModulesLoading()) {
    selectOptions = [{ value: '', name: translate('loading...')}];
  } else {
    var selectedModule = plantitBaseConnectorService.getPlantitBaseModule(element);
    var services = plantitBaseConnectorService.getPlantitBaseServices(element);
    if (selectedModule) {
      id = selectedModule.name;
      services = services.filter(service => selectedModule.name == service.module)
    }
    selectOptions = [{ value: '' }].concat(services);
  }
  group.entries.push(entryFactory.selectBox(translate, {
    id: 'plantitBaseService' + id,
    label: translate('Service'),
    selectOptions: selectOptions,
    modelProperty: 'plantitBaseService',
    get: function(element, node) {
      var selectedService = plantitBaseConnectorService.getPlantitBaseService(element);
      return { plantitBaseService: selectedService ? selectedService.value : '' };
    },
    set: function(element, values, node) {
      return plantitBaseConnectorService.setPlantitBaseService(element, values.plantitBaseService);
    }
  }));
}
