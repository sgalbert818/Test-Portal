// make sorting visible on tables, add column lines

const baseUrl = 'https://k2q0f43wl3.execute-api.us-west-2.amazonaws.com/test/aelid_test';

const tablesDiv = document.querySelector('.tables');
const filtersDiv = document.querySelector('.filters');
const dataGrid = document.querySelector('#data-grid');
let selectedTables = [];
let availableFilters = [];
let unavailableFilters = [];
const myAggregates = {
    'AVG': 'Average',
    'MAX': 'Maximum',
    'MIN': 'Minimum',
    'SUM': 'Sum',
}

async function requestData(endpoint, requestBody) {
    try {
        const response = await fetch(`${baseUrl + endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        if (!response.ok) {
            const errorMessage = 'Error: ' + response.status;
            throw new Error(errorMessage);
        }
        const data = await response.json();
        return data;
    } catch(error) {
        alert(error.message);
    }
}

export function test() {
    console.log('hi');
}

export async function setUpPage() {
    const setUpData = await requestData('/get_query_tool_info', {
        'args': {
        }
    });
    setUpFilters(setUpData);
    setUpTables(setUpData);
    submitEventListener(setUpData);
    downloadEventListener();
}

window.onload = function () {
    setUpPage();
}

// SET UP TABLES

function setUpTables(object) {
    object.Tables.forEach((table) => {
        table.Name = table.Name.split('_').join('-').toLowerCase();
        const tableDiv = document.createElement('div');
        tableDiv.classList.add('table');
        const tableCheckBox = document.createElement('input');
        tableCheckBox.classList.add('table-checkboxes');
        tableCheckBox.classList.add('clickable-query-option');
        const tableCheckBoxLabel = document.createElement('label');
        buildCheckBox(tableCheckBox, tableCheckBoxLabel, table.Name, table.Name, table.Name, tableDiv, table.Name);
        tablesDiv.appendChild(tableDiv);
        const columnsDiv = document.createElement('div');
        columnsDiv.classList.add('columns');
        columnsDiv.setAttribute('id', `${table.Name}-columns`);
        tableDiv.appendChild(columnsDiv);
        setUpColumns(table, columnsDiv, object);
        addTableCheckBoxEventListeners(tableCheckBox, object);
    })
}

function setUpColumns(table, parentDiv, object) {
    table.Columns.forEach((column) => {
        column.Name = column.Name.split('_').join('-').toLowerCase();
        const columnCheckBox = document.createElement('input');
        columnCheckBox.classList.add(`${table.Name}-column`)
        columnCheckBox.classList.add('clickable-query-option');
        const columnCheckBoxLabel = document.createElement('label');
        buildCheckBox(columnCheckBox, columnCheckBoxLabel, `${table.Name}-${column.Name}`, column.Name, `${table.Name}-columns`, parentDiv, column.Name.split('-').join(' '));
        parentDiv.appendChild(document.createElement('br'));
        const aggregatesDiv = document.createElement('div');
        aggregatesDiv.classList.add('aggregates');
        aggregatesDiv.setAttribute('id', `${table.Name}-${column.Name}-aggregates`);
        parentDiv.appendChild(aggregatesDiv);
        setUpAggregates(table, column, aggregatesDiv)
        addColumnCheckBoxEventListeners(columnCheckBox, table, object);
    })
}

function setUpAggregates(table, column, parentDiv) {
    column.Agg_Methods.forEach((method) => {
        const aggregateButton = document.createElement('input');
        aggregateButton.classList.add(`${column.Name}-aggregate`)
        aggregateButton.classList.add('clickable-query-option');
        aggregateButton.setAttribute('type', 'radio');
        aggregateButton.setAttribute('id', `${table.Name}-${column.Name}-${method}`);
        aggregateButton.setAttribute('name', `${column.Name}-aggregates`);
        aggregateButton.setAttribute('value', `${method}`);
        if (method == column.Agg_Methods[0]) {
            aggregateButton.setAttribute('checked', 'true');
        }
        const aggregateLabel = document.createElement('label');
        aggregateLabel.setAttribute('for', `${column.Name}-${method}`);
        aggregateLabel.innerText = myAggregates[method];
        parentDiv.appendChild(aggregateButton);
        parentDiv.appendChild(aggregateLabel);
        parentDiv.appendChild(document.createElement('br'));
    })
    const ignoreNullsBox = document.createElement('input');
    ignoreNullsBox.classList.add('ignore-nulls');
    ignoreNullsBox.classList.add('clickable-query-option');
    const ignoreNullsLabel = document.createElement('label');
    buildCheckBox(ignoreNullsBox, ignoreNullsLabel, `${column.Name}-ignore-nulls`, `true`, `${column.Name}-ignore-nulls`, parentDiv, 'Ignore Nulls')
}

function addTableCheckBoxEventListeners(target, object) {
    target.addEventListener('click', function () {
        if (this.checked) {
            document.querySelector(`#${this.value}-columns`).style.display = 'block'
            selectedTables.push(this.value);
            checkForCommonTables(selectedTables, object);
            revealButtons(object);
        } else {
            document.querySelector(`#${this.value}-columns`).style.display = 'none'
            selectedTables.splice(selectedTables.indexOf(this.value), 1);
            checkForCommonTables(selectedTables, object);
            revealButtons(object);
        }
    })
}

