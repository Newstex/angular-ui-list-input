'use strict';

var assert = chai.assert,
expect = chai.expect,
should = chai.should(),
spy = sinon.spy,
stub = sinon.stub;

describe('ui.listInput', function() {

	var $scope, $directiveScope, $timeout;

	beforeEach(module('ui.listInput'));

	beforeEach(inject(function($rootScope, _$timeout_) {
		$scope = $rootScope.$new();
		$timeout = _$timeout_;
	}));

	function compileDirective(template) {
		var element;

		inject(function($compile) {
			if (!template) {
				template = '<div ui-list-input ng-model="sampleData"></div>';
			}

			element = $compile(template)($scope);
		});

		$scope.$digest();
		$directiveScope = element.scope();

		return element;
	}

	describe('upon initialization', function() {

		it('with attribute syntax should have inputs', function() {
			var element = compileDirective('<div ui-list-input ng-model="sampleData"></div>');
			
			element.find(':input').should.have.length(1);
		});

		it('with element syntax should have inputs', function() {
			var element = compileDirective('<ui-list-input ng-model="sampleData"></ui-list-input>');
			
			element.find(':input').should.have.length(1);
		});

		it('with class syntax should have inputs', function() {
			var element = compileDirective('<div class="ui-list-input" ng-model="sampleData"></div>');
			
			element.find(':input').should.have.length(1);
		});

		it('should have inputs for each item plus one for a new item', function() {
			$scope.sampleData = ['A', 'B', 'C'];

			var element = compileDirective();
			
			element.find(':input').should.have.length(4);
		});

		it('should have one input when there are no items', function() {
			$scope.sampleData = [];

			var element = compileDirective();
			
			element.find(':input').should.have.length(1);
		});

		it('should have one input when the model is not an array', function() {
			$scope.sampleData = {foo: 'bar'};

			var element = compileDirective();
			
			element.find(':input').should.have.length(1);
		});

		it('should not show inputs for non-numeric falsy items', function() {
			$scope.sampleData = ['A', '', null, undefined, false, 0, 'B'];

			var element = compileDirective();
			
			// 0 is falsy but numeric and therefore may be a significant value
			element.find(':input').should.have.length(4);
		});

		it('should have one input when items are undefined', function() {
			var element = compileDirective();
			
			element.find(':input').should.have.length(1);
		});

	});

	describe('upon external list changes', function() {

		it('should update when an item is removed', function() {
			$scope.sampleData = ['A', 'B', 'C'];

			var element = compileDirective();
			
			element.find(':input').should.have.length(4);

			$scope.sampleData.pop();
			$scope.$digest();

			element.find(':input').should.have.length(3);
		});

		it('should update when an item is added', function() {
			$scope.sampleData = ['A', 'B', 'C'];

			var element = compileDirective();
			
			element.find(':input').should.have.length(4);

			$scope.sampleData.push('D');
			$scope.$digest();

			element.find(':input').should.have.length(5);
		});

		it('should not update when non-numeric falsy items are added', function() {
			$scope.sampleData = ['A', 'B', 'C'];

			var element = compileDirective();
			
			element.find(':input').should.have.length(4);

			$scope.sampleData.push('');
			$scope.sampleData.push(null);
			$scope.sampleData.push(undefined);
			$scope.sampleData.push(false);
			$scope.$digest();

			element.find(':input').should.have.length(4);
		});

		it('should update when items are reassigned', function() {
			$scope.sampleData = ['A', 'B', 'C'];

			var element = compileDirective();
			
			element.find(':input').should.have.length(4);

			$scope.sampleData = ['D', 'E', 'F'];
			$scope.$digest();

			element.find(':input').should.have.length(4);
		});

		it('should update when items are assigned asynchronously', function() {
			var element = compileDirective();
			
			element.find(':input').should.have.length(1);

			$scope.sampleData = ['A', 'B', 'C'];
			$scope.$digest();

			element.find(':input').should.have.length(4);
		});

	});

	describe('UI', function() {

		var element;

		beforeEach(function() {
			$scope.sampleData = ['A', 'B', 'C'];

			element = compileDirective();
		});

		function fieldAtIndex(fieldIndex) {
			return element.find(':input').eq(fieldIndex);
		}

		function setValueOfFieldAtIndex(fieldIndex, value) {
			fieldAtIndex(fieldIndex)
				.val(value)
				.triggerHandler('input');

			$scope.$digest();
		}

		function blurFieldAtIndex(fieldIndex) {
			fieldAtIndex(fieldIndex)
				.triggerHandler('blur');

			$timeout.flush();
		}

		describe('should update properly when the user', function() {

			it('changes the value of a field', function() {
				setValueOfFieldAtIndex(1, 'bar');

				element.find(':input').should.have.length(4);
				$scope.sampleData.should.deep.equal(['A', 'bar', 'C']);
			});

			it('clears a field but has not yet blurred', function() {
				setValueOfFieldAtIndex(0, '');

				element.find(':input').should.have.length(4);
				$scope.sampleData.should.deep.equal(['', 'B', 'C']);
			});

			it('clears a field and blurs it', function() {
				setValueOfFieldAtIndex(0, '');
				blurFieldAtIndex(0);

				element.find(':input').should.have.length(3);
				$scope.sampleData.should.deep.equal(['B', 'C']);
			});

			it('adds an item', function() {
				setValueOfFieldAtIndex(3, 'D');

				element.find(':input').should.have.length(5);
				$scope.sampleData.should.deep.equal(['A', 'B', 'C', 'D']);
			});

			it('removes an item with the delete button', function() {
				element.find('[ng-click]').eq(0).triggerHandler('click');

				$timeout.flush();

				element.find(':input').should.have.length(3);
				$scope.sampleData.should.deep.equal(['B', 'C']);
			});

		});

		describe('should maintain proper focus when the user', function() {

			beforeEach(function() {
				spy($directiveScope, 'focusFieldAtIndex');
				spy($directiveScope, 'updateItems');
			});

			it('removes the focused item with the delete button', function() {
				var itemToDelete = 1;
				fieldAtIndex(itemToDelete).triggerHandler('blur');
				$directiveScope.removeItemAtIndex(itemToDelete);

				$timeout.flush();

				element.find(':input').should.have.length(3);
				$directiveScope.focusFieldAtIndex.should.have.been.calledOnce.and.calledWith(2);
			});

			it('removes an item above the focused item with the delete button', function() {
				var itemToDelete = 1;
				fieldAtIndex(itemToDelete - 1).triggerHandler('blur');
				$directiveScope.removeItemAtIndex(itemToDelete);

				$timeout.flush();

				element.find(':input').should.have.length(3);
				$directiveScope.focusFieldAtIndex.should.have.been.calledOnce.and.calledWith(itemToDelete - 1);
			});

			it('removes an item below the focused item with the delete button', function() {
				var itemToDelete = 1;
				fieldAtIndex(itemToDelete + 1).triggerHandler('blur');
				$directiveScope.removeItemAtIndex(itemToDelete);

				$timeout.flush();

				element.find(':input').should.have.length(3);
				$directiveScope.focusFieldAtIndex.should.have.been.calledOnce.and.calledWith(itemToDelete);
			});

			it('focuses the previous field after clearing a field', function() {
				var itemToDelete = 1;
				stub($directiveScope, 'indexOfFocusedField').returns(itemToDelete - 1);
				setValueOfFieldAtIndex(itemToDelete, '');
				fieldAtIndex(itemToDelete).triggerHandler('blur');

				$timeout.flush();

				element.find(':input').should.have.length(3);

				// The removed item was lower in the list, so the focus is
				// already accurate
				$directiveScope.focusFieldAtIndex.should.not.have.been.called();
			});

			it('focuses the next field after clearing a field', function() {
				var itemToDelete = 1;
				stub($directiveScope, 'indexOfFocusedField').returns(itemToDelete + 1);
				setValueOfFieldAtIndex(itemToDelete, '');
				fieldAtIndex(itemToDelete).triggerHandler('blur');

				$timeout.flush();

				element.find(':input').should.have.length(3);
				$directiveScope.focusFieldAtIndex.should.have.been.calledOnce.and.calledWith(itemToDelete);
			});

			it('clears a field when no fields are focused', function() {
				var itemToDelete = 1;
				stub($directiveScope, 'indexOfFocusedField').returns(-1);
				setValueOfFieldAtIndex(itemToDelete, '');
				fieldAtIndex(itemToDelete).triggerHandler('blur');

				$timeout.flush();

				element.find(':input').should.have.length(3);
				$directiveScope.focusFieldAtIndex.should.not.have.been.called;
			});

		});
	});

});
