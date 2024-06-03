import { disableAllFilters, setUpFilterSelections, buildCheckBox, downloadEventListener } from "./multi-query.js";

// disable trail/trailhead/stream view button, then work on return object

const baseUrl = 'https://k2q0f43wl3.execute-api.us-west-2.amazonaws.com/test/aelid_test';
const tablesDiv = document.querySelector('.tables');
const filtersDiv = document.querySelector('.filters');
const dataGrid = document.querySelector('#data-grid');

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
    } catch (error) {
        alert(error.message);
    }
}

async function setUpPage() {
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

// SET UP PAGE

function setUpTables(object) {
    object.Tables.forEach((table) => {
        table.Name = table.Name.split('_').join('-').toLowerCase();
        const tableDiv = document.createElement('div');
        tableDiv.classList.add('table');
        const tableCheckBox = document.createElement('input');
        tableCheckBox.classList.add('table-checkboxes');
        tableCheckBox.classList.add('clickable-query-option');
        const tableCheckBoxLabel = document.createElement('label');
        buildRadioButton(tableCheckBox, tableCheckBoxLabel, table.Name, table.Name, 'table', tableDiv, table.Name);
        tablesDiv.appendChild(tableDiv);
        const columnsDiv = document.createElement('div');
        columnsDiv.classList.add('columns');
        columnsDiv.setAttribute('id', `${table.Name}-columns`);
        tableDiv.appendChild(columnsDiv);
        setUpColumns(table, columnsDiv, object);
        if (table.Name == object.Tables[0].Name) {
            tableCheckBox.setAttribute('checked', 'true');
            columnsDiv.style.display = 'block';
        }
        addTableCheckBoxEventListeners(tableCheckBox, object);
    })
}

function addTableCheckBoxEventListeners(target, object) {
    target.addEventListener('change', function () {
        document.querySelectorAll('.columns').forEach((div) => {
            div.style.display = 'none';
        })
        if (this.checked) {
            document.querySelector(`#${this.value}-columns`).style.display = 'block'
            revealFilters(this.value, object);
        }
    })
}

function setUpColumns(table, parentDiv, object) {
    table.Columns.forEach((column) => {
        column.Name = column.Name.split('_').join('-').toLowerCase();
        const columnCheckBox = document.createElement('input');
        columnCheckBox.classList.add(`${table.Name}-column`)
        columnCheckBox.classList.add('clickable-query-option');
        const columnCheckBoxLabel = document.createElement('label');
        buildRadioButton(columnCheckBox, columnCheckBoxLabel, `${table.Name}-${column.Name}`, column.Name, `${table.Name}-column`, parentDiv, column.Name.split('-').join(' '));
        parentDiv.appendChild(document.createElement('br'));
        if (column.Name == table.Columns[0].Name) {
            columnCheckBox.setAttribute('checked', 'true');
        }
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
    revealOriginalFilters(object);
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

function revealButtons(object) {
    let filterCounter = 0;
    let filterValueCounter = 0;
    const filterCheckboxes = document.querySelectorAll('.filter-checkboxes');
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
    if ((filterCounter == 0) || (filterValueCounter !== 0)) {
        document.querySelector(`#query-tool-form-view`).setAttribute('disabled', '');
    } else {
        document.querySelector(`#query-tool-form-view`).removeAttribute('disabled');
    }
}

function revealOriginalFilters(object) {
    object.Metadata.forEach((filter) => {
        if (filter.OwnedBy.includes(object.Tables[0].Name)) {
            document.querySelector(`#${filter.Name}`).removeAttribute('disabled');
            document.querySelector(`#${filter.Name}-checkbox-label`).classList.remove('disabled');
        }
    })
}

function revealFilters(table, object) {
    let filters = [];
    disableAllFilters();
    object.Metadata.forEach((filter) => {
        if (filter.OwnedBy.includes(table)) {
            filters.push(filter.Name);
        }
    })
    filters.forEach((filter) => {
        document.querySelector(`#${filter}`).removeAttribute('disabled');
        document.querySelector(`#${filter}-checkbox-label`).classList.remove('disabled');
    })
}

// VIEW/SUBMIT BUTTON

let query_args;
let gridOptions = {};

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
                    };
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

function submitEventListener(object) {
    document.querySelector('#query-tool-form').addEventListener("submit", async function (e) {
        e.preventDefault();
        let requestBody = gatherReturnFilterData(object);
        console.log(requestBody);
    })
}

// SET UP FUNCTIONS

function buildRadioButton(button, label, idFor, value, nameVar, parentDiv, innerText) {
    button.setAttribute('type', 'radio');
    button.setAttribute('id', idFor);
    button.setAttribute('value', value);
    button.setAttribute('name', nameVar);
    label.setAttribute('for', idFor);
    label.innerText = innerText;
    parentDiv.appendChild(button);
    parentDiv.appendChild(label);
}