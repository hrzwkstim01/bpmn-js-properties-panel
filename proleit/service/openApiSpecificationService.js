'use strict';

var forEach = require('lodash/forEach');
var ObjectConverterService = require('./objectConverterService');

var OpenApiSpecificationService = {};

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function resolveSchema(schema, catalog) {
  if (schema.type) {
    if (!schema.typeDisplay) {
      schema.typeDisplay = resolveTypeDisplay(schema);
    }
    return schema;
  }
  if (!catalog || !schema.$ref) {
    return undefined;
  }
  var routes = schema.$ref.replace('#/', '').split('/');
  var result = catalog;
  forEach(routes, function(route) {
    if (result) { result = result[route]; }
  });
  result.typeDisplay = resolveTypeDisplay(schema);
  if (result.required && typeof result.required === 'object' && result.properties) {
    forEach(result.required, function(requiredKey) {
      result.properties[requiredKey].required = true;
    });
  }
  return result;
}

function resolveTypeDisplay(schema) {
  var result;
  if (schema.type) {
    if (schema.type === 'array') {
      result = 'array<' + resolveTypeDisplay(schema.items) + '>';
    } else {
      result = schema.type;
    }
  } else if (schema.$ref) {
    result = schema.$ref.split('/').pop();
  } else {
    return undefined;
  }
  return capitalizeFirstLetter(result);
}

function getPathParameterValue(srcPath, pathValue, name) {
  var candidate = '{' + name +  '}';
  var preParamPath = srcPath.split(candidate)[0];
  var paramRouteIndex = preParamPath.split('/').length - 1;
  var paramRoute = srcPath.split('/')[paramRouteIndex];
  var paramRouteValue = pathValue.split('/')[paramRouteIndex];
  var paramRouteLeftOvers = paramRoute.split(candidate);
  paramRouteLeftOvers.forEach(leftOver =>
    paramRouteValue = paramRouteValue.replace(leftOver, ''));

  return paramRouteValue === candidate ? '' : percentDecode(paramRouteValue);
}

function setPathParameterValue(srcPath, pathValue, name, newValue) {
  var candidate = '{' + name +  '}';
  if (!newValue || newValue === '') {
    newValue = candidate;
  }
  var preParamPath = srcPath.split(candidate)[0];
  var paramRouteIndex = preParamPath.split('/').length - 1;
  var paramRoute = srcPath.split('/')[paramRouteIndex];
  var newParamRouteValue = paramRoute.replace(candidate, percentEncode(newValue));
  var paramRouteValues = pathValue.split('/');
  paramRouteValues[paramRouteIndex] = newParamRouteValue;
  return paramRouteValues.join('/');
}

function getQueryParameterValue(pathValue, name) {
  var pathAndQuery = pathValue.split('?');
  if (pathAndQuery.length <= 1) {
    return '';
  }
  var query = pathAndQuery[1];
  var candidate = name + '=';
  var querySplitCandidate = query.split(candidate);
  if (querySplitCandidate.length <= 1) {
  	return '';
  }
  return percentDecode(querySplitCandidate[1].split('&')[0]);
}

function setQueryParameterValue(pathValue, name, newValue) {
  var candidate = name + '=';
  newValue = percentEncode(newValue);
  var pathAndQuery = pathValue.split('?');
  if (pathAndQuery.length <= 1) {
    if (!newValue || newValue === '') {
      return pathValue;
    } else {
      return pathValue + '?' + candidate + newValue;
    }
  }
  var query = pathAndQuery[1];
  var querySplitCandidate = query.split(candidate);
  if (querySplitCandidate.length <= 1) {
    if (!newValue || newValue === '') {
      return pathValue;
    } else {
      return pathValue + '&' + candidate + newValue;
    }
  }
  var trailingQueries = querySplitCandidate[1].split('&');
  trailingQueries.shift();
  if (!!newValue && newValue !== '') {
    trailingQueries.unshift(candidate + newValue);
  }
  querySplitCandidate[1] = trailingQueries.join('&');
  return [
    pathAndQuery[0],
    querySplitCandidate.join('')
  ].join('?');
}

function getHeaderParameterValue(headerEntries, name) {
  var entry = headerEntries.find(e => e.key && e.key === name);
  return entry ? entry.value : '';
}

function getMethodSchema(catalog, path, method) {
  if (!catalog || !catalog.paths || !path || !method) {
    return undefined;
  }
  return catalog.paths[path][method];
}

function getRequestBodySchema(methodSchema, contentType = 'application/json') {
  if (!methodSchema || !methodSchema.requestBody || !methodSchema.requestBody.content) {
    return undefined;
  }
  return {
    ...methodSchema.requestBody.content[contentType].schema,
    description: methodSchema.requestBody.description,
    required: methodSchema.requestBody.required
  };
}

