(function() {
  'use strict';
  angular.module('civic.services')
    .factory('Datatables', DatatablesService);

  // ?count=10&page=2&sorting[entrez_gene]=asc&sorting[variant]=desc&filter[entrez_gene]=flt
  // @ngInject
  function DatatablesService($resource) {
    return $resource('/api/datatables/:perspective',
      {},
      {
        get: {
          method: 'GET',
          isArray: false,
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
        }
      });
  }

})();
