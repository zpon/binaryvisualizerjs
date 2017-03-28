# binaryvisualizerjs
Visualize binary data

##Build
```duo js/script.js```

##Types

    block - A wrapper containing a number of child elements
    value - An element containing a value
        expectedTextValue - The expected value (optional)
        expectedUIntValues - An array of accepted int values (optional)
        expectedUIntMinValue - Minimum expected int value (optional)
        expectedUIntMaxValue - Maximum expected int value (optional)
        size - The length of the value (required)
        valueType - Type to convert value into (optional)
            uint8,
            string
    flags - An element of flags
        size - The length of the element (required)
        flagMapping - Mapping between bit position and name (required)
    array - An array of simple elements
        elements - Number of elements in the array (required)
        elementSize - Size of each element (one value) / array of sizes (one value per element) (required)
        elementSizeMultiplier - Number to be multiplied to all values of elementSize (optional)

    General fields:
        name - The human readable name of the element (optional)
        id - Id of the value (optional)
