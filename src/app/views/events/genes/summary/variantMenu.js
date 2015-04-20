(function() {
  'use strict';
  angular.module('civic.events.genes')
    .controller('VariantMenuController', VariantMenuController)
    .directive('variantMenu', function() {
      return {
        restrict: 'E',
        scope: {
          gene: '=',
          variants: '=',
          variantGroups: '=',
          options: '='
        },
        controller: 'VariantMenuController',
        templateUrl: 'app/views/events/genes/summary/variantMenu.tpl.html'
      }
    });

  //@ngInject
  function VariantMenuController($scope, _) {
    // variants, variantGroups, options attached to $scope
  }
})();