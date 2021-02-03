'use strict';

var OpenApiSpecificationInterface = require('./openApiSpecificationService');
const request = require('request');

var EndpointCatalogService = {};

module.exports = EndpointCatalogService;

EndpointCatalogService.requestPlantitBaseControllerCatalog = function(eventBus, origin, connectorPlantitBaseService, controller) {
  var options = {
    uri: origin + '/processmodelling/endpointcatalog/api/Endpoint/' +
      controller.module + '/' + controller.service + '/' + controller.value + '/openApiSpecification',
    method: 'GET',
    headers: { 'content-type': 'application/json' },
    json: true
  };
  request(options, (error, response, body) => {
    connectorPlantitBaseService.modulesLoading = false;
    if (response.statusCode === 200) {
      controller.catalog = JSON.parse(body);
      controller.methods = OpenApiSpecificationInterface.getAllMethods(controller.catalog, controller.id);
      connectorPlantitBaseService.controllerCatalogLoading = false;
      eventBus.fire('elementTemplates.changed');
    }
  });
}

EndpointCatalogService.requestPlantitBaseModules = function(eventBus, origin, connectorPlantitBaseService) {
  var options = {
    uri: origin + '/processmodelling/endpointcatalog/api/Endpoint',
    method: 'GET',
    headers: { 'content-type': 'application/json' },
    json: true
  };
  request(options, (error, response, body) => {
    connectorPlantitBaseService.modulesLoading = false;
    if (response.statusCode === 200) {
      var modules = {};
      var services = {};
      var controller = {};
      body.forEach(endpoint => {
        if (!modules[endpoint.moduleName]) {
          modules[endpoint.moduleName] = {
            name: endpoint.moduleName,
            value: endpoint.moduleName
          };
        }
        if (!services[endpoint.serviceName] || services[endpoint.serviceName].module != endpoint.moduleName) {
          services[endpoint.serviceName] = {
            name: endpoint.serviceName,
            value: endpoint.serviceName,
            module: endpoint.moduleName
          };
        }
        if (!controller[endpoint.apiName]) {
          controller[endpoint.apiName] = {
            name: endpoint.displayName,
            value: endpoint.apiName,
            module: endpoint.moduleName,
            service: endpoint.serviceName,
            id: endpoint.id
          };
        }
      });
      connectorPlantitBaseService.modules = Object.values(modules);
      connectorPlantitBaseService.services = Object.values(services);
      connectorPlantitBaseService.controllers = Object.values(controller);
      eventBus.fire('elementTemplates.changed');
    }
  });
}
