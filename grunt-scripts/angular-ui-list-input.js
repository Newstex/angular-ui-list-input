angular.module('ui.listInput', []).provider('listInputConfig', function () {
  'use strict';
  var config = { listInputTemplate: 'list-input.tpl.html' };
  this.$get = function () {
    return config;
  };
  function stringSetter(setting, value) {
    if (angular.isString(value)) {
      config[setting] = value;
    }
  }
  var setters = { listInputTemplate: stringSetter };
  this.set = function (name, value) {
    var setter, key, props, i;
    if (typeof name === 'string') {
      setter = setters[name];
      if (setter) {
        setter(name, value);
      }
    } else if (typeof name === 'object') {
      props = Object.keys(name);
      for (i = 0; i < props.length; ++i) {
        key = props[i];
        setter = setters[key];
        if (setter) {
          setter(key, name[key]);
        }
      }
    }
  };
}).directive('uiListInput', [
  'listInputConfig',
  function (listInputConfig) {
    'use strict';
    function listAndRemovedIndicesByRemovingFalsyItems(sourceList) {
      var list = [], removedIndices = [], item;
      if (angular.isArray(sourceList)) {
        for (var i = 0; i < sourceList.length; i++) {
          item = sourceList[i];
          if (item || angular.isNumber(item)) {
            list.push(item);
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
    function listByRemovingFalsyItems(list) {
      var listAndRemovedIndices = listAndRemovedIndicesByRemovingFalsyItems(list);
      return listAndRemovedIndices.list;
    }
    return {
      restrict: 'ACE',
      require: 'ngModel',
      scope: { items: '=ngModel' },
      templateUrl: function () {
        return listInputConfig.listInputTemplate;
      },
      controller: [
        '$scope',
        '$timeout',
        function ($scope, $timeout) {
          var blurredFieldIndex = -1;
          $scope.updateItems = function () {
            $timeout(function () {
              var indexOfFocusedField = $scope.indexOfFocusedField(), listAndRemovedIndices = listAndRemovedIndicesByRemovingFalsyItems($scope.form.items), index;
              var indexToFocus = indexOfFocusedField, removedIndices = listAndRemovedIndices.removedIndices;
              for (var i = 0; i < removedIndices.length; i++) {
                index = removedIndices[i];
                if (index < indexOfFocusedField) {
                  indexToFocus--;
                } else {
                  break;
                }
              }
              $scope.items = listAndRemovedIndices.list;
              if (indexToFocus >= 0) {
                $scope.focusFieldAtIndex(indexToFocus);
              }
            });
          };
          $scope.removeItemAtIndex = function (index) {
            if (index >= 0 && index < $scope.items.length) {
              $scope.form.items.splice(index, 1);
              $scope.items = angular.copy($scope.form.items);
              if (blurredFieldIndex >= 0) {
                if (blurredFieldIndex === index) {
                  $scope.focusFieldAtIndex($scope.items.length);
                } else {
                  $scope.focusFieldAtIndex(blurredFieldIndex < index ? blurredFieldIndex : blurredFieldIndex - 1);
                  blurredFieldIndex = -1;
                }
              }
            }
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
      ],
      link: function (scope, element) {
        scope.$watchCollection('items', function (items) {
          if (items && !angular.equals(scope.form.items, items)) {
            var cleanItems = listByRemovingFalsyItems(items);
            scope.form.items = cleanItems;
          }
        });
        scope.$watchCollection('form.items', function (items) {
          scope.itemsRange = new Array(items.length + 1);
          scope.items = angular.copy(items);
        });
        scope.form = { items: listByRemovingFalsyItems(scope.items) };
        scope.focusFieldAtIndex = function (index, secondAttempt) {
          if (index >= 0) {
            var inputs = element.find('input');
            if (index < inputs.length) {
              inputs[index].focus();
            } else if (!secondAttempt) {
              setTimeout(function () {
                scope.focusFieldAtIndex(index, true);
              }, 50);
            }
          }
        };
        scope.indexOfFocusedField = function (index) {
          var focusedField = document.activeElement;
          var inputs = element.find('input');
          for (var i = 0; i < inputs.length; i++) {
            if (inputs[i] === focusedField) {
              return i;
            }
          }
          return -1;
        };
      }
    };
  }
]);
angular.module('ui.listInput').run([
  '$templateCache',
  function ($templateCache) {
    'use strict';
    $templateCache.put('list-input.tpl.html', '<div ng-repeat="item in itemsRange track by $index" ng-class="{\'input-group\': !$last}">\n' + '\t<input type="text" ng-model="form.items[$index]" ng-blur="didBlurFieldAtIndex($index);updateItems()" class="form-control"/>\n' + '\t<button class="input-group-addon btn" tabindex="-1" ng-click="removeItemAtIndex($index)" ng-hide="$last">\n' + '\t\t<span class="glyphicon glyphicon-remove"></span>\n' + '\t</button>\n' + '</div>');
  }
]);