function addColumnCheckBoxEventListeners(target, table, object) {
    target.addEventListener('click', function () {
        if (this.checked) {
            document.querySelector(`#${table.Name}-${this.value}-aggregates`).style.display = 'block'
            revealButtons(object);
        } else {
            document.querySelector(`#${table.Name}-${this.value}-aggregates`).style.display = 'none'
            revealButtons(object);
        }
    })
}

function checkForCommonTables(array, object) { // checks for common filter options depending on selected tables
    disableAllFilters();
    availableFilters = [];
    unavailableFilters = [];
    object.Metadata.forEach((filter) => {
        if (array.every(tableName => filter.OwnedBy.includes(tableName))) {
            availableFilters.push(filter.Name.split('_').join('-').toLowerCase());
        } else {
            unavailableFilters.push(filter.Name.split('_').join('-').toLowerCase());
        }
    })
    if (selectedTables.length > 0) {
        availableFilters.forEach((filter) => {
            document.querySelector(`#${filter}`).removeAttribute('disabled');
            document.querySelector(`#${filter}-checkbox-label`).classList.remove('disabled');
        })
        unavailableFilters.forEach((filter) => {
            document.querySelector(`#${filter}`).checked = false;
            document.querySelector(`#${filter}-filter-selections`).style.display = 'none'
        })
    } else {
        availableFilters.forEach((filter) => {
            document.querySelector(`#${filter}`).checked = false;
            document.querySelector(`#${filter}-filter-selections`).style.display = 'none'
        })
    }
}

function revealButtons(object) {
    let tableCounter = 0;
    let filterCounter = 0;
    let columnCounter = 0;
    let filterValueCounter = 0;
    const tableCheckboxes = document.querySelectorAll('.table-checkboxes');
    const filterCheckboxes = document.querySelectorAll('.filter-checkboxes');
    tableCheckboxes.forEach((checkbox) => {
        if (checkbox.checked) {
            tableCounter++
        }
    })
    object.Tables.forEach((table) => {
        if (document.querySelector(`#${table.Name}`).checked) {
            let counter = 0;
            let columns = document.querySelectorAll(`.${table.Name}-column`);
            columns.forEach((column) => {
                if (column.checked) {
                    counter++;
                }
            })
            if (counter == 0) {
                columnCounter++
            }
        }
    })
    filterCheckboxes.forEach((checkbox) => {
        if (checkbox.checked) {
            filterCounter++
        }
    })
    object.Metadata.forEach((filter) => {
        if ((document.querySelector(`#${filter.Name}`).checked) && (filter.Name !== 'survey-date') && (filter.Values.length > 0)) {
            let counter = 0;
            let filters = document.querySelectorAll(`.${filter.Name}-value-box`);
            filters.forEach((box) => {
                if (box.checked) {
                    counter++;
                }
            })
            if (counter == 0) {
                filterValueCounter++
            }
        }
    })
    
    if ((tableCounter == 0) || (filterCounter == 0) || (columnCounter !== 0) || (filterValueCounter !== 0)) {
        document.querySelector(`#query-tool-form-view`).setAttribute('disabled', '');
    } else {
        document.querySelector(`#query-tool-form-view`).removeAttribute('disabled');
    }
}

// SET UP FILTERS

function disableAllFilters() {
    document.querySelectorAll('.filter-checkboxes').forEach((checkbox) => {
        checkbox.setAttribute('disabled', '');
    })
    document.querySelectorAll('.filter-checkbox-labels').forEach((label) => {
        label.classList.add('disabled');
    })
}

