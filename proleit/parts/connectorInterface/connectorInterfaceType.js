'use strict';

var entryFactory = require('../../../lib/factory/EntryFactory');

module.exports = function(element, group, connectorInterfaceService, translate) {
  console.log('connectorInterfaceType - group', group);
  var selectOptions = [{ value: '' }].concat(connectorInterfaceService.getAllInterfaceTypes());
  if (connectorInterfaceService.getInterfaceType(element)) {
    group.entries = group.entries.filter(entry => entry.id != 'connectorId');
  }
  group.entries.unshift(entryFactory.selectBox(translate, {
    id: 'interfaceType',
    label: translate('Type Of Interface'),
    selectOptions: selectOptions,
    modelProperty: 'interfaceType',
    get: function(element, node) {
      var interfaceType = connectorInterfaceService.getInterfaceType(element);
      return { interfaceType: interfaceType ? interfaceType.value : '' };
    },
    set: function(element, values, node) {
      return connectorInterfaceService.setInterfaceType(element, values.interfaceType);
    }
  }));

  group.entries.unshift(entryFactory.label({
    id: 'requiredLabel',
    labelText: translate('*Required')
  }));
}
