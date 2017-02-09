// Utilities and classes for working with Data Package Views
import { indexOf, find } from "lodash";

//Takes data and view, then generates vega-lite specific spec.
export function generateVegaLiteSpec(data, view) {
  let vlSpec = {
    "width": 900,
    "height": 400,
    "data": {"values": []},
    "layers": []
  };
  let headers = data[0];
  vlSpec.data.values = data.slice(1).map(values => {
    return headers.reduce((o, k, i) => {
      o[k] = values[i];
      return o;
    }, {});
  });
  for (let i = 0; i < view.state.series.length; i++) {
    let layer = {
      "mark": "line",
      "encoding": {
        "x": {"field": "", "type": "temporal"},
        "y": {"field": "", "type": "quantitative"}
      }
    };
    layer.encoding.x.field = view.state.group;
    layer.encoding.y.field = view.state.series[i];
    vlSpec.layers.push(layer);
  }
  return vlSpec;
}

// Takes a view spec and resource data (with headers re-inserted) and returns plotly spec
// @return: Plotly graph spec
export function generatePlotlySpec(viewSpec, dataTable) {
  let headers = dataTable[0];
  let rows = dataTable.slice(1);
  let xIndex = indexOf(headers, viewSpec.state.group);
  let xValues = rows.map(row => row[xIndex]);
  let data = viewSpec.state.series.map(serie => {
    let yColumn = indexOf(headers, serie)
    return {
      x: xValues,
      y: rows.map(row => row[yColumn]),
      mode: "lines",
      name: serie
    }
  });

  let plotlySpec = {
    data: data,
    layout: {
      "xaxis": {
        "title": viewSpec.state.group
      }
    }
  }
  return plotlySpec;
}

//Takes a single resource and returns Handsontable spec
export function generateHandsontableSpec(data) {
  return {
    data: data.slice(1), //excluding headers
    colHeaders: data[0], //selecting headers
    readOnly: true,
    width: 1136,
    height: function () {
      if (data.length > 16) {
        return 432;
      }
    },
    colWidths: 47,
    rowWidth: 27,
    stretchH: 'all',
    columnSorting: true,
    search: true
  };
}

// make sure view spec is in "normal" form - i.e. has all the standard fields
// in standard structure atm this just means adding the dataSource field if
// absent
// Changes the viewSpec in place
export function normalizeView(viewSpec) {
  if (!viewSpec.resources) {
    viewSpec.resources = [ 0 ];
  }
}

// convert old Recline "view" to DP View with simple graph spec
export function convertReclineToSimple(reclineViewSpec) {
  let graphTypeConvert = {
    'lines': 'line'
  };
  // TODO: support multiple series
  let out = {
      name: reclineViewSpec.id.toLowerCase(),
      specType: 'simple',
      spec: {
        type: graphTypeConvert[reclineViewSpec.state.graphType],
        group: reclineViewSpec.state.group,
        series: reclineViewSpec.state.series
      }
    };
  return out;
}

export function compileData(view, dataPackage, dataPackageData) {
  let out = view.resources.map(resourceId => {
    let resource = Object.assign({}, findResourceByNameOfId(dataPackage, resourceId));
    resource.values = dataPackageData[dataPackage.name][resourceId];
    return resource;
  });
  return out;
}

export function findResourceByNameOfId(dp, nameOrId) {
  if (typeof(nameOrId) == 'number') {
    return dp.resources[nameOrId];
  } else {
    return find(dp.resources, (resource) => {return (resource.name == nameOrId)});
  }
}

