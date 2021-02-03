'use strinct';

var connectorInterfaceType = require('../../parts/connectorInterface/connectorInterfaceType');
var plantitBaseProvider = require('./plantitBaseProvider'),
    workflowTransactionProvider = require('./workflowTransactionProvider');

function removeInputOutputGroup(tab) {
  tab.groups = tab.groups
    .filter(group => group.id !== 'connector-input-parameters')
    .filter(group => group.id !== 'connector-output-parameters');
}

module.exports = function extendConnectorInterface(
  element,
  tabs,
  conInterfaceService,
  conPlantitBaseService,
  conWorkflowTransactionService,
  eventBus,
  translate
){
  if (element.type !== 'bpmn:ServiceTask') { return tabs; }
  const connectorTabIndex = tabs.findIndex(tab => tab.id == 'connector');
  if (connectorTabIndex === -1) { return tabs; }
  const detailGroupIndex = tabs[connectorTabIndex].groups.findIndex(group => group.id == 'connector-details');
  if (detailGroupIndex === -1) { return tabs; }

  connectorInterfaceType(element, tabs[connectorTabIndex].groups[detailGroupIndex], conInterfaceService, translate);
  var selectedInterfaceType = conInterfaceService.getInterfaceType(element);
  if (!selectedInterfaceType) {
    return tabs;
  }

  removeInputOutputGroup(tabs[connectorTabIndex]);
  if (selectedInterfaceType.value === 'INTERFACE_PLANTIT_BASE') {
    plantitBaseProvider(element, tabs[connectorTabIndex], detailGroupIndex, conPlantitBaseService, eventBus, translate);
  } else if (selectedInterfaceType.value === 'INTERFACE_WORKFLOW_TRANSACTION') {
    workflowTransactionProvider(element, tabs[connectorTabIndex], detailGroupIndex, conWorkflowTransactionService, translate);
  }
  return tabs;
}