function getResponseContentSchema(methodSchema, statusCode = '200', contentType = 'application/json') {
  if (!methodSchema || !methodSchema.responses || !methodSchema.responses[statusCode] ||
    !methodSchema.responses[statusCode].content || !methodSchema.responses[statusCode].content[contentType]
  ) {
    return undefined;
  }
  return {
    ...methodSchema.responses[statusCode].content[contentType].schema,
    description: methodSchema.responses[statusCode].description
  };
}

function getSchemaWithValue(schema, value, catalog) {
  var resolvedSchema = resolveSchema(schema, catalog);
  resolvedSchema.value = value;
  if (OpenApiSpecificationService.isPredefinedObject(resolvedSchema)) {
    var rawValue = ObjectConverterService.isExpression(value) ? undefined
      : value ? ObjectConverterService.resolveValue(value, resolvedSchema.type)
      : undefined;
    forEach(resolvedSchema.properties, function(propertySchema, key) {
      var resolvedPropertySchema = resolveSchema(propertySchema, catalog);
      var propertyRawValue = rawValue ? rawValue[key] : '';
      var propertyValue = ObjectConverterService.compressValue(propertyRawValue, resolvedPropertySchema);
      resolvedSchema.properties[key] = getSchemaWithValue(resolvedPropertySchema, propertyValue, catalog);
    });
  }
  return resolvedSchema;
}

function getSchemaWithScriptValue(schema, catalog, key = undefined, parentScriptValue = undefined) {
  var resolvedSchema = resolveSchema(schema, catalog);
  resolvedSchema.scriptValue = parentScriptValue
    ? parentScriptValue.split('.value();')[0] + `.prop("${key}").value();`
    : 'S(response).value();';
  if (OpenApiSpecificationService.isPredefinedObject(resolvedSchema)) {
    forEach(resolvedSchema.properties, function(propertySchema, propertyKey) {
      resolvedSchema.properties[propertyKey] =
        getSchemaWithScriptValue(propertySchema, catalog, propertyKey, resolvedSchema.scriptValue)
    });
  }
  return resolvedSchema;
}

function percentDecode(value) {
  if (typeof value !== 'string') {
    return undefined;
  }
  return value
    .replace(/%21/g, '!')
    .replace(/%23/g, '#')
    .replace(/%24/g, '$')
    .replace(/%26/g, '&')
    .replace(/%27/g, '\'')
    .replace(/%28/g, '(')
    .replace(/%29/g, ')')
    .replace(/%2A/g, '*')
    .replace(/%2B/g, '+')
    .replace(/%2C/g, ',')
    .replace(/%2F/g, '/')
    .replace(/%3A/g, ':')
    .replace(/%3B/g, ';')
    .replace(/%3D/g, '=')
    .replace(/%3F/g, '?')
    .replace(/%40/g, '@')
    .replace(/%5B/g, '[')
    .replace(/%5D/g, ']')
    .replace(/%25/g, '%')
}

