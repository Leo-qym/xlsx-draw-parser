import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Paper } from '@material-ui/core';

import MaterialTable from 'material-table';

// function renderPlayer(player) { return <img src={player.avatar} style={{width: 40, borderRadius: '50%'}} alt={player.name}/>; }
// function renderTotal(player) { return (player.singles || 0) + (player.doubles || 0) }

const columns = [
    { title: 'Side One', field: 'side1' },
    { title: 'Side Two', field: 'side2' },
    { title: 'Round', field: 'roundName' },
    { title: 'Result', field: 'result' }
];
const options = {
    actions: false,
    editable: false,
    showTitle: true,
    search: true,
    sorting: true,
    selection: false,
    padding: 'dense',
    paging: false,
    pageSize: 20,
    maxBodyHeight: window.innerHeight,
    pageSizeOptions: [10, 20, 50],
    headerStyle: {fontWeight:'bold'}
}

const localization = {
    body: {
        emptyDataSourceMessage: 'No Data'
    },
    toolbar: {
        searchTooltip: 'Search',
        searchPlaceholder: 'Search...'
    },
    pagination: {
        labelRowsSelect: 'rows',
        labelDisplayedRows: '{from}-{to} of {count}',
        firstTooltip: 'First Page',
        previousTooltip: 'Previous Page',
        nextTooltip: 'Next Page',
        lastTooltip: 'Last Page'
    }
}

export function MatchUpsTable(props) {
    return PersonsTable({ initialValues: { columns, options, localization } });
}

export function PersonsTable ({ initialValues }) {
    const baseTitle = "";
    let data = useSelector(state => state.xlsx.matchUps);
    let matchUps = JSON.parse(JSON.stringify(data));
    
    const defaultValues = { selectedRow: null };
    const [values, setValues] = useState(Object.assign(defaultValues, initialValues));

    const rowStyle = rowData => ({
        backgroundColor: (values.selectedRow && values.selectedRow.tableData.id === rowData.tableData.id) ? '#EEE' : '#FFF'
    })

    const defaultOptions = {
        rowStyle,
        actionsColumnIndex: columns.length
    };

    const rowClick = (event, rowData, togglePanel) => {
        setValues({...values, selectedRow: rowData });
        if (options.detail) togglePanel();
    }

    const components = { Container: props => <Paper {...props} elevation={0}/> }
    
    return (
      <MaterialTable
        title={baseTitle}
        options={Object.assign(defaultOptions, options)}
        columns={columns}
        components={components}
        data={matchUps}        
        onRowClick={rowClick}
        localization={localization}
      />
    )
}
