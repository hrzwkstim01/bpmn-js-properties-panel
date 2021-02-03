'use strict';

var entryFactory = require('../../../../lib/factory/EntryFactory');

module.exports = function(element, group, plantitBaseConnectorService, translate) {
  var selectOptions = undefined;
  var id = '';
  if (plantitBaseConnectorService.plantitBaseModulesLoading()) {
    selectOptions = [{ value: '', name: translate('loading...')}];
  } else {
    var selectedModule = plantitBaseConnectorService.getPlantitBaseModule(element);
    var selectedService = plantitBaseConnectorService.getPlantitBaseService(element);
    var controllers = plantitBaseConnectorService.getPlantitBaseControllers();
    if (selectedService) {
      id = selectedService.name;
      controllers = controllers.filter(controller => controller.service == selectedService.name);
    } else if (selectedModule) {
      id = selectedModule.name;
      controllers = controllers.filter(controller => controller.module == selectedModule.name);
    }
    var selectOptions = [{ value: '' }].concat(controllers);
  }
  group.entries.push(entryFactory.selectBox(translate, {
    id: 'plantitBaseController' + id,
    label: translate('API*'),
    selectOptions: selectOptions,
    modelProperty: 'plantitBaseController',

    get: function(element, node) {
      var selectedController = plantitBaseConnectorService.getPlantitBaseController(element);
      return { plantitBaseController: selectedController ? selectedController.value : '' };
    },
    set: function(element, values, node) {
      return plantitBaseConnectorService.setPlantitBaseController(element, values.plantitBaseController);
    },
    validate: function(element, values, node) {
      return values.plantitBaseController ? {} : {plantitBaseController: translate('Must provide a value')};
    }
  }));
}
