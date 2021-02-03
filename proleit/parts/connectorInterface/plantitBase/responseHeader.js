'use strict';

var entryFactory = require('../../../../lib/factory/EntryFactory');

module.exports = function(element, group, plantitBaseConnectorService, translate) {
  group.entries.push(entryFactory.checkbox(translate, {
    id: 'responseHeader',
    label: translate('Map Response Header'),
    modelProperty: 'responseHeader',
    get: function(element, node) {
      var responseHeader = plantitBaseConnectorService.getResponseHeaderSelection(element);
      return { responseHeader: !!responseHeader };
    },
    set: function(element, values, node) {
      return plantitBaseConnectorService.setResponseHeaderSelection(element, values.responseHeader);
    }
  }));
  if (plantitBaseConnectorService.getResponseHeaderSelection(element)) {
    group.entries.push(entryFactory.textField(translate, {
      id: 'mapresponseheader',
      label: translate('Variable Assignement Value'),
      modelProperty: 'responseheadermap',
      description: translate('Add a variable of type "String"'),
      get: function(element, node) {
        var responseHeaderMap = plantitBaseConnectorService.getResponseHeaderMapping(element);
        return { responseheadermap: responseHeaderMap ? responseHeaderMap : '' };
      },
      set: function(element, values, node) {
        return plantitBaseConnectorService.setResponseHeaderMapping(element, values.responseheadermap);
      }
    }));
  }

}
