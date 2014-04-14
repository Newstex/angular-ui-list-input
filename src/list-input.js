angular.module('ui.listInput', [])

/**
 * @ngdoc directive
 * @name ui.listInput.directive:uiListInput
 * @restrict ACE
 * 
 * @param {Array[String]} ngModel The array to edit, or a new variable in the
 *     $scope into which an array can be assigned by the directive.
 * @param {Boolean} customFields The presence of this attribute causes the
 *     directive to wrap any contents provided inside the repeated `ng-form`
 *     element. Transcluded content had access to both the local and parent
 *     scope.
 * @param {*} placeholderValue Specifies a default value that will be assigned for 
 * 
 * @property {Array[String]} $scope.items A copy of the array referenced in the
 *     `ngModel` attribute for
 *     use during editing to distinguish changes made within the directive
 *     from those made externally. All inputs within the directive should be
 *     bound to this property rather than `$scope.items`.
 *
 * @description 
 * Allows textual or structured data to be added to or removed from a list.
 *
 * This control does not provide any functionality for sorting or reordering the
 * list. New items are added at the bottom and existing items may be modified or
 * removed.
 *
 * The control uses Bootstrap CSS classes to standardize the input styling and
 * item removal buttons. The appearance of the form fields is entirely
 * customizable using the `custom-fields` attribute.
 *
 * ### Data types
 *
 * Used without any nested inputs, all items in the source data will be
 * stringified for display in the text fields. Output data will be strings
 * only, regardless of whether the value could be interpreted as a number of
 * other type.
 *
 * Data types can be customized by simply providing a custom `<input>` field,
 * or by integrating with `custom-fields`.
 *
 * ### Custom input type
 *
 * To use an alternate input type (the default is `text`), simply nest an
 * `<input>` element inside the directive. It will be transcluded in place of
 * the default input and automatically enriched with the required `ng-model`,
 * `name`, and `ng-blur` properties.
 *
 *     <div ui-list-input ng-model="sampleList">
 *         <input type="number" />
 *     </div>
 *
 * ### Custom fields
 *
 * Further customization is available with the `custom-fields` attribute. When
 * present, all content in the directive will be transcluded into the `ng-
 * form` element in the template. The form, inside a repeater, allows
 * validation without worrying about duplicate field names.
 *
 *     <div ui-list-input ng-model="sampleObjects" custom-fields placeholder-value="{}">
 *         <input name="name" placeholder="Name" ng-model="items[$index].name" type="text" />
 *         <input name="profession" placeholder="Profession" ng-model="items[$index].profession" type="text" />
 *     </div>
 *
 * The use of `items[$index]` is very important as it provides access to the
 * current item represented in the repeater. Values can be assigned to it,
 * affecting the corresponding item in the source data. The `items` array is
 * added to the directive scope and is not available outside of the directive.
 * 
 * In this example, `placeholder-value="{}"` is necessary to avoid trying to
 * assign to the `name` and `profession` properties of a null object. The
 * fields representing a new item will be populated with that default value
 * and any fields deeply matching that value will not be propagated back to
 * the parent scope.
 *
 * ### Binding to the parent $scope
 *
 * The model provided to the directive is updated in realtime with each
 * keystroke. The item representing the placeholder for adding a new item is
 * never added to the parent scope.
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
 * * The value provided in the `placeholderValue` attribute, equality
 *   determined by `angular.equals()`
 * 
 * If a field is cleared while editing, the empty value is not immediately
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
 *      <h3>Strings</h3>
 *      <div ng-init="sampleStrings=['A','B','C']">
 *         <div ui-list-input ng-model="sampleStrings"></div>
 *         <pre>{{sampleStrings}}</pre>
 *      </div>
 *      
 *      <h3>Numbers</h3>
 *      <div ng-init="sampleNumbers=[0,1,2]">
 *         <div ui-list-input ng-model="sampleNumbers">
 *             <input type="number" />
 *         </div>
 *         <pre>{{sampleNumbers}}</pre>
 *      </div>
 *      
 *      <h3>Complex data</h3>
 *      <div ng-init="sampleObjects=[{name:'John', profession:'Butcher'},{name:'Matilda', profession:'Baker'},{name:'Buddy', profession:'Candlestick Maker'}]">
 *         <div ui-list-input ng-model="sampleObjects" custom-fields placeholder-value="{}">
 *             <input name="name" placeholder="Name" ng-model="items[$index].name" type="text" />
 *             <input name="profession" placeholder="Profession" ng-model="items[$index].profession" type="text" />
 *         </div>
 *         <pre>{{sampleObjects}}</pre>
 *      </div>
 *   </file>
 * </example>
 */
