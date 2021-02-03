'use strict';

var entryFactory = require('../../../../lib/factory/EntryFactory');

module.exports = function(element, group, plantitBaseConnectorService, translate) {
  var id;
  var selectOptions;
  if (plantitBaseConnectorService.plantitBaseModulesLoading()) {
    id = 'plantitBaseModule_loading';
    selectOptions = [{ value: '', name: translate('loading...')}];
  } else {
    id = 'plantitBaseModule';
    var modules = plantitBaseConnectorService.getPlantitBaseModules();
    selectOptions = [{ value: '' }].concat(modules);
  }

  group.entries.push(entryFactory.selectBox(translate, {
    id,
    label: translate('Module'),
    selectOptions,
    modelProperty: 'plantitBaseModule',
    get: function(element, node) {
      var module = plantitBaseConnectorService.getPlantitBaseModule(element);
      return { plantitBaseModule: module ? module.value : '' };
    },
    set: function(element, values, node) {
      return plantitBaseConnectorService.setPlantitBaseModule(element, values.plantitBaseModule);
    }
  }));
}