function percentEncode(value) {
  if (typeof value !== 'string') {
    return undefined;
  }
  if (ObjectConverterService.isExpression(value)) {
    return value;
  }
  return value
    .replace(/\%/g, '%25')
    .replace(/\!/g, '%21')
    .replace(/\#/g, '%23')
    .replace(/\$/g, '%24')
    .replace(/\&/g, '%26')
    .replace(/\'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A')
    .replace(/\+/g, '%2B')
    .replace(/\,/g, '%2C')
    .replace(/\//g, '%2F')
    .replace(/\:/g, '%3A')
    .replace(/\;/g, '%3B')
    .replace(/\=/g, '%3D')
    .replace(/\?/g, '%3F')
    .replace(/\@/g, '%40')
    .replace(/\[/g, '%5B')
    .replace(/\]/g, '%5D');
}

function valueMatchesObject(schema, expressionAllowed) {
  var rawValue = ObjectConverterService.castToObject(schema.value);
  if (!rawValue || typeof rawValue !== 'object') { return false; }

  var schemaPropertyKeys = !!schema.properties ? Object.keys(schema.properties) : [];
  var propertyKeys = Object.keys(rawValue)
    .filter(propertyKey => schemaPropertyKeys.includes(propertyKey));
  var propertiesWellDefined = propertyKeys
    .every(propertyKey => OpenApiSpecificationService.valueMatchesType({
      ...schema.properties[propertyKey],
      value: rawValue[propertyKey]
    }, expressionAllowed));

  var additionalPropertyKeys = Object.keys(rawValue)
    .filter(propertyKey => !schemaPropertyKeys.includes(propertyKey));
  if (additionalPropertyKeys.length > 0 && !schema.additionalProperties) {
    return false;
  }
  var additionalPropertiesWellDefined = additionalPropertyKeys
    .every(propertyKey => OpenApiSpecificationService.valueMatchesType({
      ...schema.additionalProperties,
      value: rawValue[propertyKey]
    }, expressionAllowed));

  return propertiesWellDefined && additionalPropertiesWellDefined;
}

module.exports = OpenApiSpecificationService;

OpenApiSpecificationService.isPredefinedObject = function(schema) {
  return schema.properties && !schema.additionalProperties;
}

OpenApiSpecificationService.valueMatchesType = function(schema, expressionAllowed = true) {
  if (schema.value === undefined || !schema.type) {
    return false;
  }
  if (ObjectConverterService.isExpression(schema.value)) {
    return expressionAllowed;
  }
  switch (schema.type.toLowerCase()) {
    case 'array':
      var rawValue = ObjectConverterService.castToObject(schema.value);
      return typeof rawValue === 'object' && schema.items && Array.from(rawValue)
        .every(value => OpenApiSpecificationService.valueMatchesType({ ...schema.items, value }));
    case 'boolean':
      var rawValue = ObjectConverterService.castToBoolean(schema.value);
      return typeof rawValue === 'boolean';
    case 'integer':
      var rawValue = ObjectConverterService.castToInteger(schema.value);
      return !!rawValue && typeof rawValue === 'number';
    case 'object': return valueMatchesObject(schema, expressionAllowed);
    case 'string':
      return typeof schema.value === 'string';
    default:
      return false;
  }
}

OpenApiSpecificationService.getAllMethods = function(catalog, controllerId) {
  var result = [];
  forEach(catalog.paths, function(path, pathKey) {
    forEach(path, function(method, methodKey) {
      var methodInfos = {
        method: methodKey,
        path: pathKey,
        controllerId,
        summary: method.summary,
        responseCodes: method.responses,
        security: ''
      }
      if (method.security) {
        forEach(catalog.components.securitySchemes.oauth2.flows.implicit.scopes, function(scoepDescription, scopeKey) {
          methodInfos.security = methodInfos.security + scopeKey + ';'
        })
      }
      result.push(methodInfos);
    });
    })
  return result;
}

OpenApiSpecificationService.getParameters = function(catalog, path, method, pathValue, headerValue) {
  var catalogCopy = JSON.parse(JSON.stringify(catalog));
  var methodSchema = getMethodSchema(catalogCopy, path, method);
  if (!methodSchema.parameters) {
    return [];
  }
  forEach(methodSchema.parameters, function(parameter) {
    var value = parameter.in === 'path' ? getPathParameterValue(path, pathValue, parameter.name)
      : parameter.in === 'query' ? getQueryParameterValue(pathValue, parameter.name)
      : parameter.in === 'header' ? getHeaderParameterValue(headerValue, parameter.name)
      : '';
    parameter.schema = getSchemaWithValue(parameter.schema, value, catalogCopy);
  });
  return methodSchema.parameters;
}

OpenApiSpecificationService.setPathParameter = function(method, pathValue, updatedParameter) {
  if (!method || !method.path || !updatedParameter || !updatedParameter.name) {
    return pathValue;
  }
  return setPathParameterValue(method.path, pathValue, updatedParameter.name, updatedParameter.value);
}

OpenApiSpecificationService.setQueryParameter = function(pathValue, updatedParameter) {
  if (!updatedParameter || !updatedParameter.name) {
    return pathValue;
  }
  return setQueryParameterValue(pathValue, updatedParameter.name, updatedParameter.value);
}

OpenApiSpecificationService.getRequestBody = function(catalog, path, method, value) {
  var catalogCopy = JSON.parse(JSON.stringify(catalog));
  var methodSchema = getMethodSchema(catalogCopy, path, method);
  var requestBodySchema = getRequestBodySchema(methodSchema);
  if (!requestBodySchema) {
    return undefined;
  }
  return getSchemaWithValue(requestBodySchema, value, catalogCopy);
}

OpenApiSpecificationService.getResponse = function(catalog, path, method) {
  var catalogCopy = JSON.parse(JSON.stringify(catalog));
  var methodSchema = getMethodSchema(catalogCopy, path, method);
  var responseContentSchema = getResponseContentSchema(methodSchema);
  if (!responseContentSchema) {
    return undefined;
  }
  return getSchemaWithScriptValue(responseContentSchema, catalogCopy);
}
