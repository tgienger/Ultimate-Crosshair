angular.module('app', ['uiSlider'])
.controller('crossController', function ($scope, $window) {
  $scope.color = 'red'
  $scope.width = 26
  $scope.height = $scope.width
  $scope.marginTop = -($scope.height / 2 )
  $scope.marginLeft = -($scope.width / 2)
  $scope.crossColor = '#ff0000'
  $scope.dotColor = '#ff0000'
  $scope.cStroke = '#ff0000'
  $scope.cStrokeWidth = 10
  $scope.pathStroke = $scope.crossColor
  $scope.pathStrokeWidth = 10
  $scope.outerThickness = 1.75
  $scope.outerLength =  2.8
  // var win;
  $scope.close = function () {
	overwolf.windows.getCurrentWindow(function (result) {
      if (result.status == "success") {
        overwolf.windows.close(result.window.id, function (result) {})
      }
    });
  };

  $scope.fitScreen = function () {
	var newWidth = window.screen.width;
	var newHeight = window.screen.height;
    overwolf.windows.getCurrentWindow(function (result) {
      if (result.status == "success") {
		overwolf.windows.changeSize(result.window.id, newWidth, newHeight, function () {})
      }
    });

  };

  var bigger = document.getElementById('biggerButton')
  bigger.addEventListener('click', function (event) {
    $scope.width += 1
    $scope.height += 1
    alert('width: ' + $scope.width + ' margin: ' + $scope.marginLeft)
  })

  var smaller = document.getElementById('smallerButton')
  smaller.addEventListener('click', function (event) {
    $scope.width -= 1
    $scope.height -= 1
  })

  $scope.setColor = function (color) {
    $scope.crossColor = color
    $scope.cStroke = $scope.crossColor
    $scope.pathStroke = $scope.crossColor
  }
  
  $scope.position = function () {
	$scope.marginTop = -($scope.width / 2 + 1)
	$scope.marginLeft = -($scope.width / 2 + 1)
  }
  
  var spinning = false
  $scope.spinner = function () {
	if (!spinning) {
		spinning = true
		$scope.spinit = 'fa fa-spin'	
	} else {
		spinning = false
		$scope.spinit = ''
	}
  }
  
  $scope.match = function () {
	$scope.dotColor = $scope.crossColor;
  }

}) // end controller
