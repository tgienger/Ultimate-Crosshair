angular.module('app', ['ui.slider'])
.controller('crossController', function ($scope, $window, $timeout) {


  $scope.showMenu          = false;
  $scope.color             = 'red';
  $scope.width             = window.localStorage.crossWidth || 26;
  $scope.height            = $scope.width;
  $scope.marginTop         = -($scope.height / 2 );
  $scope.marginLeft        = -($scope.width / 2);
  $scope.crossColor        = window.localStorage.crossColor || '#ff0000';
  $scope.dotColor          = window.localStorage.dotColor || '#ff0000';
  $scope.spinit            = window.localStorage.spinit || '';
  $scope.cross             = {};
  $scope.cross.outerLength = window.localStorage.outerLength || 2.8;


  // Startup fitting to screen resolution
  // re-check every second for changes in resolution
  var w;
  var h;

  (function fitScreen() {

    var newW = window.screen.width;
    var newH = window.screen.height;

    if (w != newW) {

      overwolf.windows.getCurrentWindow(function(result) {

        if (result.status === 'success') {
          overwolf.windows.changeSize(result.window.id, newW, newH, function () {});
          overwolf.windows.changePosition(result.window.id, 0, 0, function () {});
          w = newW;
          h = newH;
        }
      });

    }

    $timeout(fitScreen, 1000);

  })();



  // Close Ultimate Crosshair app
  $scope.close = function () {

  	overwolf.windows.getCurrentWindow(function (result) {
        if (result.status == "success") {
          overwolf.windows.close(result.window.id, function (result) {})
        }
      });

  };



  // Set the color of the cross
  $scope.setColor = function (color) {

    $scope.crossColor = color

  };




  // Remove all color from the cross
  $scope.clearCross = function() {
    if ($scope.crossColor === 'rgba(0,0,0,0)') {
      $scope.crossColor = '#FF0000';
    } else {
      $scope.crossColor = 'rgba(0,0,0,0)';
    }
  };




  // remove al color from the center dot
  $scope.clearDot = function() {
    if ($scope.dotColor === 'rgba(0,0,0,0)') {
      $scope.dotColor = '#FF0000';
    } else {
      $scope.dotColor = 'rgba(0,0,0,0)';
    }
  };




  // start/stop spinning the crosshair
  // and stop rotate
  var spinning = window.localStorage.spinning || false;
  var rotated  = window.localStorage.rotated || false;
  $scope.spinner = function () {
    rotated = false;
  	if (!spinning) {
  		spinning = true
  		$scope.spinit = 'fa fa-spin'
  	} else {
  		spinning = false
  		$scope.spinit = ''
  	}
  }



  // rotate crosshair 45 deg
  // and stop spinning
  $scope.rotate = function() {
    spinning = false;
    if (!rotated) {
      rotated = true;
      $scope.spinit = 'fa-rotate-45';
    } else {
      rotated = false;
      $scope.spinit = '';
    }
  }



  // Actively re-center the crosshair
  // when changing it's size
  $scope.$watch('width', function() {
    $scope.marginTop  = -($scope.width / 2);
    $scope.marginLeft = -($scope.width / 2);
  });



  // save
  $scope.save = function() {
    window.localStorage.rotated     = rotated;
    window.localStorage.spinning    = spinning;
    window.localStorage.crossWidth  = $scope.width;
    window.localStorage.spinit      = $scope.spinit;
    window.localStorage.dotColor    = $scope.dotColor;
    window.localStorage.crossColor  = $scope.crossColor;
    window.localStorage.outerLength = $scope.cross.outerLength;
    $scope.showMenu = false;
  }



  // Matches the center dot to the crosshair color
  $scope.match = function () {
  	$scope.dotColor = $scope.crossColor;
  }

}) // end controller
