'use strict';

var entryFactory = require('../../../../lib/factory/EntryFactory');
const InfoIconFactory = require('../../../factory/InfoIconFactory');

module.exports = function(element, group, connectorService, translate) {
  group.entries.push(entryFactory.checkbox(translate, {
    id: 'requestHeader',
    label: translate('Edit Request Header'),
    modelProperty: 'requestHeader',
    get: function(element, node) {
      var requestHeader = connectorService.getRequestHeaderSelection(element);
      return { requestHeader: requestHeader ? true : '' };
    },
    set: function(element, values, node) {
      return connectorService.setRequestHeaderSelection(element, values.requestHeader);
    }
  }));
  if ( connectorService.getRequestHeaderSelection(element)) {
   var requestHeaderTable = entryFactory.table(translate, {
      id: 'requestHeaderTable',
      modelProperties: ['key', 'value'],
      addLabel: translate('Add Entry'),
      labels: [translate('Key'), translate('Value')],
      getElements: (element, node) => {
        return connectorService.getRequestHeaderElements(element);
      },
      removeElement: (element, node, index) => {
        return connectorService.removeRequestHeaderElement(element, index);
      },
      addElement: (element, node) => {
        return connectorService.addRequestHeaderElement(element);
      },
      updateElement: (element, value, node, index) => {
        return connectorService.setRequestHeaderElement(element, value, index);
      },
      editable: (element, entryNode, property, index) => {
        var headerEntry = connectorService.getRequestHeaderElements(element)[index];
        return headerEntry.key !== 'X-ProLeiT-Scopes';
      },
      show: (element, entryNode, node, scopeNode) => {
        return true;
      }
    });
    requestHeaderTable.html = requestHeaderTable.html.slice(0,(requestHeaderTable.html.indexOf('</button>') + '</button>'.length)) +
      InfoIconFactory(translate('"Key" and "Value" are of type "String"')) +
      requestHeaderTable.html.slice((requestHeaderTable.html.indexOf('</button>') + '</button>'.length), (requestHeaderTable.html.length - 1));
    group.entries.push(requestHeaderTable);

  }

}
