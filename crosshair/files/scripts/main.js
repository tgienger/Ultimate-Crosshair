angular.module('app', ['ngAnimate'])
.controller('crossController', function ($scope, $window, $timeout) {




  $scope.showMenu = false;
  $scope.messages = [];




  // Initialize Snap.svg
  var s = Snap();


  // Outer Circle Variables
  $scope.outer_circle             = {};
  $scope.outer_circle.show        = parseInt(window.localStorage.outerCircleShow) == 0 ? 0 : 1;
  $scope.outer_circle.fill        = window.localStorage.outerCircleFill || 'none';
  $scope.outer_circle.stroke      = window.localStorage.outerCircleColor || '#ff0001';
  $scope.outer_circle.strokeWidth = window.localStorage.outerCircleStrokeWidth || 2;
  $scope.outer_circle.radius      = window.localStorage.outerCircleWidth || 13;
  $scope.outer_circle.visible     = $scope.outer_circle.show === 0 ? 'hidden' : 'visible';

  // Center Dot Variables
  $scope.center_dot             = {};
  $scope.center_dot.show        = parseInt(window.localStorage.dotShow) == 0 ? 0 : 1;
  $scope.center_dot.stroke      = 'none';
  $scope.center_dot.strokeWidth = 0;
  $scope.center_dot.fill        = window.localStorage.dotColor || '#ff0001';
  $scope.center_dot.radius      = window.localStorage.dotRadius || 2;
  $scope.center_dot.visible     = $scope.center_dot.show === 0 ? 'hidden' : 'visible';

  // Cross Variables
  $scope.cross                    = {};
  $scope.cross.bar                = {};

  $scope.cross.bar.top            = {};
  $scope.cross.bar.top.show       = parseInt(window.localStorage.topBarShow) == 0 ? 0 : 1;
  $scope.cross.bar.top.color      = window.localStorage.barTopColor || 'red';
  $scope.cross.bar.top.visible    = $scope.cross.bar.top.show === 0 ? 'hidden' : 'visible';

  $scope.cross.bar.right          = {};
  $scope.cross.bar.right.show     = parseInt(window.localStorage.rightBarShow) == 0 ? 0 : 1;
  $scope.cross.bar.right.color    = window.localStorage.barRightColor || 'red';
  $scope.cross.bar.right.visible  = $scope.cross.bar.right.show === 0 ? 'hidden' : 'visible';

  $scope.cross.bar.bottom         = {};
  $scope.cross.bar.bottom.show    = parseInt(window.localStorage.bottomBarShow) == 0 ? 0 : 1;
  $scope.cross.bar.bottom.color   = window.localStorage.barBottomColor || 'red';
  $scope.cross.bar.bottom.visible = $scope.cross.bar.bottom.show === 0 ? 'hidden' : 'visible';

  $scope.cross.bar.left           = {};
  $scope.cross.bar.left.show      = parseInt(window.localStorage.leftBarShow) == 0 ? 0 : 1;
  $scope.cross.bar.left.color     = window.localStorage.barLeftColor || 'red';
  $scope.cross.bar.left.visible   = $scope.cross.bar.left.show === 0 ? 'hidden' : 'visible';

  $scope.cross.bar.fill           = window.localStorage.barFill || '#ff0000';
  $scope.cross.bar.length         = window.localStorage.barLength || 25;
  $scope.cross.bar.thickness      = window.localStorage.barThickness || 5;
  $scope.cross.bar.fromCenter     = window.localStorage.barFromCenter || 5;

  var rotated = parseInt(window.localStorage.crossRotated);



  // Build Crosshair
  function buildCrossHair() {


    // Outer Circle
    $scope.outerCircle = s.circle('50%', '50%', $scope.outer_circle.radius).attr({
      fill: $scope.outer_circle.fill,
      stroke: $scope.outer_circle.stroke,
      visibility: $scope.outer_circle.visible,
      strokeWidth: $scope.outer_circle.strokeWidth
    });




    // Center Dot
    $scope.centerDot = s.circle('50%', '50%', $scope.center_dot.radius).attr({
      fill: $scope.center_dot.fill,
      visibility: $scope.center_dot.visible
    });




    // Cross
    $scope.cross.top = s.rect('50%', '50%', $scope.cross.bar.thickness, $scope.cross.bar.length).attr({
      fill: $scope.cross.bar.top.color,
      visibility: $scope.cross.bar.top.visible,
      transform: 't' + [-($scope.cross.bar.thickness / 2), -$scope.cross.bar.length - $scope.cross.bar.fromCenter]
    });

    $scope.cross.bottom = s.rect('50%', '50%', parseInt($scope.cross.bar.thickness), $scope.cross.bar.length).attr({
      fill: $scope.cross.bar.bottom.color,
      visibility: $scope.cross.bar.bottom.visible,
      transform: 't' + [-$scope.cross.bar.thickness / 2, $scope.cross.bar.fromCenter],
    });

    $scope.cross.right  = s.rect('50%', '50%', $scope.cross.bar.length, $scope.cross.bar.thickness).attr({
      fill: $scope.cross.bar.right.color,
      visibility: $scope.cross.bar.right.visible,
      transform: 't' + [$scope.cross.bar.fromCenter, -$scope.cross.bar.thickness / 2]
    });

    $scope.cross.left   = s.rect('50%', '50%', $scope.cross.bar.length, $scope.cross.bar.thickness).attr({
      fill: $scope.cross.bar.left.color,
      visibility: $scope.cross.bar.left.visible,
      transform: 't'+[-$scope.cross.bar.length - $scope.cross.bar.fromCenter, -($scope.cross.bar.thickness / 2)]
    });



    $scope.cGroup = s.g($scope.cross.top, $scope.cross.bottom, $scope.cross.right, $scope.cross.left);
    if (rotated) {
      $scope.cGroup.transform('r45');
    }
    
  }

  function subtract(num, limit) {
    num = parseInt(num) - 1;
    if (num < limit) {
      num = limit;
    }
    return num;
  }

  function add(num, limit) {
    num = parseInt(num) + 1;
    if (num > limit) {
      num = limit
    }
    return num;
  }


  $scope.lowerSpeed = function () {
    $scope.spinSpeed = subtract($scope.spinSpeed, 50);
  }

  $scope.increaseSpeed = function () {
    $scope.spinSpeed = add($scope.spinSpeed, 5000);
  }

  $scope.decrease = function (x) {
    x = subtract(x, 1);
    $scope.cross.bar.length = x;
    $scope.setCrossLength();
  };
  $scope.increase = function (x) {
    x = add(x, 100);
    $scope.cross.bar.length = x;
    $scope.setCrossLength();
  };

  $scope.spreadDecrease = function (x) {
    x = subtract(x, 1);
    $scope.cross.bar.fromCenter = x;
    $scope.setCrossDistance($scope.cross.bar.fromCenter);
  };
  $scope.spreadIncrease = function (x) {
    x = add(x, 100);
    $scope.cross.bar.fromCenter = x;
    $scope.setCrossDistance($scope.cross.bar.fromCenter);
  };
  $scope.thicknessDecrease = function (x) {
    x = subtract(x, 1);
    $scope.cross.bar.thickness = x;
    $scope.setCrossThickness($scope.cross.bar.thickness);
  };
  $scope.thicknessIncrease = function (x) {
    x = add(x, 100);
    $scope.cross.bar.thickness = x;
    $scope.setCrossThickness($scope.cross.bar.thickness);
  };



  // Set Cross bar length
  $scope.setCrossLength = function() {
    $scope.cross.top.attr({
      height: $scope.cross.bar.length
    });
    $scope.cross.bottom.attr({
      height: $scope.cross.bar.length
    });
    $scope.cross.right.attr({
      width: $scope.cross.bar.length
    });
    $scope.cross.left.attr({
      width: $scope.cross.bar.length
    });
    $scope.setCrossDistance($scope.cross.bar.fromCenter);
  };

  // Set the crossbar thickness
  $scope.setCrossThickness = function () {
    $scope.cross.top.attr({
      width: $scope.cross.bar.thickness
    });
    $scope.cross.right.attr({
      height: $scope.cross.bar.thickness
    });
    $scope.cross.bottom.attr({
      width: $scope.cross.bar.thickness
    });
    $scope.cross.left.attr({
      height: $scope.cross.bar.thickness
    });
    $scope.setCrossDistance($scope.cross.bar.fromCenter);
  };

  // Set the cross bar spread
  $scope.setCrossDistance = function(x) {
    $scope.cross.top.attr({
      transform: 't' + [-($scope.cross.bar.thickness / 2), -$scope.cross.bar.length - x]
    });
    $scope.cross.bottom.attr({
      transform: 's'+[-1, -1] + 't' + [$scope.cross.bar.thickness / 2, -x]
    });
    $scope.cross.right.attr({
      transform: 's'+[-1, -1] + 't' + [-x, $scope.cross.bar.thickness / 2]
    });
    $scope.cross.left.attr({
      transform: 't'+[-$scope.cross.bar.length - x, -($scope.cross.bar.thickness / 2)]
    });

  };




  // Close Ultimate Crosshair app
  $scope.close = function () {

  	overwolf.windows.getCurrentWindow(function (result) {
        if (result.status == "success") {
          overwolf.windows.close(result.window.id, function (result) {})
        }
      });

  };




  // Hide Element
  $scope.hideElement = function(el, btn) {
    if (el.attr('visibility') === 'hidden') {
      el.attr({visibility: 'visible'})
      btn.show = 1;
    } else {
      el.attr({visibility: 'hidden'})
      btn.show = 0;
    }
  };




  // start/stop spinning the crosshair
  // and stop rotate
  $scope.spinSpeed = parseInt(window.localStorage.spinSpeed) || 1000;
  var centerX = window.screen.width / 2;
  var centerY = window.screen.height / 2;
  var spinning = 1;

  $scope.spinner = function () {
    rotated = 0;
    spinning = !spinning;
    (function spin() {
      var speed = parseInt($scope.spinSpeed);
      if (spinning) {
        $scope.cGroup.stop().attr({ transform: 'rotate(0 centerX centerY' });
      } else {
        $scope.cGroup.stop().animate({
          transform: 'r360, centerX, centerY'
        }, speed,
        function () {
          $scope.cGroup.attr({ transform: 'rotate(0 centerX centerY'} );
          spin();
        });
      }
      
    })();
  };



  // rotate crosshair 45 deg
  // and stop spinning
  $scope.rotate = function() {
    $scope.cGroup.stop();
    spinning = 1;
    if (!rotated) {
      $scope.cGroup.transform('r45');
      rotated = 1;
    } else {
      $scope.cGroup.transform('-r45');
      rotated = 0;
    }
  };




  // change radius function
  $scope.changeRadius = function (el, rad) {
    el.attr({
      r: rad
    });
  };



  // Change Fill Color
  $scope.changeFill = function (el, color) {
    el.attr({
      fill:color
    });
  };



  // Change Stroke Color
  $scope.changeStroke = function (el, color) {
    el.attr({
      stroke:color
    });
  };



  // Change Stroke Width
  $scope.changeStrokeWidth = function (el, width) {
    el.attr({
      strokeWidth:width
    });
  };



  // save
  $scope.save = function() {
    $scope.messages = [];

    window.localStorage.outerCircleShow        = $scope.outer_circle.show;
    window.localStorage.outerCircleColor       = $scope.outer_circle.stroke;
    window.localStorage.outerCircleStrokeWidth = $scope.outer_circle.strokeWidth;
    window.localStorage.outerCircleWidth       = $scope.outer_circle.radius;

    window.localStorage.dotShow                = $scope.center_dot.show;
    window.localStorage.dotColor               = $scope.center_dot.fill;
    window.localStorage.dotRadius              = $scope.center_dot.radius;

    window.localStorage.topBarShow             = $scope.cross.bar.top.show;
    window.localStorage.rightBarShow           = $scope.cross.bar.right.show;
    window.localStorage.bottomBarShow          = $scope.cross.bar.bottom.show;
    window.localStorage.leftBarShow            = $scope.cross.bar.left.show;
    window.localStorage.barFill                = $scope.cross.bar.fill;
    window.localStorage.barLength              = $scope.cross.bar.length;
    window.localStorage.barThickness           = $scope.cross.bar.thickness;
    window.localStorage.barTopColor            = $scope.cross.bar.top.color;
    window.localStorage.barRightColor          = $scope.cross.bar.right.color;
    window.localStorage.barBottomColor         = $scope.cross.bar.bottom.color;
    window.localStorage.barLeftColor           = $scope.cross.bar.left.color;
    window.localStorage.barFromCenter          = $scope.cross.bar.fromCenter;

    window.localStorage.crossRotated           = rotated;
    window.localStorage.spinning               = spinning;
    window.localStorage.spinSpeed              = $scope.spinSpeed;

    $scope.messages.push("Save Complete");
  }



  // close menu
  $scope.closeMenu = function() {
    $scope.showMenu = false;
    $scope.messages = [];
  }



  // Matches the center dot to the crosshair color
  $scope.match = function () {
    $scope.changeFill($scope.cross.top, $scope.cross.bar.top.color);
    $scope.changeFill($scope.cross.right, $scope.cross.bar.top.color);
    $scope.changeFill($scope.cross.bottom, $scope.cross.bar.top.color);
    $scope.changeFill($scope.cross.left, $scope.cross.bar.top.color);
    $scope.changeFill($scope.centerDot, $scope.cross.bar.top.color);
    $scope.changeStroke($scope.outerCircle, $scope.cross.bar.top.color);
    $scope.center_dot.fill = $scope.outer_circle.stroke = $scope.cross.bar.bottom.color = $scope.cross.bar.right.color = $scope.cross.bar.left.color = $scope.cross.bar.top.color;
  };




  // Remove message
  $scope.removeMessage = function (i) {
    $scope.messages.splice(i, 1);
  }




  // Startup fitting to screen resolution
  var w;
  var h;

  function fitScreen() {

    var newW = window.screen.width;
    var newH = window.screen.height;

    if (w != newW) {
      overwolf.windows.getCurrentWindow(function(result) {
        if (result.status === 'success') {
          overwolf.windows.changeSize(result.window.id, newW, newH, function () {});
          overwolf.windows.changePosition(result.window.id, 0, 0, function () {});
          w = newW;
          h = newH;

          // Now build the crosshair
          buildCrossHair();
        }
      });
    }
  }




  fitScreen();
  
  $("body *").addClass("noselect");




}) // end controller
