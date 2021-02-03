'use strict';

var entryFactory = require('../../../../lib/factory/EntryFactory');

function createMethodOption(method) {
  return { 
    value: JSON.stringify(method),
    name: method.method.toUpperCase() + ' ' + method.path,
    title: method.summary
  };
}

module.exports = function(element, group, plantitBaseConnectorService, translate) {
  var selectOptions = [{ value: '' }];
  var id = 'plantitBaseMethod';
  if (plantitBaseConnectorService.plantitBaseControllerCatalogLoading() == true) {
    id = 'plantitBaseMethod_loading';
    selectOptions = [{ value: '', name: translate('loading...')}];
  } else if (plantitBaseConnectorService.plantitBaseControllerCatalogLoading() == false) {
    var methods = plantitBaseConnectorService.getPlantitBaseControllerCatalog(element);
    if (methods) {
      var methodOptions = methods.map(method => createMethodOption(method));
      var controller = JSON.stringify({
        'controllerId': methods[methods.length - 1].controllerId
      });
      selectOptions = [{ value: controller, name: ''}].concat(methodOptions);
      id = id + plantitBaseConnectorService.getPlantitBaseController(element).value;
    }
  }
  group.entries.push(entryFactory.selectBox(translate, {
    id: id,
    label: translate('Method*'),
    selectOptions: selectOptions,
    modelProperty: 'plantitBaseMethod',

    get: function(element, node) {
      var plantitBaseMethod = plantitBaseConnectorService.getPlantitBaseMethod(element);
      return { plantitBaseMethod: plantitBaseMethod ? createMethodOption(plantitBaseMethod).value : '' };
    },
    set: function(element, values, node) {
      var method = values.plantitBaseMethod ? JSON.parse(values.plantitBaseMethod) : undefined;
      return plantitBaseConnectorService.setPlantitBaseMethod(element, method);
    },
    validate: function(element, values, node) {
      if (plantitBaseConnectorService.getPlantitBaseController(element)) {
        return values.plantitBaseMethod ? {} : {plantitBaseMethod: translate('Must provide a value')};
      } else {
        return values.plantitBaseMethod ? {} : {plantitBaseMethod: translate('Must select an API')};
      }
    }
  }));
}
