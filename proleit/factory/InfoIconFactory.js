'use strict';

var escapeHTML = require('../../lib/Utils').escapeHTML;

module.exports = function infoIcon(infoText = '') {
  var title = (!!infoText && infoText !== '') ? `title="${escapeHTML(infoText)}"` : '';
  var html = `
    <div class="proleit-info-icon-container" ${title}>i</div>
  `;

  return html;
}
