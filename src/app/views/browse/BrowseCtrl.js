(function() {
  'use strict';
  angular.module('civic.browse')
    .controller('BrowseCtrl', BrowseCtrl);

// @ngInject
  function BrowseCtrl($scope, uiGridConstants, Datatables, $http, $state, _, $log) {
    var defaults = {
      mode: 'variants',
      count: 25
    };

    var ctrl = $scope.ctrl = {};
    var maxRows = ctrl.maxRows = defaults.count;

    // declare ui paging/sorting/filtering vars
    ctrl.mode = '';
    ctrl.totalItems = Number();
    ctrl.page = 1;
    ctrl.count= Number();

    ctrl.filters = [];
    ctrl.sorting = [];

    ctrl.isFiltered = ctrl.filters.length > 0;

    $scope.$watch('ctrl.totalItems', function() {
      ctrl.totalPages = Math.ceil(ctrl.totalItems / defaults.count);
    });

    ctrl.gridOptions = {
      enablePaginationControls: false,

      useExternalFiltering: true,
      useExternalSorting: true,

      paginationPageSizes: [maxRows],
      paginationPageSize: maxRows,
      minRowsToShow: maxRows + 1,

      enableHorizontalScrollbar: uiGridConstants.scrollbars.NEVER,
      enableVerticalScrollbar: uiGridConstants.scrollbars.NEVER,

      enableFiltering: true,
      enableColumnMenus: false,
      enableSorting: true,
      enableRowSelection: true,
      enableRowHeaderSelection: false,
      multiSelect: false,
      modifierKeysToMultiSelect: false,
      noUnselect: true,
      rowTemplate: 'app/views/browse/browseGridRow.tpl.html'
    };

    // set up column defs and data transforms for each mode
    var modeColumnDefs = {
      'variants': [
        {
          name: 'variant',
          width: '30%',
          enableFiltering: true,
          allowCellFocus: false,
          filter: {
            condition: uiGridConstants.filter.CONTAINS
          }
        },
        {
          name: 'entrez_gene',
          width: '15%',
          sort: {direction: uiGridConstants.ASC},
          enableFiltering: true,
          allowCellFocus: false,
          filter: {
            condition: uiGridConstants.filter.CONTAINS
          }
        },
        {
          name: 'diseases',
          displayName: 'Diseases',
          width: '45%',
          enableFiltering: true,
          allowCellFocus: false,
          filter: {
            condition: uiGridConstants.filter.CONTAINS
          },
          cellTemplate: 'app/views/browse/browseGridTooltipCell.tpl.html'
        },
        {
          name: 'evidence_item_count',
          width: '10%',
          displayName: 'Evidence',
          enableFiltering: false,
          allowCellFocus: false,
          filter: {
            condition: uiGridConstants.filter.CONTAINS
          }
        }
      ],
      'genes': [
        {
          name: 'entrez_gene',
          width: '15%',
          sort: {direction: uiGridConstants.ASC},
          enableFiltering: true,
          allowCellFocus: false,
          filter: {
            condition: uiGridConstants.filter.CONTAINS
          }
        },
        {
          name: 'gene_aliases',
          width: '30%',
          displayName: 'Gene Aliases',
          enableFiltering: true,
          allowCellFocus: false,
          cellTemplate: 'app/views/browse/browseGridTooltipCell.tpl.html',
          filter: {
            condition: uiGridConstants.filter.CONTAINS
          }
        },
        {
          name: 'diseases',
          width: '30%',
          displayName: 'Diseases',
          enableFiltering: true,
          allowCellFocus: false,
          filter: {
            condition: uiGridConstants.filter.CONTAINS
          },
          cellTemplate: 'app/views/browse/browseGridTooltipCell.tpl.html'
        },
        {
          name: 'variant_count',
          displayName: 'Variants',
          width: '10%',
          enableFiltering: false,
          allowCellFocus: false,
          filter: {
            condition: uiGridConstants.filter.CONTAINS
          }
        },
        {
          name: 'evidence_item_count',
          width: '10%',
          displayName: 'Evidence',
          enableFiltering: false,
          allowCellFocus: false,
          filter: {
            condition: uiGridConstants.filter.CONTAINS
          }
        }
      ]
    };

    ctrl.gridOptions.onRegisterApi = function(gridApi) {
      ctrl.gridApi = gridApi;

      // called from pagination directive when page changes
      ctrl.pageChanged = function() {
        $log.info('page changed: ' + ctrl.page);
        updateData();
      };

      // reset paging and do some other stuff on filter changes
      gridApi.core.on.filterChanged($scope, function() {
        $log.info('filter changed.');
        // updateData with new filters
        var filteredCols = _.filter(this.grid.columns, function(col) {
          return _.has(col.filter, 'term') && !_.isEmpty(col.filter.term) && _.isString(col.filter.term);
        });
        if (filteredCols.length > 0) {
          ctrl.filters = _.map(filteredCols, function(col) {
            return {
              'field': col.field,
              'term': col.filter.term
            };
          });
        } else {
          ctrl.filters = [];
        }
        ctrl.page = 1;
        updateData();
      });

      gridApi.core.on.sortChanged($scope, function(grid, sortColumns) {
        $log.info('sort changed.');

        if (sortColumns.length > 0) {
          ctrl.sorting = _.map(sortColumns, function(col) {
            return {
              'field': col.field,
              'direction': col.sort.direction
            };
          });
        } else {
          ctrl.sorting = [];
        }

        updateData();
      });

      // called when user clicks on a row
      gridApi.selection.on.rowSelectionChanged($scope, function(row){
        // $log.info(['geneID:', row.entity.entrez_id, 'variantId:', row.entity.variant_id].join(' '));
        $log.info(['ctrl.mode:', ctrl.mode, 'geneID:', row.entity.entrez_id, 'variantId:', row.entity.variant_id].join(' '));
        if(ctrl.mode == 'variants') {
          $state.go('events.genes.summary.variants.summary', {
            geneId: row.entity.entrez_id,
            variantId: row.entity.variant_id
          });
        } else {
          $state.go('events.genes.summary', {
            geneId: row.entity.entrez_id
          });
        }
      });
    };

    function updateData() {
      fetchData(ctrl.mode, ctrl.count, ctrl.page, ctrl.sorting, ctrl.filters)
        .then(function(data){
          ctrl.gridOptions.data = data.data.result;
          ctrl.gridOptions.columnDefs = modeColumnDefs[ctrl.mode];
          ctrl.totalItems = data.data.total;
        });
    }

    ctrl.switchMode = function(mode) {
      ctrl.mode = mode;
      ctrl.filters = [];
      ctrl.sorting = [];
      ctrl.page = 1;
      updateData();
    };

    function fetchData(mode, count, page, sorting, filters) {
      var url = '/api/datatables/' + mode + '?count=' + count + '&page=' + page;

      if (filters.length > 0) {
        var filterStrings = _.map(filters, function(filter) {
          return 'filter[' + filter.field + ']=' + filter.term;
        });
        url = url + '&' + filterStrings.join('&');
      }

      if (sorting.length > 0) {
        var sortingStrings = _.map(sorting, function(sort) {
          return 'sorting[' + sort.field + ']=' + sort.direction;
        });
        url = url + '&' + sortingStrings.join('&');
      }

      ctrl.fetchUrl = url;
      return $http({
        method: 'GET',
        url: url,
        transformResponse: function(data) {
          var events = JSON.parse(data);
          // convert arrays to comma-fied strings
          events.result = _.map(events.result, function (event) {
            _.forEach(_.keys(event), function(key) {
              if(_.isArray(event[key])) {
                event[key] = event[key].join(', ');
              }
            });
            return event;
          });
          return events;
        }
      });
    }

    ctrl.switchMode(defaults.mode);
  }
})();
