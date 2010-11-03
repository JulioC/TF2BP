(function($){
  $.fn.tfToolTip = function(constructor) {  
    return this.each(function(){
      var $this = $(this);
      $this.mouseover(function() {
        $this.after('<div id="tftooltip"></div>')
        var toolTip = $("#tftooltip");
        
        toolTip.css({
          'position': 'absolute',
          'text-align': 'center',
          'z-index': '2',
          'padding': '10px 15px',
          'border-width': '1px',
          'border-style': 'solid',
          'border-color': '#8A7A69 #3E3931 #191614 #3F3932',
          'background': '#2c2722',
          'background-image': '-webkit-gradient(linear, 0% 0%, 0% 100%, from(#37322b), to(#22201a))',
          'background-image': '-moz-linear-gradient(100% 100% 90deg, #22201a, #37322b)',
          '-moz-border-radius': '4px',
          '-webkit-border-radius': '4px',  
          'border-radius': '4px',
          '-moz-box-shadow': '0px 0px 12px #000000',
          '-webkit-box-shadow': '0px 0px 12px #000000',
          'box-shadow': '0px 0px 12px #000000'      
        });
        
        if(constructor) {
          constructor(toolTip);
        }
        
        var offset = $this.offset();
        var bottom = offset.top + $this.outerHeight();
        var center = offset.left + $this.outerWidth()/2;
          
        var pos = {
          top: bottom + 10,
          left: center - toolTip.outerWidth()/2
        };
        
        if((pos.top + toolTip.outerHeight()) > ($(window).height() + $(document).scrollTop() - 15)) {
          pos.top = bottom - $this.outerHeight() - toolTip.outerHeight() - 10;
        }
        
        if((pos.left) < $(document).scrollLeft() + 20) {
          pos.left = $(document).scrollLeft() + 15;
        }
        else if((pos.left + toolTip.outerWidth()) > ($(window).width() + $(document).scrollLeft() - 20)) {
          pos.left = $(window).width() + $(document).scrollLeft() - toolTip.outerWidth() - 15;
        }
        
        toolTip.css({'top': pos.top, 'left': pos.left});
        
        $this.mouseout(function(event){
          toolTip.remove();
          $this.unbind(event);
        });
      });
    });
  };
})(jQuery);

