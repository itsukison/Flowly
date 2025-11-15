Binding to data
Fill your data grid with various data structures, including an array of arrays or an array of objects.

On this page
Compatible data types
Array of arrays
Array of arrays with a selective display of columns
Array of objects
Array of objects with column as a function
Array of objects with column mapping
Array of objects with custom data schema
Function data source and schema
No data
Data-manipulating API methods
Understand binding as a reference
The data configuration option
The data-loading API methods
The data-modifying API methods
Working with a copy of data
Related API reference
Compatible data types
Array of arrays
Array of arrays is a good choice for the more grid-like scenarios where you need to provide the end user with permission to manipulate the grid, e.g., insert columns, delete rows, decorate cells, etc.

Tesla	Nissan	Toyota	Honda	Mazda	Ford
2017	10	11	12	13	15	16
2018	10	11	12	13	15	16
2019	10	11	12	13	15	16
2020	10	11	12	13	15	16
2021	10	11	12	13	15	16
A
B
C
D
E
F
G

Source code



Array of arrays with a selective display of columns
The following example shows how you would use the array of arrays with a selective display of columns. This scenario uses the same data source as in the previous example, this time omitting the Tesla column from the grid.

Nissan	Toyota	Honda	Mazda	Ford
2017	11	12	13	15	16
2018	11	12	13	15	16
2019	11	12	13	15	16
2020	11	12	13	15	16
2021	11	12	13	15	16
A
B
C
D
E
F

Source code



Array of objects
An array of objects can be used as a data source as follows:

1	Ted Right	
2	Frank Honest	
3	Joan Well	
4	Gail Polite	
5	Michael Fair	
A
B
C

Source code



Array of objects with column as a function
You can set the columns configuration option to a function. This is good practice when you want to bind data more dynamically.

1	Ted	Right	
2			
3	Joan	Well	
A
B
C
D

Source code



Array of objects with column mapping
In a scenario where you have nested objects, you can use them as the data source by mapping the columns using the columns option.

1	Ted	Right	
2			
3	Joan	Well	
A
B
C
D

Source code



Array of objects with custom data schema
When using object data binding, Handsontable needs to know what data structure to create when adding a new row. If your data source contains at least one row, Handsontable will figure out the data structure based on the first row.

In a scenario where you start with an empty data source, you will need to provide the dataSchema option containing the data structure for any new row added to the grid. The example below shows a custom data schema with an empty data source:

ID
First Name
Last Name
Address

Source code



Function data source and schema
If your dataSchema is a constructor of an object that doesn't directly expose its members, you can specify functions for the data member of each columns item.

The example below shows how to use such objects:

1	Ted Right	
2	Frank Honest	
3	Joan Well	
4	Gail Polite	
5	Michael Fair	
ID
Name
Address

Source code



No data
By default, if you don't provide any data, Handsontable renders as an empty 5x5 grid.


Source code



To change the number of rows or columns rendered by default, use the startRows and startCols options.

Data-manipulating API methods
Understand binding as a reference
Handsontable binds to your data source by reference, not by values. We don't copy the input dataset, and we rely on JavaScript to handle the objects. Any data entered into the grid will alter the original data source.

Handsontable initializes the source data for the table using a reference, but you shouldn't rely on it. For example, you shouldn't change values in the source data using the reference to the input dataset. Some mechanisms for handling data aren't prepared for external changes that are made in this way.

To avoid this scenario, copy the data before you pass it to the grid. To change the data from outside Handsontable, you can use our API methods. For example, a change being made will be displayed immediately on the screen after calling the setDataAtCell() method.

Ford	Nissan	Toyota	Honda	Mazda	Ford
2017	10	11	12	13	15	16
2018	10	11	12	13	15	16
2019	10	11	12	13	15	16
2020	10	11	12	13	15	16
2021	10	11	12	13	15	16

Source code



There are multiple ways you can insert your data into Handsontable. Let's go through the most useful ones:

