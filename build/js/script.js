(function outer(modules, cache, entries){

  /**
   * Global
   */

  var global = (function(){ return this; })();

  /**
   * Require `name`.
   *
   * @param {String} name
   * @api public
   */

  function require(name){
    if (cache[name]) return cache[name].exports;
    if (modules[name]) return call(name, require);
    throw new Error('cannot find module "' + name + '"');
  }

  /**
   * Call module `id` and cache it.
   *
   * @param {Number} id
   * @param {Function} require
   * @return {Function}
   * @api private
   */

  function call(id, require){
    var m = cache[id] = { exports: {} };
    var mod = modules[id];
    var name = mod[2];
    var fn = mod[0];
    var threw = true;

    try {
      fn.call(m.exports, function(req){
        var dep = modules[id][1][req];
        return require(dep || req);
      }, m, m.exports, outer, modules, cache, entries);
      threw = false;
    } finally {
      if (threw) {
        delete cache[id];
      } else if (name) {
        // expose as 'name'.
        cache[name] = cache[id];
      }
    }

    return cache[id].exports;
  }

  /**
   * Require all entries exposing them on global if needed.
   */

  for (var id in entries) {
    if (entries[id]) {
      global[entries[id]] = require(id);
    } else {
      require(id);
    }
  }

  /**
   * Duo flag.
   */

  require.duo = true;

  /**
   * Expose cache.
   */

  require.cache = cache;

  /**
   * Expose modules
   */

  require.modules = modules;

  /**
   * Return newest require.
   */

   return require;
})({
1: [function(require, module, exports) {
$(function () {
    var ptr = require('flitbit/json-ptr');
    var elementsPerLine = 16;
    var byteArray;
    var lastLineNumberString;
    var context = {
        renderData: [],
        schema: null
    };

    $('#content_wrapper').on('click', '.hex_byte_element_parsed', function () {
        var data = context.renderData[$(this).data('render-id')];
        console.log(data);
        var schemaElement = ptr.get(context.schema, data.path);
        console.log(schemaElement);
        $("#parsed_content").html("Begin: <span class=\"mono\">" + data.begin + "</span><br/>" +
            "End: <span class=\"mono\">" + data.end + "</span><br/>" +
            "Data: <span class=\"mono\">" + data.data + "</span></br>" +
            "Schema: <pre>" + JSON.stringify(schemaElement)) + "</pre>";
    });

    $('#input').change(function () {
        var selectedFile = $('#input')[0].files;
        var reader = new FileReader();
        reader.onload = function (e) {
            byteArray = new Uint8Array(reader.result.slice(0, reader.result.byteLength));
            console.log('File length: ' + reader.result.byteLength);

            lastLineNumberString = (byteArray.byteLength - byteArray.byteLength % elementsPerLine).toString(16);

            var bufferStrOffset = '<div class="string_line" id="offset_0">' + lineFormatter(0);
            var bufferStrHex = '<div class="hex_line" id="hex_0">';
            var bufferStrString = '<div class="char_line" id="char_0">';
            var progress = 0;
            var progressPercent = reader.result.byteLength / 100;

            byteArray = new Uint8Array(reader.result.slice(0, reader.result.byteLength));
            if (byteArray.byteLength == 0) {
                return;
            }

            for (var j = 0; j < byteArray.byteLength; j++) {
                if (j % elementsPerLine === 0 && j !== 0) {
                    bufferStrOffset += '</div><div class="string_line" id="offset_' + (j / elementsPerLine) + '">' + lineFormatter(j);
                    bufferStrHex += '</div><div class="hex_line" id="hex_' + (j / elementsPerLine) + '">';
                    bufferStrString += '</div><div class="char_line" id="char_' + (j / elementsPerLine) + '">';
                }

                var hex = toHex(byteArray[j]);
                bufferStrHex += "<span class=\"hex_byte_element\" id=\"hex_byte_" + j + "\">" + hex + '</span>';

                var char = toChar(byteArray[j]);
                bufferStrString += "<span id=\"char_byte_" + j + "\">" + char + "</span>";

                progress++;
                if (progress >= progressPercent) {
                    $('#progress').text('Progress: ' + (j / reader.result.byteLength) * 100);
                    progress = 0;
                }
            }
            bufferStrOffset += '</div>';
            bufferStrString += '</div>';
            bufferStrHex += '</div>';

            $('#offset')[0].innerHTML = bufferStrOffset;
            $('#hex_content')[0].innerHTML = bufferStrHex;
            $('#string_content')[0].innerHTML = bufferStrString;

            testSchema();
        };
        reader.readAsArrayBuffer(new Blob(selectedFile));
    });

    function lineFormatter(i) {
        var currentLineString = i.toString(16);
        for (var c = currentLineString.length; c < lastLineNumberString.length; c++) {
            currentLineString = "0" + currentLineString;
        }

        return currentLineString;
    }

    function toChar(i) {
        var char = '.';
        if (i >= 32 && i <= 126) {
            char = String.fromCharCode(i);
            if (char === '<') {
                char = '&lt;';
            }
            else if (char === '>') {
                char = '&gt;';
            }
        }

        return char;
    }

    function toHex(i) {
        var hex = i.toString(16);
        if (hex.length == 1) {
            hex = '0' + hex;
        }

        return hex;
    }

    function arrayToHexs(a) {
        var result = '';
        for (var i = 0; i < a.length; i++) {
            result += toHex(a[i]);
        }

        return result;
    }

    function arrayToChars(a) {
        var result = '';
        for (var i = 0; i < a.length; i++) {
            result += toChar(a[i]);
        }

        return result;
    }

    function arrayToBinaryStr(a) {
        var result = '0'.repeat(a.length * 8);
        for (var i = 0; i < a.length; i++) {
            var bin = a[i].toString(2);
            for (var j = 0; j < bin.length; j++) {
                result = replaceChar(result, bin.charAt(j), (a.length - i) * 8 - (bin.length - j));
            }
        }
        return result;
    }

    function replaceChar(str, char, pos) {
        return str.substr(0, pos) + char + str.substr(pos + 1);
    }

    function isDefined(o) {
        if (typeof o === 'undefined') {
            return false;
        } else {
            return true;
        }
    }

    /**
     * a Array of integers
     * e Element to locate (type is Uint8Array)
     */
    function arrayContains(a, e) {
        if (e.length > 1) {
            // TODO Handle longer elements
            console.assert(false);
        }

        for (var i = 0; i < a.length; i++) {
            if (a[i] == e[0]) {
                return true;
            }
        }
        return false;
    }

    function testSchema() {
        'use strict';
        var position = 0;
        context.schema = getSchema();
        console.log(context.schema.name);

        var componentList = context.schema.components;
        for (var ci in componentList) {
            var component = componentList[ci];
            console.log('Component type: ' + component.type);

            if (component.type == 'block') {

                let maxNumberOfElementsToParse = -1; // -1 means disabled
                while (position < byteArray.length) {
                    if (maxNumberOfElementsToParse == 0) {
                        return;
                    }
                    if (maxNumberOfElementsToParse > 0) {
                        maxNumberOfElementsToParse--;
                    }

                    if (component.position != 'relative') {
                        // TODO Handle non-relative positions
                        console.assert(false);
                    }
                    if (component.index != 0) {
                        // TODO Handle blocks with a non-0 index
                        console.assert(false);
                    }

                    var dataStructure = {};
                    for (var ei in component.elements) {
                        var element = component.elements[ei];

                        var data = null;
                        if (element.type == 'value') {
                            console.assert(position % 8 == 0, 'Handle position that does not allign with 8'); // TODO
                            var valueArray = byteArray.slice(position / 8, position / 8 + element.size / 8); // 8 bits per element
                            var prettyTextValue = arrayToChars(valueArray);
                            var prettyHexValue = arrayToHexs(valueArray);

                            console.log('Value' + ((element.hasOwnProperty('name')) ? ' (' + element.name + ')' : '') + ': ' +
                                prettyHexValue + ' (' + prettyTextValue + ') at position: ' + position);

                            if (element.hasOwnProperty('expectedTextValue')) {
                                console.log(' - Expected: ' + element.expectedTextValue);
                                console.assert(element.expectedTextValue === prettyTextValue, 'Value did not match expected content at position: ' + position);
                            }
                            else if (element.hasOwnProperty('expectedUIntValues')) {
                                var expectedUIntValues = element.expectedUIntValues.join(', ');
                                console.log(' - Expected: ' + expectedUIntValues);
                                console.assert(arrayContains(element.expectedUIntValues, valueArray), 'Value did not match expected content at position: ' + position);
                            }

                            if (element.valueType == 'uint8') {
                                data = valueArray[0];
                            }
                            else if (element.valueType == 'string') {
                                data = prettyTextValue;
                            }
                            else if (isDefined(element.valueType)) {
                                console.assert(false, 'Unknown value type: ' + element.valueType);
                            }
                            if (element.hasOwnProperty('id') && data != null) {
                                console.assert(element.hasOwnProperty('valueType'));
                                dataStructure[element.id] = data;
                            }

                            var beginPos = (position / 8);
                            var endPos = (position / 8 + element.size / 8 - 1);
                            context.renderData.push({
                                path: '/components/' + ci + '/elements/' + ei,
                                begin: beginPos,
                                end: endPos,
                                data: data
                            });
                            $("#hex_byte_" + beginPos).addClass("hex_byte_element_parsed_left");
                            $("#hex_byte_" + endPos).addClass("hex_byte_element_parsed_right");
                            for (var i = beginPos; i <= endPos; i++) {
                                $("#hex_byte_" + i).addClass("hex_byte_element_parsed");
                                $("#hex_byte_" + i).attr('data-render-id', context.renderData.length - 1);
                            }
                            position += element.size;
                        }
                        else if (element.type == 'flags') {
                            console.assert(position % 8 == 0, 'Handle position that does not allign with 8'); // TODO
                            var valueArray = byteArray.slice(position / 8, position / 8 + element.size / 8); // 8 bits per element
                            var prettyTextValue = arrayToChars(valueArray);
                            var prettyHexValue = arrayToHexs(valueArray);
                            var prettyBinary = arrayToBinaryStr(valueArray);

                            console.log('Flags' + ((element.hasOwnProperty('name')) ? ' (' + element.name + ')' : '') + ': ' +
                                prettyHexValue + ' (' + prettyTextValue + ') at position: ' + position);

                            // Print flags
                            var base = '-'.repeat(element.size);
                            for (var i = 0; i < element.size; i++) {
                                console.log(" " + replaceChar(base, prettyBinary.charAt(i), i) + " ... " + (element.flagMapping.hasOwnProperty(element.size - i) ? element.flagMapping[element.size - i] : "Unknown"));
                            }

                            let beginPos = (position / 8);
                            let endPos = (position / 8 + element.size / 8 - 1);
                            context.renderData.push({
                                path: '/components/' + ci + '/elements/' + ei,
                                begin: beginPos,
                                end: endPos,
                                data: data
                            });
                            $("#hex_byte_" + beginPos).addClass("hex_byte_element_parsed_left");
                            $("#hex_byte_" + endPos).addClass("hex_byte_element_parsed_right");
                            for (var i = beginPos; i <= endPos; i++) {
                                $("#hex_byte_" + i).addClass("hex_byte_element_parsed");
                                $("#hex_byte_" + i).attr('data-render-id', context.renderData.length - 1);
                            }
                            position += element.size;
                        }
                        else if (element.type == 'array') {
                            let beginPos = position / 8;
                            // Test required elements
                            console.assert(element.hasOwnProperty('elements'));
                            console.assert(element.hasOwnProperty('elementSize'));
                            // elements
                            var numberOfElements = ptr.get(dataStructure, element.elements);
                            console.assert(isDefined(numberOfElements));
                            // elementSizeMultiplier
                            var elementSizeMultiplier = 1;
                            if (element.hasOwnProperty('elementSizeMultiplier')) {
                                elementSizeMultiplier = element.elementSizeMultiplier;
                            }
                            // elementSize
                            var elementSize = element.elementSize;
                            if (typeof elementSize === 'number') {
                                // Value is already a number
                                console.assert(element.elementSize * elementSizeMultiplier % 8 == 0, "TODO Handle elmeents sizes that does not align with 8");
                            }
                            else if (typeof elementSize === 'string') {
                                elementSize = ptr.get(dataStructure, elementSize);
                            }
                            else {
                                console.log(false, 'Unknown type of elementSize: ' + typeof elementSize);
                            }
                            if (Array.isArray(elementSize)) {
                                console.assert(elementSize.length == numberOfElements);
                            }
                            console.assert(typeof elementSizeMultiplier === 'number');
                            // valueType
                            var valueType = null;
                            if (element.hasOwnProperty('valueType')) {
                                valueType = element.valueType;
                            }

                            console.log('Array' + ((element.hasOwnProperty('name')) ? ' (' + element.name + ')' : '') +
                                ' number of elements: ' + numberOfElements + ' at position: ' + position);

                            var content = [];
                            for (var i = 0; i < numberOfElements; i++) {
                                var currentElementSize = 0;
                                if (typeof elementSize == 'number') {
                                    currentElementSize = elementSize * elementSizeMultiplier;
                                }
                                else if (Array.isArray(elementSize)) {
                                    currentElementSize = elementSize[i] * elementSizeMultiplier;
                                }
                                else {
                                    console.assert(false, 'Unknown type of elementSize: ' + typeof elementSize);
                                }
                                console.assert(currentElementSize % 8 == 0, "TODO Handle elmeents sizes that does not align with 8, got value: " + currentElementSize);
                                var valueArray = byteArray.slice(position / 8, (position / 8) + (currentElementSize / 8));

                                content.push(valueArray);

                                // Print array element
                                // TODO print short arrays, i.e. arrays with one value in each element as one line, such as "Content: [x, y, z]"
                                // TODO print values as hex value
                                let arrLength = content[content.length - 1].length;
                                let contentStr = (arrLength > 10
                                    ? content[content.length - 1].slice(0, 3).join(',') + " ... " + (content[content.length - 1].slice(arrLength - 3, arrLength).join(','))
                                    : content[content.length - 1].join(','));
                                console.log(' - Content (' + arrLength + '): ' + contentStr);

                                position += currentElementSize;
                            }

                            if (element.hasOwnProperty('id')) {
                                dataStructure[element.id] = content;
                            }


                            var endPos = position / 8 - 1;//(position / 8 + element.size / 8 - 1);
                            context.renderData.push({
                                path: '/components/' + ci + '/elements/' + ei,
                                begin: beginPos,
                                end: endPos,
                                data: data
                            });
                            $("#hex_byte_" + beginPos).addClass("hex_byte_element_parsed_left");
                            $("#hex_byte_" + endPos).addClass("hex_byte_element_parsed_right");
                            for (var i = beginPos; i <= endPos; i++) {
                                $("#hex_byte_" + i).addClass("hex_byte_element_parsed");
                                $("#hex_byte_" + i).attr('data-render-id', context.renderData.length - 1);
                            }

                        }
                        else {
                            console.assert(false, 'Unknown type: ' + element.type);
                        }
                    }
                }
            }
            else {
                // TODO Handle other component types
                console.assert(false, component.type);
            }
        }
    }

    function getSchema() {
        var schema = {
            name: 'OGG',
            components: [
                {
                    type: 'block',
                    position: 'relative',
                    index: 0,
                    elements: [
                        {
                            name: 'Capture pattern',
                            type: 'value',
                            expectedTextValue: 'OggS',
                            valueType: 'string',
                            size: 32
                        },
                        {
                            name: 'Version',
                            type: 'value',
                            size: 8
                        },
                        {
                            name: 'Header type',
                            type: 'flags',
                            size: 8,
                            flagMapping: {
                                1: 'Continuation',
                                2: 'BOS',
                                3: 'EOS'
                            }
                        },
                        {
                            name: 'Granule position',
                            type: 'value',
                            size: 64
                        },
                        {
                            name: 'Bistream serial number',
                            type: 'value',
                            size: 32
                        },
                        {
                            name: 'Page sequence number',
                            type: 'value',
                            size: 32
                        },
                        {
                            name: 'Checksum',
                            type: 'value',
                            size: 32
                        },
                        {
                            id: 'page_segments',
                            name: 'Page segments',
                            type: 'value',
                            size: 8,
                            valueType: 'uint8'
                        },
                        {
                            id: 'segment_table',
                            name: 'Segment table',
                            type: 'array',
                            elements: '/page_segments',
                            elementSize: 8,
                            valueType: 'uint8'
                        },
                        {
                            id: 'packet_table',
                            name: 'Packet table',
                            type: 'array',
                            elements: '/page_segments',
                            elementSize: '/segment_table',
                            elementSizeMultiplier: 8
                        }
                    ]
                }
            ]
        }

        return schema;
    }
});
}, {"flitbit/json-ptr":2}],
2: [function(require, module, exports) {
'use strict';

(function() {
  var root = this; // either the module or the window (in a browser)
  var savedJsonPointer = root.JsonPointer;

  function replace(str, find, repl) {
    // modified from http://jsperf.com/javascript-replace-all/10
    var orig = str.toString();
    var res = '';
    var rem = orig;
    var beg = 0;
    var end = -1;
    while ((end = rem.indexOf(find)) > -1) {
      res += orig.substring(beg, beg + end) + repl;
      rem = rem.substring(end + find.length, rem.length);
      beg += end + find.length;
    }
    if (rem.length > 0) {
      res += orig.substring(orig.length - rem.length, orig.length);
    }
    return res;
  }

  function decodeFragmentSegments(segments) {
    var i = -1;
    var len = segments.length;
    var res = new Array(len);
    while (++i < len) {
      res[i] = replace(replace(decodeURIComponent('' + segments[i]), '~1', '/'), '~0', '~');
    }
    return res;
  }

  function encodeFragmentSegments(segments) {
    var i = -1;
    var len = segments.length;
    var res = new Array(len);
    while (++i < len) {
      if (typeof segments[i] === 'string') {
        res[i] = encodeURIComponent(replace(replace(segments[i], '~', '~0'), '/', '~1'));
      } else {
        res[i] = segments[i];
      }
    }
    return res;
  }

  function decodePointerSegments(segments) {
    var i = -1;
    var len = segments.length;
    var res = new Array(len);
    while (++i < len) {
      res[i] = replace(replace(segments[i], '~1', '/'), '~0', '~');
    }
    return res;
  }

  function encodePointerSegments(segments) {
    var i = -1;
    var len = segments.length;
    var res = new Array(len);
    while (++i < len) {
      if (typeof segments[i] === 'string') {
        res[i] = replace(replace(segments[i], '~', '~0'), '/', '~1');
      } else {
        res[i] = segments[i];
      }
    }
    return res;
  }

  function decodePointer(ptr) {
    if (typeof ptr !== 'string') {
      throw new TypeError('Invalid type: JSON Pointers are represented as strings.');
    }
    if (ptr.length === 0) {
      return [];
    }
    if (ptr[0] !== '/') {
      throw new ReferenceError('Invalid JSON Pointer syntax. Non-empty pointer must begin with a solidus `/`.');
    }
    return decodePointerSegments(ptr.substring(1).split('/'));
  }

  function encodePointer(path) {
    if (path && !Array.isArray(path)) {
      throw new TypeError('Invalid type: path must be an array of segments.');
    }
    if (path.length === 0) {
      return '';
    }
    return '/'.concat(encodePointerSegments(path).join('/'));
  }

  function decodeUriFragmentIdentifier(ptr) {
    if (typeof ptr !== 'string') {
      throw new TypeError('Invalid type: JSON Pointers are represented as strings.');
    }
    if (ptr.length === 0 || ptr[0] !== '#') {
      throw new ReferenceError('Invalid JSON Pointer syntax; URI fragment idetifiers must begin with a hash.');
    }
    if (ptr.length === 1) {
      return [];
    }
    if (ptr[1] !== '/') {
      throw new ReferenceError('Invalid JSON Pointer syntax.');
    }
    return decodeFragmentSegments(ptr.substring(2).split('/'));
  }

  function encodeUriFragmentIdentifier(path) {
    if (path && !Array.isArray(path)) {
      throw new TypeError('Invalid type: path must be an array of segments.');
    }
    if (path.length === 0) {
      return '#';
    }
    return '#/'.concat(encodeFragmentSegments(path).join('/'));
  }

  function toArrayIndexReference(arr, idx) {
    var len = idx.length;
    var cursor = 0;
    if (len === 0 || len > 1 && idx[0] === '0') {
      return -1;
    }
    if (len === 1 && idx[0] === '-') {
      return arr.length;
    }

    while (++cursor < len) {
      if (idx[cursor] < '0' || idx[cursor] > '9') {
        return -1;
      }
    }
    return parseInt(idx, 10);
  }

  function hasValueAtPath(target, path) {
    var it;
    var len;
    var cursor;
    var step;
    var p;
    if (typeof target !== 'undefined') {
      it = target;
      len = path.length;
      cursor = -1;
      if (len) {
        while (++cursor < len && it) {
          step = path[cursor];
          if (Array.isArray(it)) {
            if (isNaN(step) || !isFinite(step)) {
              break;
            }
            p = toArrayIndexReference(it, step);
            if (it.length > p) {
              it = it[p];
            } else {
              break;
            }
          } else {
            it = it[step];
          }
        }
      }
      return cursor === len && typeof it !== 'undefined';
    }
    return false;
  }

  function getValueAtPath(target, path) {
    var it;
    var len;
    var cursor;
    var step;
    var p;
    var nonexistent = undefined;
    if (typeof target !== 'undefined') {
      it = target;
      len = path.length;
      cursor = -1;
      if (len) {
        while (++cursor < len && it) {
          step = path[cursor];
          if (Array.isArray(it)) {
            if (isNaN(step) || !isFinite(step)) {
              return nonexistent;
            }
            p = toArrayIndexReference(it, step);
            if (it.length > p) {
              it = it[p];
            } else {
              return nonexistent;
            }
          } else {
            it = it[step];
          }
        }
      }
      return it;
    }
    return nonexistent;
  }

  function compilePointerDereference(path) {
    let body = `if (typeof(obj) !== 'undefined'`;
    if (path.length === 0) {
      return function(root) {
        return root;
      };
    }
    body = path.reduce((body, p, i) => {
      return `${body} &&
    typeof((obj = obj['${replace(path[i], '\\', '\\\\')}'])) !== 'undefined'`;
    }, `if (typeof(obj) !== 'undefined'`);
    body = `${body}) {
  return obj;
}`;
    return new Function(['obj'], body); // eslint-disable-line no-new-func
  }

  function setValueAtPath(target, val, path, force) {
    var it;
    var len;
    var end;
    var cursor;
    var step;
    var p;
    var rem;
    var nonexistent = undefined;
    if (path.length === 0) {
      throw new Error('Cannot set the root object; assign it directly.');
    }
    if (typeof target === 'undefined') {
      throw TypeError('Cannot set values on undefined');
    }
    it = target;
    len = path.length;
    end = path.length - 1;
    cursor = -1;
    if (len) {
      while (++cursor < len) {
        step = path[cursor];
        if (Array.isArray(it)) {
          p = toArrayIndexReference(it, step);
          if (it.length > p) {
            if (cursor === end) {
              rem = it[p];
              it[p] = val;
              return rem;
            }
            it = it[p];
          } else if (it.length === p) {
            it.push(val);
            return nonexistent;
          }
        } else {
          if (typeof it[step] === 'undefined') {
            if (force) {
              if (cursor === end) {
                it[step] = val;
                return nonexistent;
              }
              it = it[step] = {};
              continue;
            }
            return nonexistent;
          }
          if (cursor === end) {
            rem = it[step];
            it[step] = val;
            return rem;
          }
          it = it[step];
        }
      }
    }
    return it;
  }

  function looksLikeFragment(ptr) {
    return ptr && ptr.length && ptr[0] === '#';
  }

  function pickDecoder(ptr) {
    return (looksLikeFragment(ptr)) ? decodeUriFragmentIdentifier : decodePointer;
  }

  let $path = Symbol();
  let $orig = Symbol();
  let $pointer = Symbol();
  let $fragmentId = Symbol();

  class JsonPointer {

    constructor(ptr) {
      this[$orig] = ptr;
      this[$path] = (Array.isArray(ptr)) ? ptr : pickDecoder(ptr)(ptr);
      Object.defineProperty(this, 'get', {
        enumerable: true,
        value: compilePointerDereference(this.path)
      });
    }

    get path() {
      return this[$path];
    }

    get pointer() {
      if (!this[$pointer]) {
        this[$pointer] = encodePointer(this.path);
      }
      return this[$pointer];
    }

    get uriFragmentIdentifier() {
      if (!this[$fragmentId]) {
        this[$fragmentId] = encodeUriFragmentIdentifier(this.path);
      }
      return this[$fragmentId];
    }

    has(target) {
      return typeof(this.get(target)) != 'undefined';
    }

  }

  class JsonReference {

    constructor(pointer) {
      this[$pointer] = pointer;
    }

    get $ref() {
      return this[$pointer].uriFragmentIdentifier;
    }

    resolve(target) {
      return this[$pointer].get(target);
    }

    toString() {
      return this.$ref;
    }

  }

  JsonReference.isReference = function(obj) {
    return obj && obj instanceof JsonReference ||
      (typeof obj.$ref === 'string' &&
        typeof obj.resolve === 'function');
  };

  function visit(target, visitor, cycle) {
    var items, i, ilen, j, jlen, it, path, cursor, typeT;
    var distinctObjects;
    var q = new Array();
    var qcursor = 0;
    q.push({
      obj: target,
      path: []
    });
    if (cycle) {
      distinctObjects = new Map();
    }
    visitor(encodePointer([]), target);
    while (qcursor < q.length) {
      cursor = q[qcursor++];
      typeT = typeof cursor.obj;
      if (typeT === 'object' && cursor.obj !== null) {
        if (Array.isArray(cursor.obj)) {
          j = -1;
          jlen = cursor.obj.length;
          while (++j < jlen) {
            it = cursor.obj[j];
            path = cursor.path.concat(j);
            if (typeof it === 'object' && it !== null) {
              if (cycle && distinctObjects.has(it)) {
                visitor(encodePointer(path), new JsonReference(distinctObjects.get(it)));
                continue;
              }
              q.push({
                obj: it,
                path: path
              });
              if (cycle) {
                distinctObjects.set(it, new JsonPointer(encodeUriFragmentIdentifier(path)));
              }
            }
            visitor(encodePointer(path), it);
          }
        } else {
          items = Object.keys(cursor.obj);
          ilen = items.length;
          i = -1;
          while (++i < ilen) {
            it = cursor.obj[items[i]];
            path = cursor.path.concat(items[i]);
            if (typeof it === 'object' && it !== null) {
              if (cycle && distinctObjects.has(it)) {
                visitor(encodePointer(path), new JsonReference(distinctObjects.get(it)));
                continue;
              }
              q.push({
                obj: it,
                path: path
              });
              if (cycle) {
                distinctObjects.set(it, new JsonPointer(encodeUriFragmentIdentifier(path)));
              }
            }
            visitor(encodePointer(path), it);
          }
        }
      }
    }
  }

  JsonPointer.prototype.set = function(target, value, force) {
    return setValueAtPath(target, value, this.path, force);
  };

  JsonPointer.prototype.toString = function() {
    return this.original;
  };

  JsonPointer.create = function(ptr) {
    return new JsonPointer(ptr);
  };

  JsonPointer.has = function(target, ptr) {
    return hasValueAtPath(target, pickDecoder(ptr)(ptr));
  };

  JsonPointer.get = function(target, ptr) {
    return getValueAtPath(target, pickDecoder(ptr)(ptr));
  };

  JsonPointer.set = function(target, ptr, val, force) {
    return setValueAtPath(target, val, pickDecoder(ptr)(ptr), force);
  };

  JsonPointer.list = function(target, fragmentId) {
    var res = [];
    var visitor = (fragmentId) ?
      function(ptr, val) {
        res.push({
          fragmentId: encodeUriFragmentIdentifier(decodePointer(ptr)),
          value: val
        });
      } :
      function(ptr, val) {
        res.push({
          pointer: ptr,
          value: val
        });
      };
    visit(target, visitor);
    return res;
  };

  JsonPointer.flatten = function(target, fragmentId) {
    var res = {};
    var visitor = (fragmentId) ?
      function(ptr, val) {
        res[encodeUriFragmentIdentifier(decodePointer(ptr))] = val;
      } :
      function(ptr, val) {
        res[ptr] = val;
      };
    visit(target, visitor);
    return res;
  };

  JsonPointer.map = function(target, fragmentId) {
    var res = new Map();
    var visitor = (fragmentId) ?
      function(ptr, val) {
        res.set(encodeUriFragmentIdentifier(decodePointer(ptr)), val);
      } : res.set.bind(res);
    visit(target, visitor);
    return res;
  };

  JsonPointer.visit = visit;

  JsonPointer.decode = function(ptr) {
    return pickDecoder(ptr)(ptr);
  };

  JsonPointer.decodePointer = decodePointer;
  JsonPointer.encodePointer = encodePointer;
  JsonPointer.decodeUriFragmentIdentifier = decodeUriFragmentIdentifier;
  JsonPointer.encodeUriFragmentIdentifier = encodeUriFragmentIdentifier;

  JsonPointer.JsonReference = JsonReference;
  JsonPointer.isReference = JsonReference.isReference;

  JsonPointer.noConflict = function() {
    root.JsonPointer = savedJsonPointer;
    return JsonPointer;
  };

  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = JsonPointer;
    }
    exports.JsonPointer = JsonPointer;
  } else {
    root.JsonPointer = JsonPointer;
  }
}).call(Function('return this')()); // eslint-disable-line no-new-func

}, {}]}, {}, {"1":""})