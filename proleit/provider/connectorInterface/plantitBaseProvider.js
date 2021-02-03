'use strict';

var connectorPlantitBaseModule = require('../../parts/connectorInterface/plantitBase/module');
var connectorPlantitBaseService = require('../../parts/connectorInterface/plantitBase/service');
var connectorPlantiitBaseController = require('../../parts/connectorInterface/plantitBase/controller');
var connectorPlantiitBaseMethod = require('../../parts/connectorInterface/plantitBase/method');

var connectorPlantitBasePayload = require('../../parts/connectorInterface/plantitBase/payload');
var connectorPlantitBaseResponse = require('../../parts/connectorInterface/plantitBase/response');
var connectorPlantitBaseRequestHeader = require('../../parts/connectorInterface/plantitBase/requestHeader');
var connectorPlantitBaseResponseHeader = require('../../parts/connectorInterface/plantitBase/responseHeader');
var connectorPlantitBaseResponseCode = require('../../parts/connectorInterface/plantitBase/responseCode');

function createConnectorTabInputGroup(element, tab, conPlantitBaseService, eventBus, translate) {
  var group = {
    id: 'connector-input',
    label: translate('Input'),
    entries: []
  };
  connectorPlantitBaseRequestHeader(element, group, conPlantitBaseService, translate);
  connectorPlantitBasePayload(element, group, conPlantitBaseService, eventBus, translate);
  tab.groups.push(group);
}

function createConnectorTabOutputGroup(element, tab, conPlantitBaseService, eventBus, translate) {
  var group = {
    id: 'connector-output',
    label: translate('Output'),
    entries: []
  };
  connectorPlantitBaseResponseHeader(element, group, conPlantitBaseService, translate);
  connectorPlantitBaseResponseCode(element, group, conPlantitBaseService, translate);
  connectorPlantitBaseResponse(element, group, conPlantitBaseService, eventBus, translate);
  tab.groups.push(group);
}

module.exports = function PlantitBaseProvider(element, tab, detailGroupIndex, conPlantitBaseService, eventBus, translate) {
  connectorPlantitBaseModule(element, tab.groups[detailGroupIndex], conPlantitBaseService, translate);
  connectorPlantitBaseService(element, tab.groups[detailGroupIndex], conPlantitBaseService, translate);
  connectorPlantiitBaseController(element, tab.groups[detailGroupIndex], conPlantitBaseService, translate);
  connectorPlantiitBaseMethod(element, tab.groups[detailGroupIndex], conPlantitBaseService, translate);

  if (conPlantitBaseService.getPlantitBaseMethod(element)) {
    createConnectorTabInputGroup(element, tab, conPlantitBaseService, eventBus, translate);
    createConnectorTabOutputGroup(element, tab, conPlantitBaseService, eventBus, translate);
  }
}