The data configuration option
You will probably want to initialize the table with some data (if you don't, the table will render an empty 5x5 grid for you). The easiest way to do it is by passing your data array as the value of HotTable's data prop:

<HotTable data={newDataset} />

The data-loading API methods
To use the Handsontable API, you'll need access to the Handsontable instance. You can do that by utilizing a reference to the HotTable component, and reading its hotInstance property.

For more information, see the Instance methods page.

To replace the entire data in an already-initialized Handsontable instance, you can use one of the data-loading API methods:

loadData()
Replaces the data used in Handsontable with the dataset provided as the method argument.
Note: Since version 12.0.0 this method causes the table to reset its configuration options and index mapper information, so some of the work done on the table since its initialization might be lost.
hot.loadData(newDataset);

updateData()
Replaces the data used in Handsontable with the dataset provided as the method argument. Unlike loadData(), updateData() does NOT reset the configuration options and/or index mapper information, so it can be safely used to replace just the data, leaving the rest of the table intact.
hot.updateData(newDataset);

updateSettings()
Updates the configuration of the table, updateSettings() can be also used to replace the data being used. Since version 12.0.0, under the hood it utilizes the updateData() method to perform the data replacement (apart from the one automatic call done during the initialization, where it uses loadData()).
hot.updateSettings({
  data: newDataset,
  // ... other config options
});

The data-modifying API methods
To modify just a subset of data passed to Handsontable, these are the methods you might want to check out:

setDataAtCell()
Replaces data in a single cell or to perform a series of single-cell data replacements:

// Replaces the cell contents at the (0, 2) visual coordinates (0 being the visual row index, 2 - the visual column index) with the supplied value.
hot.setDataAtCell(0, 2, 'New Value');

// Replaces the cells at `(0,2)`, `(1,2)` and `(2,2)` with the provided values.
const changes = [
  [0, 2, 'New Value'],
  [1, 2, 'Different Value'],
  [2, 2, 'Third Replaced Value'],
];
hot.setDataAtCell(changes);

setDataAtRowProp()
Replaces data in a single cell or to perform a series of single-cell data replacements, analogously to setDataAtCell(), but allows targeting the cells by the visual row index and data row property. Useful for the Array of objects data type.

// Replaces the cell contents at the (0, 'title') coordinates (0 being the visual row index, 'title' - the data row object property) with the supplied value.
hot.setDataAtRowProp(0, 'title', 'New Value');

// Replaces the cells with the props of 'id', 'firstName' and 'lastName' in the first row with the provided values.
const changes = [
  [0, 'id', '22'],
  [0, 'firstName', 'John'],
  [0, 'lastName', 'Doe'],
];
hot.setDataAtRowProp(changes);

setSourceDataAtCell()
As the displayed data coordinates can differ from the way it's stored internally, sometimes you might need to target the cells more directly - that's when setSourceDataAtCell() comes in handy. The row and columns/prop arguments represent the physical indexes.

// Replaces the cell contents at the (0, 2) coordinates (0 being the physical row index, 2 - the physical column index) with the supplied value.
hot.setSourceDataAtCell(0, 2, 'New Value');

// Replaces the cell contents at the (0, 'title') coordinates (0 being the physical row index, 'title' - the data row property) with the supplied value.
hot.setSourceDataAtCell(0, 'title', 'New Value');

// Replaces the cells with the props of 'id', 'firstName' and 'lastName' in the first physical row with the provided values.
const changes = [
  [0, 'id', '22'],
  [0, 'firstName', 'John'],
  [0, 'lastName', 'Doe'],
];
hot.setSourceDataAtCell(changes);

populateFromArray()
Replaces a chunk of the dataset by provided the start (and optionally end) coordinates and a two-dimensional data array of new values.

The populateFromArray() method can't change read-only cells.

const newValues = [
  ['A', 'B', 'C'],
  ['D', 'E', 'F']
];

// Replaces the values from (1, 1) to (2, 3) visual cell coordinates with the values from the `newValues` array.
hot.populateFromArray(1, 1, newValues);

// Replaces the values from (1, 1) to (2, 2) visual cell coordinates with the values from the `newValues` array, ommiting the values that would fall outside of the defined range.
hot.populateFromArray(1, 1, newValues, 2, 2);

Working with a copy of data
When working with a copy of data for Handsontable, it is best practice is to clone the data source before loading it into Handsontable. This can be done with structuredClone(data) or legacy JSON.parse(JSON.stringify(data)) or another deep-cloning function.

Tesla	Nissan	Toyota	Honda	Mazda	Ford
2017	10	11	12	13	15	16
2018	10	11	12	13	15	16
2019	10	11	12	13	15	16
2020	10	11	12	13	15	16
2021	10	11	12	13	15	16

Source code



Related API reference
Configuration options:
data
dataSchema
Core methods:
alter()
clear()
getData()
getDataAtCell()
getDataAtCol()
getDataAtProp()
getDataAtRow()
getDataAtRowProp()
getSchema()
getSourceData()
getSourceDataArray()
getSourceDataAtCell()
getSourceDataAtCol()
getSourceDataAtRow()
loadData()
populateFromArray()
setDataAtCell()
setDataAtRowProp()
setSourceDataAtCell()
updateData()
updateSettings()
Hooks:
afterCellMetaReset
afterChange
afterLoadData
afterSetDataAtCell
afterSetDataAtRowProp
afterSetSourceDataAtCell
afterUpdateData
afterUpdateSettings
beforeLoadData
beforeUpdateData
modifyData
modifyRowData
modifySourceData