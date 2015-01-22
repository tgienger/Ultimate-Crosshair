angular.module('app')
.directive('draggable', function() {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {

      var thisElement = element,
          moveTimer;

      function mouseMoveHandler(event) {
        event.preventDefault();
        var newTop = thisElement.startTop + (event.pageY - thisElement.startY);
        thisElement[0].style.top = newTop;
      }
      function mouseUpHandler() {
        clearTimeout(moveTimer);
        angular.element(document).unbind('mousemove', mouseMoveHandler);
        angular.element(document).unbind('mouseup', mouseUpHandler);
      }

      thisElement.bind('mousedown', function(event) {
        event.preventDefault();

        angular.element(document).bind('mouseup', mouseUpHandler);
        moveTimer = setTimeout(function() {
          thisElement.startY = event.pageY;
          thisElement.startTop = thisElement.offset().top;

          angular.element(document).bind('mousemove', mouseMoveHandler);
        }, 200);

      });

    }
  }
})