function setUpFilters(object) {
    object.Metadata.forEach((filter) => {
        filter.Name = filter.Name.split('_').join('-').toLowerCase();
        const filterDiv = document.createElement('div');
        filterDiv.classList.add('filter');
        filterDiv.setAttribute('id', `${filter.Name}-filter`);
        const filterCheckBox = document.createElement('input');
        filterCheckBox.classList.add('filter-checkboxes');
        filterCheckBox.classList.add('clickable-query-option');
        const filterCheckBoxLabel = document.createElement('label');
        filterCheckBoxLabel.setAttribute('id', `${filter.Name}-checkbox-label`);
        filterCheckBoxLabel.classList.add('filter-checkbox-labels');
        buildCheckBox(filterCheckBox, filterCheckBoxLabel, filter.Name, filter.Name, filter.Name, filterDiv, filter.Name.split('-').join(' ').toLowerCase());
        filtersDiv.appendChild(filterDiv);
        const filterSelectionsDiv = document.createElement('div');
        filterSelectionsDiv.classList.add('filter-selections');
        filterSelectionsDiv.setAttribute('id', `${filter.Name}-filter-selections`);
        filterDiv.appendChild(filterSelectionsDiv);
        setUpFilterSelections(filter, filterSelectionsDiv, object)
        addFilterCheckBoxEventListeners(filterCheckBox, object);
    })
    disableAllFilters();
}

function setUpFilterSelections(filter, parentDiv, object) {
    if (filter.Name == 'survey-date') {
        buildDateFilter(filter, parentDiv);
    } else {
        filter.Values.forEach((value) => {
            const filterValueBox = document.createElement('input');
            filterValueBox.classList.add(`${filter.Name}-value-box`)
            filterValueBox.classList.add('clickable-query-option');
            const filterValueLabel = document.createElement('label');
            buildCheckBox(filterValueBox, filterValueLabel, `${filter.Name}-${value}`, `${value}`, filter.Name, parentDiv, value);
            addFilterValueEventListeners(filterValueBox, object);
            parentDiv.appendChild(document.createElement('br'));
        })
    }
}

function buildDateFilter(filter, parentDiv) { // builds date filter
    const dateFilterDiv = document.createElement('div');
    dateFilterDiv.setAttribute('id', 'date-filter-div');
    const startDateLabel = document.createElement('label');
    startDateLabel.setAttribute('for', 'start-date');
    startDateLabel.innerText = 'start date:'
    const startDate = document.createElement('input');
    startDate.setAttribute('type', 'date');
    startDate.setAttribute('id', 'start-date');
    startDate.setAttribute('name', 'start');
    startDate.setAttribute('value', filter.Min)
    startDate.setAttribute('min', filter.Min)
    startDate.setAttribute('max', filter.Max)
    const endDateLabel = document.createElement('label');
    endDateLabel.setAttribute('for', 'end-date');
    endDateLabel.innerText = 'end date:'
    const endDate = document.createElement('input');
    endDate.setAttribute('type', 'date');
    endDate.setAttribute('id', 'end-date');
    endDate.setAttribute('name', 'end');
    endDate.setAttribute('value', filter.Max)
    endDate.setAttribute('min', filter.Min)
    endDate.setAttribute('max', filter.Max)
    addDateEventListeners(startDate, endDate);
    dateFilterDiv.appendChild(startDateLabel);
    dateFilterDiv.appendChild(startDate);
    dateFilterDiv.appendChild(document.createElement('br'));
    dateFilterDiv.appendChild(endDateLabel);
    dateFilterDiv.appendChild(endDate);
    parentDiv.appendChild(dateFilterDiv);
}

function addDateEventListeners(start, end) {
    start.addEventListener('change', function() {
        document.querySelector(`#query-tool-form-download`).setAttribute('disabled', '');
        if (start.value > end.value) {
            end.value = start.value;
        }
    })
    end.addEventListener('change', function() {
        document.querySelector(`#query-tool-form-download`).setAttribute('disabled', '');
        if (end.value < start.value) {
            start.value = end.value;
        }
    })
}

function addFilterCheckBoxEventListeners(target, object) {
    target.addEventListener('click', function () {
        if (this.checked) {
            document.querySelector(`#${this.value}-filter-selections`).style.display = 'block'
            revealButtons(object);
        } else {
            document.querySelector(`#${this.value}-filter-selections`).style.display = 'none'
            revealButtons(object);
        }
    })
}

