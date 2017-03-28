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