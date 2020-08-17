onmessage = function (e) {
    console.log("Data: ");
    console.log(e.data);

    let byteArray = e.data['byteArray'];
    let elementsPerLine = e.data['elementsPerLine'];
    let byteLength = e.data['byteLength'];

    let lastLineNumberString = (byteArray.byteLength - byteArray.byteLength % elementsPerLine).toString(16);
    let bufferStrOffset = '<div class="string_line" id="offset_0">' + lineFormatter(0, lastLineNumberString);
    let bufferStrHex = '<div class="hex_line" id="hex_0">';
    let bufferStrString = '<div class="char_line" id="char_0">';

    if (byteArray.byteLength == 0) {
        return;
    }
    let bytesPerPercent = byteLength / 100;

    let progress = 0;
    for (var j = 0; j < byteArray.byteLength; j++) {
        if (j % elementsPerLine === 0 && j !== 0) {
            bufferStrOffset += '</div><div class="string_line" id="offset_' + (j / elementsPerLine) + '">' + lineFormatter(j, lastLineNumberString);
            bufferStrHex += '</div><div class="hex_line" id="hex_' + (j / elementsPerLine) + '">';
            bufferStrString += '</div><div class="char_line" id="char_' + (j / elementsPerLine) + '">';
        }

        var hex = toHex(byteArray[j]);
        bufferStrHex += "<span class=\"hex_byte_element\" id=\"hex_byte_" + j + "\">" + hex + '</span>';

        var char = toChar(byteArray[j]);
        bufferStrString += "<span id=\"char_byte_" + j + "\">" + char + "</span>";

        progress++;
        if (progress > bytesPerPercent) {
            // Post status to main thread
            progressPct = (j / byteLength) * 100;
            postMessage({'progress': progressPct});
            progress = 0;
        }
    }
    bufferStrOffset += '</div>';
    bufferStrString += '</div>';
    bufferStrHex += '</div>';

    // Transfer result back to main thread
    postMessage({
        'offset': bufferStrOffset, 
        'hex_content': bufferStrHex,
        'string_content': bufferStrString
    });
}

function lineFormatter(i, lastLineNumberString) {
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
        } else if (char === '>') {
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