'use strict';
var escapeHTML = require('../../lib/Utils').escapeHTML;

var domAttr = require('min-dom').attr,
    domClosest = require('min-dom').closest;

var forEach = require('lodash/forEach'),
    keys = require('lodash/keys');

var entryFieldDescription = require('../../lib/factory/EntryFieldDescription');

var updateSelection = require('selection-update');

var infoIcon = require('./InfoIconFactory');

var TABLE_ROW_DIV_SNIPPET = '<div class="bpp-field-wrapper bpp-table-row proleit-accordion-row">';

function createInputRowTemplate(properties, element, canExpand) {
  var template = `<div class="bpp-field-wrapper bpp-table-row proleit-accordion-row"
    data-accordion-url="${element.accEntryPath}">`;
  template += createRowNameTemplate(properties.length + 1, element, canExpand);
  template += createInputTemplate(properties);
  template += '</div>';

  return template;
}

function createRowNameTemplate(columnCount, element, canExpand) {
  return `<div class="proleit-accordion-row-columns-${columnCount}
            proleit-accordion-row-name
            proleit-accordion-row-name-level-${element.accEntryLevel}"
            name="${element.name}-${element.accEntryLevel}">
            ${canExpand ? createExpandButton(element.accEntryIsExpanded) : ''}
            <span class="proleit-accordion-cell-text">
              ${element.name}${element.required ? '*' : ''}
            </span>
          </div>
  `;
}

function createExpandButton(isExpanded) {
  return `<button class="proleit-accordion-expand-btn ${isExpanded ? 'expanded' : 'collapsed'}"
            data-action="expandCollapsObject">
            <span class="proleit-accordion-expand-arrow">></span>
          </button>`;
}

function createInputTemplate(properties) {
  var columns = properties.length + 1;
  var template = '';
  forEach(properties, function(prop) {
    template += '<input class="bpp-table-row-columns-' + columns + ' ' +
                    'proleit-accordion-row-columns-' + columns + ' ' +
                    'proleit-accordion-cell-text" ' +
                  'id="camunda-table-row-cell-input-value" ' +
                  'type="text" ' +
                  'name="' + escapeHTML(prop) + '" />';
  });
  return template;
}

function createLabelRowTemplate(labels) {
  var template = TABLE_ROW_DIV_SNIPPET;
  template += createLabelTemplate(labels);
  template += '</div>';

  return template;
}

function createLabelTemplate(labels) {
  var columns = labels.length;
  var template = '';
  forEach(labels, function(label) {
    var labelText = typeof label === 'string' ? label : label.text;
    var infoText = typeof label === 'string' ? undefined : label.info;
    template += '<label class="bpp-table-row-columns-' + columns + ' ' +
      'proleit-accordion-row-columns-' + columns + '">' +
      escapeHTML(labelText) +
      (infoText ? infoIcon(infoText) : '') +
      '</label>';
  });
  return template;
}

function pick(element, properties) {
  var newElement = {};
  forEach(properties, function(property) {
    newElement[property] = element[property] || '';
  });
  return newElement;
}

function valueEqual(element, node, value, oldValue, editable, oldEntry) {
  if (value && !oldValue) {
    return false;
  }
  var allKeys = keys(value).concat(keys(oldValue));

  return allKeys.every(function(key) {
    var n = value[key] || undefined;
    var o = oldValue[key] || undefined;
    return !editable(element, node, key, oldEntry) || n === o;
  });
}

function getEntryNode(node) {
  return domClosest(node, '[data-entry]', true);
}

function getSelection(node) {
  return {
    start: node.selectionStart,
    end: node.selectionEnd
  };
}

function setSelection(node, selection) {
  node.selectionStart = selection.start;
  node.selectionEnd = selection.end;
}

function getExpandedChildElements(elements, accordionId, parentPath = '', accEntryLevel = 0) {
  var result = [];
  forEach(elements, function(element) {
    var accEntryPath = parentPath + '/' + element.name;
    var accEntryIsExpanded = !!element.children && accordionShouldElementExpand(accordionId, accEntryPath);
    result.push({...element, accEntryPath, accEntryLevel, accEntryIsExpanded });
    if (!accEntryIsExpanded) {
      return;
    }
    result.push(...getExpandedChildElements(element.children, accordionId, accEntryPath, accEntryLevel + 1));
  });
  return result;
}

function disableEnableEntryTooltip(event) {
  var accordionEntries = document.getElementsByClassName('proleit-accordion-cell-text');
  forEach(accordionEntries, function(accordionEntry) {
    if (accordionEntry.offsetWidth < accordionEntry.scrollWidth) {
      var titleValue = accordionEntry.tagName === 'INPUT'
        ? accordionEntry.value : accordionEntry.textContent;
      accordionEntry.setAttribute('title', titleValue);
    } else {
      accordionEntry.removeAttribute('title');
    }
  });
}

/////////////////////////////////////////////////////////////
//
// ACCORDION HANDLER - CURRENTLY ONLY ONE ACCORDION POSSIBLE
//
var accordionState = {};
function accordionShouldElementExpand(accordionId, path) {
  if (!accordionState[accordionId]) {
    accordionState[accordionId] = { triggerCount: 0 };
    return false;
  }
  return !!accordionState[accordionId][path];
}
function triggerAccordion(accordionId, path) {
  if (!accordionState[accordionId]) {
    accordionState[accordionId] = { triggerCount: 0 };
  }
  if (accordionState[accordionId][path]) {
    delete accordionState[accordionId][path];
  } else {
    accordionState[accordionId][path] = true;
  }
  accordionState[accordionId].triggerCount++;
}
function getTriggerCount(accordionId) {
  return accordionState[accordionId] ? accordionState[accordionId].triggerCount : 0;
}
//
// END OF ACCORDION FUNCTIONALITY
//
/////////////////////////////////////////////////////


