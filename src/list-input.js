angular.module('ui.listInput', [])

/**
 * @ngdoc service
 * @name ui.listInput.listInputConfig
 * @function
 *
 * @description
 *
 * The listInputConfig service offers a provider which may be injected
 * into config blocks to configure the directive:
 *
 * <pre>
 * angular.module('example', ['ui.listInput'])
 * .config(function(listInputConfig) {
 *   listInputConfig.set(listInputTemplate: 'my/custom/views/listInput.html');
 *   listInputConfig.set({
 *     listInputTemplate: 'my/custom/views/listInput.html'
 *   });
 * });
 * </pre>
 */
.provider('listInputConfig', function() {
	'use strict';

	var config = {
		/**
		 * @ngdoc property
		 * @name ui.listInput.listInputConfig#listInputTemplate
		 * @propertyOf ui.listInput.listInputConfig
		 *
		 * @description
		 *
		 * The template URL for rendering the directive contents. This must be a
		 * valid URL or cached ng-template.
		 */
		listInputTemplate: 'list-input.tpl.html'
	};

	this.$get = function() {
		return config;
	};

	function stringSetter(setting, value) {
		if (angular.isString(value)) {
			config[setting] = value;
		}
	}

	var setters = {
		listInputTemplate: stringSetter
	};

	/**
	 * @ngdoc function
	 * @name ui.listInput.listInputConfig#set
	 * @methodOf ui.listInput.listInputConfig
	 * @function
	 *
	 * @description
	 *
	 * This method allows global configuration options to be updated, when used
	 * within a config injection block.
	 *
	 * Validation is performed on configuration values and keys to ensure that
	 * they are supported and of an acceptable type.
	 *
	 * @param {string|object} name Either the name of the property to be
	 *     accessed, or an object containing keys and values by which to extend
	 *     the configuration.
	 * @param {*} value The value to which the named key will be set provided
	 *     that it is valid and the name is supported. See the configuration
	 *     options for type requirements.
	 */
	this.set = function(name, value) {
		var setter, key, props, i;
		if (typeof name === 'string') {
			setter = setters[name];
			if (setter) {
				setter(name, value);
			}
		}
		else if (typeof name === 'object') {
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
})


/**
 * @ngdoc directive
 * @name ui.listInput.directive:uiListInput
 * @restrict ACE
 * @scope
 * 
 * @param {Array[String]} ngModel The array to edit, or a new variable in the
 *     scope into which an array can be assigned by the directive.
 * 
 * @property {Array[String]} $scope.items The array referenced in the
 *     `ngModel` attribute. Updates to `$scope.items` affect the parent scope.
 * @property {Array[String]} $scope.form.items A copy of `$scope.items` for
 *     use during editing to distinguish changes made within the directive
 *     from those made externally. All inputs within the directive should be
 *     bound to this property rather than `$scope.items`.
 * @property {Array} $scope.itemsRange An array suitable for use in a repeater
 *     that corresponds to the length of `$scope.items` plus one for entering
 *     a new item. Use `$index` in the `ngRepeat` to reference specific items
 *     in `$scope.form.items`.
 * 
 *     The values in this array are undefined; it is only to be used for indexed
 *     iteration. The following example uses `track by $index` to ensure that
 *     the `ngRepeat` is only re-rendered when the length of `itemsRange`
 *     changes rather than on every keystroke.
 * 
 *     ```
 *     <div ng-repeat="x in itemsRange track by $index"> 
 *         {{form.items[$index]}}
 *     </div>
 *     ```
 *
 * @description 
 * 
 * Allows textual data to be added to or removed from a list.
 *
 * This control does not provide any functionality for sorting or reordering the
 * list. New items are added at the bottom and existing items may be modified or
 * removed.
 *
 * The control uses Bootstrap CSS classes to standardize the input styling and
 * item removal buttons.
 *
 * ### Data types
 *
 * All items in the source data will be stringified for display in the text
 * fields. Output data will be strings only, regardless of whether the value
 * could be interpreted as a number of other type.
 *
 * ### Binding to the parent scope
 *
 * The model provided to the directive is updated in realtime with each
 * keystroke.
 *
 * ### Handling empty (falsy) items
 *
 * Empty items in the source list are not displayed in the fields. Falsy values
 * that will be removed include the following. Note that the falsy value `0` is
 * not removed.
 * 
 * * `null`
 * * `""`
 * * `undefined`
 * 
 * If a field is cleared while editing, the empty string is not immediately
 * removed. `updateItems` must be called to remove items that the user has
 * cleared. By default this occurs whenever a field is blurred. This behavior
 * ensures that the user can clear a field and type something else without that
 * field being removed from the DOM. Blurring the field by advancing to a
 * different field or clicking outside the field causes the empty value to be
 * committed, removing the field from the screen and the empty string from the
 * list.
 *
 * @example
 * <example module="ui.listInput">
 *  <file name="index.html">
 *      <div ng-init="sampleList=['A','B','C']">
 *         <div ui-list-input ng-model="sampleList"></div>
 *         <pre>{{sampleList}}</pre>
 *      </div>
 *   </file>
 * </example>
 */
.directive('uiListInput', function(listInputConfig) {
	'use strict';

	// Removes non-numeric falsy values such as '', null, and undefined from the
	// source array, preserving numeric values such as 0. Returns an object
	// containing the modified list as well as a list of all indices of falsy
	// items that were removed.
	function listAndRemovedIndicesByRemovingFalsyItems(sourceList) {
		var list = [],
		removedIndices = [],
		item;

		if (angular.isArray(sourceList)) {
			// Remove empty or otherwise falsy items
			for (var i = 0; i < sourceList.length; i++) {
				item = sourceList[i];
				if (item || angular.isNumber(item)) {
					list.push(item);
				}
				else {
					removedIndices.push(i);
				}
			}
		}

		return {list: list, removedIndices: removedIndices};
	}
	function listByRemovingFalsyItems(list) {
		var listAndRemovedIndices = listAndRemovedIndicesByRemovingFalsyItems(list);

		return listAndRemovedIndices.list;
	}

	return {
		restrict: 'ACE',
		require: 'ngModel',
		scope: {
			items: '=ngModel'
		},

		// Load template from the configuration
		templateUrl: function() {
			return listInputConfig.listInputTemplate;
		},

		controller: function($scope, $timeout) {
			var blurredFieldIndex = -1;

			/**
			 * @ngdoc method
			 * @name ui.listInput.directive:uiListInput#updateItems
			 * @function
			 * @methodOf ui.listInput.directive:uiListInput
			 *
			 * @description
			 * Removes any falsy items from the list and updates focus to
			 * accommodate any changes in the list. The number zero, while
			 * falsy, is not removed.
			 *
			 * This is generally called after a change is confirmed by the user,
			 * such as when a field is blurred. It may not be polite to remove a
			 * field as soon as the user deletes the last remaining character.
			 *
			 * The scope is updated asynchronously so as to allow the browser to
			 * focus the next or previous input if the user pressed *Tab* or
			 * *Shift+Tab* to change fields. This allows the intended focus to
			 * remain active after the removal. For instance, pressing *Tab*
			 * after removing item 1 would focus item 2. However, after item 1
			 * is removed the original item 2 is now at position 1. Therefore we
			 * want to focus position 1 rather than the default behavior which
			 * would focus original item 3 now at position 2.
			 */
			$scope.updateItems = function() {
				$timeout(function() {
					var indexOfFocusedField = $scope.indexOfFocusedField(),
					listAndRemovedIndices = listAndRemovedIndicesByRemovingFalsyItems($scope.form.items),
					index;
					var indexToFocus = indexOfFocusedField,
					removedIndices = listAndRemovedIndices.removedIndices;

					// Offset the focus by one for each item removed above the focused
					// field
					for (var i = 0; i < removedIndices.length; i++) {
						index = removedIndices[i];

						if (index < indexOfFocusedField) {
							indexToFocus--;
						}
						else {
							break;
						}
					}

					$scope.items = listAndRemovedIndices.list;

					if (indexToFocus >= 0) {
						$scope.focusFieldAtIndex(indexToFocus);
					}
				});
			};

			/**
			 * @ngdoc method
			 * @name ui.listInput.directive:uiListInput#removeItemAtIndex
			 * @function
			 * @methodOf ui.listInput.directive:uiListInput
			 *
			 * @description
			 * Removes the item at the specified index from the list and returns
			 * focus to the previously focused field, if any.
			 *
			 * If the focused field is the one deleted, focus will be moved to
			 * the last input.
			 * 
			 * @param {Number} index The index of the item to be removed from
			 *     the list.
			 */
			$scope.removeItemAtIndex = function(index) {
				if (index >= 0 && index < $scope.items.length) {
					$scope.form.items.splice(index, 1);
					$scope.items = angular.copy($scope.form.items);

					if (blurredFieldIndex >= 0) {
						// Focus bottommost field if the focused field was removed
						if (blurredFieldIndex === index) {
							$scope.focusFieldAtIndex($scope.items.length);
						}
						// Keep focus in the same field after removing the item
						else {
							$scope.focusFieldAtIndex((blurredFieldIndex < index) ? blurredFieldIndex : blurredFieldIndex - 1);
							blurredFieldIndex = -1;
						}
					}
				}
			};

			/**
			 * @ngdoc method
			 * @name ui.listInput.directive:uiListInput#didBlurFieldAtIndex
			 * @function
			 * @methodOf ui.listInput.directive:uiListInput
			 *
			 * @description
			 * 
			 * Tracks the last focused field for a short period of time so that
			 * actions such as clicks that blur the field may return focus if
			 * desired. The template should call this method on blur of any
			 * input field.
			 * 
			 * @param {Number} index The index of the item that just lost focus.
			 */
			$scope.didBlurFieldAtIndex = function(index) {
				blurredFieldIndex = index;

				// The field may have been blurred by interacting with a
				// different control. After 100 ms, lose track of the blurred
				// field so that it is not programmatically refocused later
				$timeout(function() {
					if (blurredFieldIndex === index) {
						blurredFieldIndex = -1;
					}
				}, 50);
			};
		},

		link: function(scope, element) {
			// Keep one extra item for the new field and update upon any
			// internal or external changes to the items
			scope.$watchCollection('items', function(items) {
				if (items && !angular.equals(scope.form.items, items)) {
					var cleanItems = listByRemovingFalsyItems(items);
					// Ensure that falsy items are removed
					scope.form.items = cleanItems;
				}
			});
			scope.$watchCollection('form.items', function(items) {
				scope.itemsRange = new Array(items.length + 1);
				scope.items = angular.copy(items);
			});

			scope.form = {
				items: listByRemovingFalsyItems(scope.items)
			};

			/**
			 * @ngdoc method
			 * @name ui.listInput.directive:uiListInput#focusFieldAtIndex
			 * @function
			 * @methodOf ui.listInput.directive:uiListInput
			 *
			 * @description
			 * 
			 * Allows the controller to move focus to a specific field.
			 *
			 * If the specified field is not yet added to the DOM, one attempt
			 * will be made to focus the field after a short timeout.
			 * 
			 * @param {Number} index The index of the item to focus.
			 */
			scope.focusFieldAtIndex = function(index, secondAttempt) {
				if (index >= 0) {
					var inputs = element.find('input');
					if (index < inputs.length) {
						inputs[index].focus();
					}
					else if (!secondAttempt) {
						setTimeout(function() {
							scope.focusFieldAtIndex(index, true);
						}, 50);
					}
				}
			};

			/**
			 * @ngdoc method
			 * @name ui.listInput.directive:uiListInput#indexOfFocusedField
			 * @function
			 * @methodOf ui.listInput.directive:uiListInput
			 *
			 * @description
			 * 
			 * Returns the index of the input element within the directive that
			 * currently has focus.
			 *
			 * @return {Number} The index of the focused field or `-1` if no
			 *     field is focused
			 */
			scope.indexOfFocusedField = function(index) {
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
});