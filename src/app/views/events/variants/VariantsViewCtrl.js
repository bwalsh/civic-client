(function() {
  'use strict';
  angular.module('civic.events')
    .controller('VariantsViewCtrl', VariantsViewCtrl);

  // @ngInject
  function VariantsViewCtrl($log, $rootScope, $scope, $state, $stateParams, Variants) {
    $log.info("VariantsViewCtrl loaded.");

    $scope.variant = {};
    // if no variant ID supplied, reroute to events.genes.summary so that user can choose a variant
    if($stateParams.variantId) {
      $scope.variant = Variants.get({'geneId': $stateParams.geneId, variantId: $stateParams.variantId });
      $rootScope.setNavMode('sub');
      $rootScope.setTitle('Event ' + $stateParams.geneId + ' / ' + $stateParams.variantId)
    } else {
      $state.go('events.genes.summary', { geneId: $stateParams.geneId });
    }

  }
})();