.directive('uiListInput', function($rootScope, $parse, $timeout) {
	'use strict';

	// Removes non-numeric falsy values such as '', null, and undefined from the
	// source array, preserving numeric values such as 0. Returns an object
	// containing the modified list as well as a list of all indices of falsy
	// items that were removed.
	function listAndRemovedIndicesByRemovingFalsyItems(sourceList, placeholder) {
		var list = [],
		removedIndices = [],
		item;

		if (angular.isArray(sourceList)) {
			// Remove empty or otherwise falsy items
			for (var i = 0; i < sourceList.length; i++) {
				item = sourceList[i];
				if ((item || angular.isNumber(item)) && !angular.equals(item, placeholder)) {
					list.push(item);
				}
				else {
					removedIndices.push(i);
				}
			}
		}

		return {list: list, removedIndices: removedIndices};
	}
	function listByRemovingFalsyItems(list, placeholder) {
		var listAndRemovedIndices = listAndRemovedIndicesByRemovingFalsyItems(list, placeholder);

		return listAndRemovedIndices.list;
	}

	// Sets up all interaction between the directive and the parent scope.
	function link($scope, element, attributes) {
		// Get access to the model tracking the original object referenced by
		// the ng-model attribute.
		var parentScope = $scope.$parent;
		var sourceItemsModel = $parse(attributes.ngModel);
		var placeholderValue = $scope.$eval(attributes.placeholderValue);
		var blurredFieldIndex = -1;
		
		if (!placeholderValue) {
			placeholderValue = '';
		}

		// Copies items to the directive scope and parent scope, accounting
		// for the placeholder item in the directive scope. Does not clean
		// falsy items; that must be done before calling this method as the
		// logic is not always desired.
		function syncItems(newItems) {
			// Create shallow copies so that the contents are not altered but
			// new and parent items can exist as separate lists with separate
			// items.
			newItems = newItems.slice();
			var parentItems = newItems.slice();

			// Add a placeholder at the end if there is not one yet
			if (newItems && !angular.equals(newItems[newItems.length - 1], placeholderValue)) {
				newItems.push(angular.copy(placeholderValue));
			}

			// Remove placeholder from parent items if they exist
			if (parentItems && angular.equals(parentItems[parentItems.length - 1], placeholderValue)) {
				parentItems.pop();
			}

			if (!angular.equals($scope.items, newItems)) {
				$scope.items = newItems;
			}

			sourceItemsModel.assign(parentScope, parentItems);
		}

		// Keep one extra item for the new field and update upon any
		// internal or external changes to the items
		parentScope.$watchCollection(attributes.ngModel, function(items) {
			if (items && !angular.equals($scope.items.slice(0, $scope.items.length - 1), items)) {
				syncItems(listByRemovingFalsyItems(items, placeholderValue));
			}
		});

		// Update the parent scope whenever the local items change. When
		// custom fields are not used, add validation classes corresponding to
		// the state of the field.
		$scope.$watch('items', function(items) {
			syncItems(items);

			// Add has-error classes on invalid items
			if (!('customFields' in attributes)) {
				$timeout(function() {
					var inputs = element.find('input');
					angular.forEach(inputs, function(input, i) {
						input = angular.element(input);
						var controller = input.controller('ngModel');

						// Remove any errors on the last field since it
						// represents a new item and need not be valid
						if (i === inputs.length - 1) {
							input.parent().removeClass('has-error');

							if (controller.$error) {
								for (var key in controller.$error) {
									controller.$setValidity(key, true);
								}
							}
						}
						else if (controller.$invalid) {
							input.parent().addClass('has-error');
						}
						else {
							input.parent().removeClass('has-error');
						}
					});
				});
			}
		}, true);

		// Remove falsy items from the source data upon initialization
		syncItems(listByRemovingFalsyItems($scope.$eval(attributes.ngModel), placeholderValue));

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
		 * The $scope is updated asynchronously so as to allow the browser to
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
				var listAndRemovedIndices = listAndRemovedIndicesByRemovingFalsyItems($scope.items, placeholderValue);

				if ('customFields' in attributes) {
					syncItems(listAndRemovedIndices.list);
				}
				else {
					var indexOfFocusedField = $scope.indexOfFocusedField();
					var indexToFocus = indexOfFocusedField,
					removedIndices = listAndRemovedIndices.removedIndices,
					index;

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

					syncItems(listAndRemovedIndices.list);

					if (indexToFocus >= 0 && indexToFocus != indexOfFocusedField) {
						$scope.focusFieldAtIndex(indexToFocus);
					}
				}
			}, 100);
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
				var newItems = $scope.items.slice();
				newItems.splice(index, 1);
				syncItems(newItems);

				if (blurredFieldIndex >= 0) {
					// Focus bottommost field if the focused field was removed
					if (blurredFieldIndex === index) {
						$scope.focusFieldAtIndex($scope.items.length - 1);
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
		 * @name ui.listInput.directive:uiListInput#$scope.focusFieldAtIndex
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
		$scope.focusFieldAtIndex = function(index, secondAttempt) {
			if (index >= 0) {
				var inputs = element.find('input');
				if (index < inputs.length) {
					inputs[index].focus();
				}
				else if (!secondAttempt) {
					setTimeout(function() {
						$scope.focusFieldAtIndex(index, true);
					}, 50);
				}
			}
		};

		/**
		 * @ngdoc method
		 * @name ui.listInput.directive:uiListInput#$scope.indexOfFocusedField
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
		$scope.indexOfFocusedField = function(index) {
			var focusedField = document.activeElement;
			var inputs = element.find('input');
			for (var i = 0; i < inputs.length; i++) {
				if (inputs[i] === focusedField) {
					return i;
				}
			}
			return -1;
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
	}

	// Custom compilation does transclusion based on logic not available
	// to a simple ng-transclude.
	function compile(element, attributes, transclude) {
		// Parse any content that was included in this directive to pull out
		// an input field 
		transclude($rootScope.$new(true), function(clone) {
			var transcluded = angular.element('<div></div>').append(clone);
			var transcludedInput = transcluded.find('input');

			if ('customFields' in attributes) {
				var form = element.find('ng-form');

				form.empty().append(transcluded.contents());

				form.children().removeAttr('ng-non-bindable');

				form.removeAttr('ng-class');

				// Ensure that everything is updated on blur and empty fields are
				// removed
				transcludedInput.eq(transcludedInput.length - 1).attr('ng-blur', 'updateItems()');
			}
			else {
				// The transcluded content did not have an input, so create one.
				if (transcludedInput.length === 0) {
					transcludedInput = angular.element('<input name="listItem" type="text" class="form-control" />');
				}

				// Enforce a name for validation
				transcludedInput.attr('name', 'listItem');

				// Enforce a model based on repeating over the cloned items
				transcludedInput.attr('ng-model', 'items[$index]');

				// There should be an <input /> placeholder in the template
				element.find('input').replaceWith(transcludedInput);

				// Ensure that everything is updated on blur and empty fields are
				// removed
				transcludedInput.attr('ng-blur', 'didBlurFieldAtIndex($index);updateItems()');
			}
		});

		return link;
	}

	return {
		restrict: 'ACE',

		require: 'ngModel',

		// Provide access to content originally included in the directive
		transclude: true,

		// Create a child $scope inheriting from the outer $scope so that any
		// transcluded content can access outer $scope members.
		scope: true,

		// Load template from the configuration
		templateUrl: 'list-input.tpl.html',

		// Custom compilation does transclusion based on logic not available
		// to a simple ng-transclude
		compile: compile
	};
})

/**
 * @ngdoc directive
 * @name ui.listInput.directive:removeItemButton
 * @restrict ACE
 * 
 * @description 
 * Replaces the element on which the directive is applied with a standard
 * .input-group-addon button for removing the item under which it appears in
 * the list. Used internally in {@link ui.listInput.directive:uiListInput
 * uiListInput} but may also be used in custom fields for uniformity and
 * convenience.
 */
.directive('removeItemButton', function() {
	return {
		restrict: 'ACE',
		templateUrl: 'remove-item-button.tpl.html',
		replace: true
	};
});