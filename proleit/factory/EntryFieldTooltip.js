'use strict';

var domify = require('min-dom').domify;

module.exports = function attachTooltip(entryHtml, querySelector, tooltipText) {
  var html = entryHtml;
  if (typeof html === 'string') {
    html = domify(html);
  }

  html.querySelectorAll(querySelector)
    .forEach(node => node.setAttribute('title', tooltipText));
  
  return html;
}
