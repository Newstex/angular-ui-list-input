angular.module('ui.listInput', []).directive('uiListInput', [
  '$rootScope',
  '$parse',
  '$timeout',
  function ($rootScope, $parse, $timeout) {
    'use strict';
    function listAndRemovedIndicesByRemovingFalsyItems(sourceList, placeholder) {
      var list = [], removedIndices = [], item;
      if (angular.isArray(sourceList)) {
        for (var i = 0; i < sourceList.length; i++) {
          item = sourceList[i];
          if ((item || angular.isNumber(item)) && !angular.equals(item, placeholder)) {
            list.push(angular.copy(item));
          } else {
            removedIndices.push(i);
          }
        }
      }
      return {
        list: list,
        removedIndices: removedIndices
      };
    }
    function listByRemovingFalsyItems(list, placeholder) {
      var listAndRemovedIndices = listAndRemovedIndicesByRemovingFalsyItems(list, placeholder);
      return listAndRemovedIndices.list;
    }
    function link($scope, element, attributes) {
      var parentScope = $scope.$parent;
      var sourceItemsModel = $parse(attributes.ngModel);
      var placeholderValue = $scope.$eval(attributes.placeholderValue);
      var blurredFieldIndex = -1;
      if (!placeholderValue) {
        placeholderValue = '';
      }
      function syncItems(newItems) {
        newItems = angular.copy(newItems);
        var parentItems = angular.copy(newItems);
        if (newItems && !angular.equals(newItems[newItems.length - 1], placeholderValue)) {
          newItems.push(angular.copy(placeholderValue));
        }
        if (parentItems && angular.equals(parentItems[parentItems.length - 1], placeholderValue)) {
          parentItems.pop();
        }
        if (!angular.equals($scope.items, newItems)) {
          $scope.items = newItems;
        }
        sourceItemsModel.assign(parentScope, parentItems);
      }
      parentScope.$watch(attributes.ngModel, function (items) {
        if (items && !angular.equals($scope.items.slice(0, $scope.items.length - 1), items)) {
          syncItems(listByRemovingFalsyItems(items, placeholderValue));
        }
      }, true);
      $scope.$watch('items', function (items) {
        syncItems(items);
        if (!('customFields' in attributes)) {
          angular.forEach(element.find('ng-form'), function (form) {
            form = angular.element(form);
            var formScope = form.scope();
            if (formScope[form.attr('name')].$invalid) {
              form.addClass('has-error');
            } else {
              form.removeClass('has-error');
            }
          });
        }
      }, true);
      syncItems(listByRemovingFalsyItems($scope.$eval(attributes.ngModel), placeholderValue));
      $scope.updateItems = function () {
        $timeout(function () {
          var indexOfFocusedField = $scope.indexOfFocusedField(), listAndRemovedIndices = listAndRemovedIndicesByRemovingFalsyItems($scope.items, placeholderValue), index;
          var indexToFocus = indexOfFocusedField, removedIndices = listAndRemovedIndices.removedIndices;
          for (var i = 0; i < removedIndices.length; i++) {
            index = removedIndices[i];
            if (index < indexOfFocusedField) {
              indexToFocus--;
            } else {
              break;
            }
          }
          syncItems(listAndRemovedIndices.list);
          if (indexToFocus >= 0) {
            $scope.focusFieldAtIndex(indexToFocus);
          }
        });
      };
      $scope.removeItemAtIndex = function (index) {
        if (index >= 0 && index < $scope.items.length) {
          var newItems = angular.copy($scope.items);
          newItems.splice(index, 1);
          syncItems(newItems);
          if (blurredFieldIndex >= 0) {
            if (blurredFieldIndex === index) {
              $scope.focusFieldAtIndex($scope.items.length - 1);
            } else {
              $scope.focusFieldAtIndex(blurredFieldIndex < index ? blurredFieldIndex : blurredFieldIndex - 1);
              blurredFieldIndex = -1;
            }
          }
        }
      };
      $scope.focusFieldAtIndex = function (index, secondAttempt) {
        if (index >= 0) {
          var inputs = element.find('input');
          if (index < inputs.length) {
            inputs[index].focus();
          } else if (!secondAttempt) {
            setTimeout(function () {
              $scope.focusFieldAtIndex(index, true);
            }, 50);
          }
        }
      };
      $scope.indexOfFocusedField = function (index) {
        var focusedField = document.activeElement;
        var inputs = element.find('input');
        for (var i = 0; i < inputs.length; i++) {
          if (inputs[i] === focusedField) {
            return i;
          }
        }
        return -1;
      };
      $scope.didBlurFieldAtIndex = function (index) {
        blurredFieldIndex = index;
        $timeout(function () {
          if (blurredFieldIndex === index) {
            blurredFieldIndex = -1;
          }
        }, 50);
      };
    }
    function compile(element, attributes, transclude) {
      transclude($rootScope, function (clone) {
        var transcluded = angular.element('<div></div>').append(clone);
        var transcludedInput = transcluded.find('input');
        if ('customFields' in attributes) {
          var form = element.find('ng-form');
          form.empty().append(transcluded.contents());
          form.removeAttr('ng-class');
        } else {
          if (transcludedInput.length === 0) {
            transcludedInput = angular.element('<input name="listItem" type="text" class="form-control" />');
          }
          transcludedInput.attr('name', 'listItem');
          transcludedInput.attr('ng-model', 'items[$index]');
          element.find('input').replaceWith(transcludedInput);
        }
        transcludedInput.attr('ng-blur', 'didBlurFieldAtIndex($index);updateItems()');
      });
      return link;
    }
    return {
      restrict: 'ACE',
      require: 'ngModel',
      transclude: true,
      scope: true,
      templateUrl: 'list-input.tpl.html',
      compile: compile
    };
  }
]);
angular.module('ui.listInput').run([
  '$templateCache',
  function ($templateCache) {
    'use strict';
    $templateCache.put('list-input.tpl.html', '<div class="list-input">\n' + '\t<div ng-repeat="doNotUse in items track by $index" class="list-input-item"> \n' + '\t\t<ng-form name="list-input-item" ng-class="{\'input-group\': !$last}">\n' + '\t\t\t<input />\n' + '\t\t\t<div class="input-group-addon btn" ng-click="removeItemAtIndex($index)" ng-hide="$last">\n' + '\t\t\t\t<span class="glyphicon glyphicon-remove"></span>\n' + '\t\t\t</div>\n' + '\t\t</ng-form>\n' + '\t</div>\n' + '</div>');
  }
]);