/**
 * @param  {Object} options
 * @param  {string} options.id
 * @param  {string} options.description
 * @param  {Array<string>} options.modelProperties
 * @param  {Array<string>} options.labels
 * @param  {Function} options.getElements - this callback function must return a list of business object items
 * @param  {Function} options.removeElement
 * @param  {Function} options.updateElement
 * @param  {Function} options.editable
 * @param  {Function} options.setControlValue
 * @param  {Function} options.show
 *
 * @return {Object}
 */
module.exports = function(eventBus, options) {

  var id = options.id,
      modelProperties = options.modelProperties,
      nameLabel = options.nameLabel,
      labels = options.labels,
      description = options.description;

  var getElements = options.getElements;

  var editable = options.editable || function() { return true; },
      setControlValue = options.setControlValue;

  var show = options.show,
      canBeShown = typeof show === 'function';

  var labelRow = createLabelRowTemplate([nameLabel, ...labels]);

  var elements = function(element, node) {
    return getExpandedChildElements(getElements(element, node), id);
  };

  var updateElement = function(element, values, node) {
    var commands = [],
        oldEntries = elements(element, node);

    forEach(oldEntries, function(oldEntry, idx) {
      var newValue = values[idx];

      if (valueEqual(element, node, newValue, pick(oldEntry, modelProperties), editable, oldEntry)) {
        return;
      }

      var newElement = Object.assign(oldEntry, newValue);
      var cmd = oldEntry.update(newElement);
      if (cmd) {
        commands.push(cmd);
      }
    });

    return commands;
  }

  var factory = {
    id: id + getTriggerCount(id),
    html: 
      '<div class="bpp-table" data-show="showTable">' +
        '<div class="bpp-field-wrapper bpp-table-row">' +
            labelRow +
        '</div>' +
        '<div data-list-entry-container>' +
        '</div>' +
      '</div>' +

      // add description below table entry field
      (description ? entryFieldDescription(description) : ''),

    get: function(element, node) {
      var result = elements(element, node);
      return result;
    },

    set: function(element, values, node) {
      return updateElement(element, values, node);
    },

    createListEntryTemplate: function(value, index, selectBox) {
      var canExpand = !!value.children;
      return createInputRowTemplate(modelProperties, value, canExpand);
    },

    expandCollapsObject: function(element, node, event, scopeNode) {
      var entry = event.target.classList.contains('proleit-accordion-expand-arrow')
        ? event.target.parentNode : event.target;
      var expanded = entry.classList.contains('expanded');
      expanded ? entry.classList.replace('expanded', 'collapsed') : entry.classList.replace('collapsed', 'expanded');
      var accordionUrl = entry.parentNode.parentNode.getAttribute('data-accordion-url');
      triggerAccordion(id, accordionUrl);
      eventBus.fire('elementTemplates.changed');
      return false;
    },

    editable: function(element, rowNode, input, prop, value, idx) {
      var entryNode = getEntryNode(rowNode);
      var entry = elements(element, entryNode)[idx];
      return editable(element, entryNode, prop, entry);
    },

    show: function(element, entryNode, node, scopeNode) {
      entryNode = getEntryNode(entryNode);
      return show(element, entryNode, node, scopeNode);
    },

    showTable: function(element, entryNode, node, scopeNode) {
      entryNode = getEntryNode(entryNode);
      var elems = getElements(element, entryNode);
      return elems && elems.length && (!canBeShown || show(element, entryNode, node, scopeNode));
    },

    validateListItem: function(element, value, node, idx) {
      if (typeof options.validate === 'function') {
        return options.validate(element, value, node, idx);
      }
    }

  };

  // Update/set the selection on the correct position.
  // It's the same code like for an input value in the PropertiesPanel.js.
  if (setControlValue) {
    factory.setControlValue = function(element, rowNode, input, prop, value, idx) {
      var entryNode = getEntryNode(rowNode);

      var isReadOnly = domAttr(input, 'readonly');
      var oldValue = input.value;

      var selection;

      // prevents input fields from having the value 'undefined'
      if (value === undefined) {
        value = '';
      }

      // when the attribute 'readonly' exists, ignore the comparison
      // with 'oldValue' and 'value'
      if (!!isReadOnly && oldValue === value) {
        return;
      }

      // update selection on undo/redo
      if (document.activeElement === input) {
        selection = updateSelection(getSelection(input), oldValue, value);
      }

      setControlValue(element, entryNode, input, prop, value, idx);

      if (selection) {
        setSelection(input, selection);
      }

    };
  }

  window.removeEventListener('resize', disableEnableEntryTooltip);
  window.addEventListener('resize', disableEnableEntryTooltip);
  eventBus.off(['propertiesPanel.changed','propertiesPanel.resized'], disableEnableEntryTooltip);
  eventBus.on(['propertiesPanel.changed','propertiesPanel.resized'], disableEnableEntryTooltip);

  return factory;

};
