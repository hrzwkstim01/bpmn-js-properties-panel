import CamundaPropertiesProvider from '../lib/provider/camunda/CamundaPropertiesProvider';

import ConnectorInterfaceService from './service/connectorInterfaceService';
import ConnectorPlantitBaseService from './service/connectorPlantitBaseService';

import connectorInterfaceProvider from './provider/connectorInterface';
import ConnectorWorkflowTransactionService from './service/connectorWorkflowTransactionService';

export default class ProleitPropertiesProvider extends CamundaPropertiesProvider {
  constructor(
    bpmnFactory,
    canvas,
    commandStack,
    elementRegistry,
    elementTemplates,
    eventBus,
    modeling,
    replace,
    selection,
    translate
  ) {
    super(
      bpmnFactory,
      canvas,
      commandStack,
      elementRegistry,
      elementTemplates,
      eventBus,
      modeling,
      replace,
      selection,
      translate
    );

    console.log('test');
    
    const conInterfaceService = ConnectorInterfaceService(bpmnFactory, translate);
    const conPlantitBaseService = ConnectorPlantitBaseService(eventBus, bpmnFactory);
    const conWorkflowTransactionService = ConnectorWorkflowTransactionService(bpmnFactory);
    const getTabs = this.getTabs;

    this.getTabs = element => {
      var tabs = getTabs(element);
      connectorInterfaceProvider(
        element, tabs, conInterfaceService, conPlantitBaseService,
        conWorkflowTransactionService, eventBus, translate);
      return tabs;
    };
  }
}

ProleitPropertiesProvider.$inject = [
  'bpmnFactory',
  'canvas',
  'commandStack',
  'elementRegistry',
  'elementTemplates',
  'eventBus',
  'modeling',
  'replace',
  'selection',
  'translate'
];
