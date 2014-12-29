/**
 * @ngDoc BS-LIB
 */

angular.module('bs-toolbox', []).
factory('HelperService', function() {
  return {
    buildWatchExpr:  function(formName, inputName) {
      var modelPath = formName+'.'+inputName;
      /*
       * is Used WHEN
       * input.$dirty && input.$touched || form.$submitted
       */
      var isUsed = '( '+modelPath + '.$dirty '+
      '&& ' + modelPath + '.$touched '+
      '|| '+formCtrl.$name+'.$submitted )';
      
      return modelPath + '.$invalid  &&  '+isUsed;
    },
    
    isOnError : function(model, form) {
      return model.$invalid 
      && ( model.$dirty && $model.$touched || form.$submitted);
    },
    
    
  };
}).
factory('MessageService', function() {
  return {
    messages: {
      'email': "Courriel non valide.",
      'required': 'Champs obligatoire',
      'nocnrs': 'Le mail doit se terminer par cnrs.fr',
      'labo': "Le code laboratoire n'est pas conforme et doit commencer par 'UMR', 'MOY' ou 'UPS"
    },
    message: function(key) {
      var msg = this.messages[key];
      if ( msg === undefined ) {
        return "undefined msg for "+key;
      }
      return msg;
    }
  };
}).
directive('bsCols', function() {
  return {
    restrict: 'A',
    priority: 10,
    controller: function($scope) {
      this.cols = {
        label: [],
        fmTag: [],
        error: []
      };

      this.getLabelClasses = function() {
        return this.cols.label;
      };

      this.getInputClasses = function() {
        return this.cols.fmTag;
      };

      this.getErrorDivClasses = function() {
        return this.cols.error;
      };
    },
    link: function(scope, iElement, iAttrs, ctrl) {
      var bsCols = iAttrs.bsCols;
      var map = scope.$eval(bsCols);
      var i, t;
      var btTypes = ['xs', 'md', 'lg'];
      var hyphenMap;
      var values;
      for (i = 0; i < btTypes.length; i++) {
        t = btTypes[i];
        hyphenMap = map[t];
        if (hyphenMap !== undefined) {
          values = hyphenMap.split('-');

          ctrl.cols.label.push('col-' + t + '-' + values[0]);
          ctrl.cols.fmTag.push('col-' + t + '-' + values[1]);

          ctrl.cols.error.push('col-' + t + '-offset-' + values[0]);
          ctrl.cols.error.push('col-' + t + '-' + values[1]);
        }
      }
    }
  };
}).
directive('formGroup', function() {
  return {
    restrict: 'E',
    transclude: true,
    scope: {
      label: '@'
    },
    controller: function($scope, MessageService, HelperService) {

      $scope.MessageService = MessageService;
      $scope.invalidInput = false;


      this.setInvalid = function(invalid) {
        $scope.invalidInput = invalid;
      };

      this.setError = function(errors) {
        $scope.errors = errors;
      };

      $scope.getMessage = function(key) {
        return MessageService.message(key);
      };

      /**
       * Adds bootstrap col-{xs|md|lg} classes
       * @param {Element} input form input
       * @param {Element} label's element
       * @param {Element} Inpt wrapping div
       */
      this.addBootstrapClasses = function(input, labelEl, divWrappingInput, divWrappingErrors) {
        var bsColsCtrl = input.controller('bsCols');
        var labelClasses;
        var inputClasses;
        var errorDivClasses;
        var i;
        if (angular.isDefined(bsColsCtrl)) {
          labelClasses = bsColsCtrl.getLabelClasses();
          inputClasses = bsColsCtrl.getInputClasses();
          errorDivClasses = bsColsCtrl.getErrorDivClasses();
        } else {
          labelClasses = ['col-md-2'];
          inputClasses = ['col-md-10'];
          errorDivClasses = ['col-md-offset-2', 'col-md-10'];
        }

        for (i = 0; i < labelClasses.length; i++) {
          labelEl.addClass(labelClasses[i]);
        }
        for (i = 0; i < inputClasses.length; i++) {
          divWrappingInput.addClass(inputClasses[i]);
        }

        for (i = 0; i < errorDivClasses.length; i++) {
          divWrappingErrors.addClass(errorDivClasses[i]);
        }
      };

      this.findErrorDiv = function(iElement) {
        var array = iElement.find('div');
        var i, e, a;
        for (i = 0; i < array.length; i++) {
          e = array[i];
          a = e.getAttribute('ng-show');
          if (a !== undefined && a === 'invalidInput') {
            return e;
          }
        }
        return undefined;
      };

    },
    require: '^form',
    templateUrl: 'form-group.html',
    dolink: function(scope, iElement, iAttrs, controller) {

      var formTags = ['input', 'select', 'textarea', 'button'];
      var i;
      var tempList;
      var input;

      for (i = 0; i < formTags.length; i++) {
        tempList = iElement.find(formTags[i]);
        if (tempList.length > 0) {
          input = angular.element(tempList[0]);
          break;
        }
      }

      if (!angular.isDefined(input)) {
        throw new Error("No Form Tag in my-imput directive");
      }


      var formCtrl = controller;
      var fmGrpCtrl = iElement.controller('formGroup');
      var modelCtrl = input.controller('ngModel');

      var labelEl = angular.element(iElement.find('label'));
      var divWrappingInput = input.parent();
      var divWrappingErrors = angular.element(fmGrpCtrl.findErrorDiv(iElement));

      fmGrpCtrl.addBootstrapClasses(input, labelEl, divWrappingInput, divWrappingErrors);

      var modelName = input.attr('ng-model');
      var inputName = input.attr("name");



      input.addClass('form-control');

      var inputPath = [formCtrl.$name, inputName, '$viewValue'].join(".");
      var modelPath = [formCtrl.$name, inputName].join(".");
      var expr = modelPath + '.$invalid  &&  (' + modelPath + '.$dirty && ' + modelPath + '.$touched || ' + formCtrl.$name + '.$submitted )';


      var errorPath = [formCtrl.$name, inputName].join(".") + '.$error';

      scope.$parent.$watch(expr, function(newValue) {
        fmGrpCtrl.setInvalid(newValue);
        fmGrpCtrl.setError(scope.$parent.$eval(errorPath));
      });


    },
    compile: function(tElement, tAttr) {
      return this.dolink;
    }
  };
});
