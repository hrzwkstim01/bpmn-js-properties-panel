'use strict';

var forEach = require('lodash/forEach');

const RegexExpression = /^(\$\{).*?(\})$/;

var ObjectConverterService = {};

module.exports = ObjectConverterService;

ObjectConverterService.castToBoolean = function(value) {
  if (value === 'false') {
    return false;
  } else if (value === 'true') {
    return true;
  } else {
    return undefined;
  }
}

ObjectConverterService.castToInteger = function(value) {
  var result = Number(value);
  return result === NaN ? undefined : Math.round(result);
}

ObjectConverterService.castToObject = function(value) {
  if (typeof value === 'object') {
    return value;
  }
  try {
    value = value.replace(/((\$\{)[^"]*?(\}))(?=(?:[^"]*"[^"]*")*[^"]*$)/g, '"$&"');
    return JSON.parse(value);
  } catch (error) {
    return undefined;
  }
}

ObjectConverterService.compressValue = function(rawValue, schema, isScript = false) {
  var result;
  if (rawValue === null || rawValue === undefined) {
    result = '';
  } else if (ObjectConverterService.isStringExpression(rawValue)) {
    result = rawValue;
  } else if (ObjectConverterService.isObject(schema.type)) {
    rawValue = ObjectConverterService.flagNoneStringExpressions(rawValue, schema);
    result = JSON.stringify(rawValue).replace(/(\"\%NONESTRING\%\$\{).*?(\}\")/g, function(x) {
      return x.replace(/^"%NONESTRING%(.*)"$/, '$1');
    });
  } else {
    result = String(rawValue);
  }
  if (isScript) {
    result = result
      .replace(/\"\$\{(.*?)\}\"/g, 'execution.getVariable("$1")')
      .replace(/\$\{(.*?)\}/g, 'execution.getVariable("$1")');
  }
  return result;
}

ObjectConverterService.flagNoneStringExpressions = function(objectValue, schema) {
  if (schema.type !== 'string' && ObjectConverterService.isExpression(objectValue)) {
    return objectValue.replace(RegexExpression, '%NONESTRING%$&');
  }
  if (typeof objectValue !== 'object' || (!schema.properties && !schema.additionalProperties)) {
    return objectValue;
  }
  forEach(objectValue, function(value, key) {
    if (schema.properties && schema.properties[key]) {
      objectValue[key] = ObjectConverterService.flagNoneStringExpressions(objectValue[key], schema.properties[key]);
    } else if (schema.additionalProperties) {
      objectValue[key] = ObjectConverterService.flagNoneStringExpressions(objectValue[key], schema.additionalProperties);
    }
  });
  return objectValue;
}

ObjectConverterService.isExpression = function(value) {
  return typeof value === 'string' && !!value.match(RegexExpression);
}

ObjectConverterService.isObject = function(type) {
  return (type === 'object' || typeof type === 'object');
}

ObjectConverterService.isStringExpression = function(value) {
  return typeof value === 'string';
}

ObjectConverterService.resolveValue = function(value, type = 'object', isScript = false) {
  if (!value) {
    return undefined;
  }
  if (isScript) {
    value = value.replace(/execution.getVariable\(\"(.*?)\"\)/g, '\${$1}')
  }
  if (ObjectConverterService.isExpression(value)) {
    return value;
  }
  var rawValue;
  switch (type) {
    case 'boolean':
      rawValue = ObjectConverterService.castToBoolean(value);
      break;
    case 'integer':
      rawValue = ObjectConverterService.castToInteger(value);
      break;
    case 'object':
      rawValue = ObjectConverterService.castToObject(value);
      break;
    default:
      rawValue = value;
    }
  return rawValue !== undefined ? rawValue : value;
}