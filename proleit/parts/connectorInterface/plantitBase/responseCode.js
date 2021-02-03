'use strict';

var entryFactory = require('../../../../lib/factory/EntryFactory');
var attachTooltip = require('../../../factory/EntryFieldTooltip');

module.exports = function(element, group, plantitBaseConnectorService, translate) {
  var responseCodeCheckbox = entryFactory.checkbox(translate, {
    id: 'responseCode',
    label: translate('Map Response Code'),
    modelProperty: 'responseCode',
    get: function(element, node) {
      var responseCode = plantitBaseConnectorService.getResponseCodeSelection(element);
      return { responseCode: !!responseCode };
    },
    set: function(element, values, node) {
      return plantitBaseConnectorService.setResponseCodeSelection(element, values.responseCode);
    }
  });
  var responseCodeTooltipText = '';
  var responseCodes = plantitBaseConnectorService.getPlantitBaseMethod(element).responseCodes;
  for (var responseCode in responseCodes) {
    responseCodeTooltipText = responseCodeTooltipText + responseCode + ': ' + responseCodes[responseCode].description + '; '
  }
  responseCodeCheckbox.html = attachTooltip(responseCodeCheckbox.html, 'label', responseCodeTooltipText);
  group.entries.push(responseCodeCheckbox);
  if (plantitBaseConnectorService.getResponseCodeSelection(element)) {
    group.entries.push(entryFactory.textField(translate, {
      id: 'map response code',
      label: translate('Variable Assignement Value'),
      modelProperty: 'responsecodemap',
      description: translate('Add a variable of type "String"'),
      get: function(element, node) {
        var responsecodemap = plantitBaseConnectorService.getResponseCodeMapping(element);
        return { responsecodemap: responsecodemap ? responsecodemap : '' };
      },
      set: function(element, values, node) {
        return plantitBaseConnectorService.setResponseCodeMapping(element, values.responsecodemap);
      }
    }));
  }

}