function addFilterValueEventListeners(target, object) {
    target.addEventListener('click', function () {
        revealButtons(object);
    })
}

// SET UP FUNCTIONS

function buildCheckBox(checkbox, label, idFor, value, nameVar, parentDiv, innerText) {
    checkbox.setAttribute('type', 'checkbox');
    checkbox.setAttribute('id', idFor);
    checkbox.setAttribute('value', value);
    checkbox.setAttribute('name', nameVar);
    label.setAttribute('for', idFor);
    label.innerText = innerText;
    parentDiv.appendChild(checkbox);
    parentDiv.appendChild(label);
}

function downloadEventListener() {
    const clickables = document.querySelectorAll('.clickable-query-option');
    clickables.forEach((item) => {
        item.addEventListener('click', function() {
            document.querySelector(`#query-tool-form-download`).setAttribute('disabled', '');
        })
    })
}


// SUBMITTING FORM

function gatherReturnTableData(object) {
    query_args = {
        meta_columns: [],
        fields: [],
    };
    const tables = document.querySelectorAll('.table-checkboxes');
    tables.forEach((checkbox) => {
        if (checkbox.checked) {
            const newFieldsObject = {
                table: checkbox.value.split('-').join('_'),
                columns: []
            }
            document.querySelectorAll(`.${checkbox.value}-column`).forEach((column) => {
                if (column.checked) {
                    const newColumnsObject = {
                        name: column.value.split('-').join('_'),
                        agg_method: '',
                        ignore_nulls: '',
                    };
                    document.querySelectorAll(`.${column.value}-aggregate`).forEach((aggregate) => {
                        if (aggregate.checked) {
                            newColumnsObject.agg_method = aggregate.value;
                        }
                    })
                    if (document.querySelector(`#${column.value}-ignore-nulls`).checked) {
                        newColumnsObject.ignore_nulls = 'true';
                    } else {
                        newColumnsObject.ignore_nulls = 'false';
                    }
                    newFieldsObject.columns.push(newColumnsObject);
                }
            })
            query_args.fields.push(newFieldsObject);
        }
    })
    return query_args;
};

function gatherReturnFilterData(object) {
    const query_args = gatherReturnTableData(object);
    const filters = document.querySelectorAll('.filter-checkboxes');
    filters.forEach((checkbox) => {
        if (checkbox.checked) {
            let newMetaObject = {};
            if (checkbox.value == 'survey-date') {
                newMetaObject = {
                    name: checkbox.value.split('-').join('_'),
                    min: document.querySelector('#start-date').value,
                    max: document.querySelector('#end-date').value,
                    group_by_week: 'False',
                }
            } else {
                newMetaObject = {
                    name: checkbox.value.split('-').join('_'),
                    values: [],
                }
                document.querySelectorAll(`.${checkbox.value}-value-box`).forEach((value) => {
                    if (value.checked) {
                        newMetaObject.values.push(value.value);
                    }
                })
            }
            query_args.meta_columns.push(newMetaObject);
        }
    })
    return query_args;
}

let query_args;
let gridOptions = {};

function submitEventListener(object) {
    document.querySelector('#query-tool-form').addEventListener("submit", async function (e) {
        e.preventDefault();
        let requestBody = gatherReturnFilterData(object);
        const data = await requestData('/get_data', {args: requestBody});
        dataGrid.innerHTML = '';
        if ((data.columns.length == 0) || (data.rows.length == 0)) {
            dataGrid.innerText = 'No data found for this criteria. Please change filter selections and try again.';
        } else {
            gridOptions = {
                rowData: [],
                columnDefs: [],
                onGridReady: function(params) {
                    const gridApi = params.api;
                    const csvButton = document.getElementById('query-tool-form-download');
                
                    csvButton.addEventListener('click', function() {
                      gridApi.exportDataAsCsv();
                    });
                  }
            };
            data.columns.forEach((column) => {
                column.flex = 1;
                column.minWidth = 120;
                gridOptions.columnDefs.push(column);
            })
            data.rows.forEach((row) => {
                gridOptions.rowData.push(row);
            })
            agGrid.createGrid(dataGrid, gridOptions);
            document.querySelector(`#query-tool-form-download`).removeAttribute('disabled');
        }
    })
}
