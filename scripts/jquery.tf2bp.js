$(document).ready(function(){
  var tf2bp = function(){    
    var pageCount = 4; // Pages/backpack
    var itemCount = 50; // Items/page
    var itemImageMask = null; 
 
    var createBox = function(parent, id){
	    if(typeof parent === 'string') {
        parent = $(parent);
      }
		
      parent.append('<div class="bpitem" id="' + id + '"></div>');
    }
  
    var fillBox = function(box, data) {
      if(typeof box === 'string') {
        box = $(box);      
      }
      
      if(data.quality) {
        box.addClass('bp'+data.quality);
      }
      
      box.append('<img src="' + getItemImage(data.image, data) + '" alt="' + data.name + '"/>');
       
      if(data.quantity) {
        box.append('<span class="bplimit">' + data.quantity + '</span>'); 
      }
      
      if(data.custom_desc) {
        box.append('<span class="bpdesc" title="' + data.custom_desc + '"></span>'); 
      }
      
      if(data.custom_name) {
        box.append('<span class="bpname" title="' + data.custom_name + '"></span>'); 
      }
      
      if(data.color) {
        box.append('<span class="bpsplat bpcol' + data.color + '"></span>'); 
      }
      
      if(data.gift) {
        box.append('<a href="#/profiles/' + data.gift + '" class="bpgift">Gift</a>'); 
      }
      
      if(data.equipped && data.equipped.length) {
        box.append('<span class="bpequipped">Equipped</span>');
      }
      
      box.tfToolTip(function(toolTip) {
        toolTip.addClass('bpinfo');
      
        if(data.quality) {
          toolTip.addClass('bp'+data.quality);
        }
        
        if(data.custom_name) {
          toolTip.append('<span class="bpname bpcustom">"' + data.custom_name + '"</span>');
          toolTip.append('<span class="bpname bpreal">' + data.name + '</span>');
        }
        else {
          toolTip.append('<span class="bpname">' + data.name + '</span>');        
        }
        
        if(typeof data.level === 'undefined') {
          toolTip.append('<span class="bptitle">' + data.type + '</span>'); 
        }
        else {
          toolTip.append('<span class="bptitle">Level ' + data.level + ' ' + data.type + '</span>'); 
        }
        
        if(data.custom_desc) {
          toolTip.append('<span class="bpdesc">' + data.custom_desc + '</span>'); 
        }
        
        for(var a in data.attributes) {
          var att = data.attributes[a];
          toolTip.append('<span class="bpattribute bp' + att.type + '">' + att.name + '</span>'); 
        }
        
        if(!data.tradable) {
          toolTip.append('<span class="bptradable">(Not Tradable)</span>'); 
        }
        
        if(data.quantity) {
          toolTip.append('<span class="bplimit">This is a limited use item. Uses: ' + data.quantity + '</span>'); 
        }
        
        if(data.used_by.length) {
          var used_by = toolTip.append('<ul class="bpusedby"></ul>').find(".bpusedby");
          for(var c in data.used_by) {
              used_by.append('<li class="bp' + data.used_by[c] + '">' + data.used_by[c] + '</li>');
          }
          for(var c in data.equipped) {
            $('.bp'+data.equipped[c]).addClass('bpactive');
          }     
        }        
      });
    };
    
    // If we have a imageMask function, apply it
    var getItemImage = function(str, data) {
      return itemImageMask ? itemImageMask(str, data) : str;
    }
    
    return {
      loadBP: function(element, id, callback) {    
        if(typeof element === 'string') {
          element = $(element);      
        }
        
        var date = new Date();
        var bpuid = date.getMilliseconds();
        element.append('<div class="bpwrapper" id="bp' + bpuid + '"></div>');
        
        // Find the backpack element
        var backpack = $('#bp'+bpuid);
        
        var n = 1;
        for(var x = 1; x <= pageCount; x++) {
          // Create, find and hide each page, so we can make a cool effect when everything is loaded 
          var page = backpack.append('<div class="bppage" id="bppage-' + x + '"></div>').find('#bppage-' + x).hide();
          
          // Each page has 50 items named "bpitem-1", "bpitem-2", ...
          for(var y = 0; y < itemCount; y++, n++) {
            createBox(page, ('bpitem-' + n + '-' + bpuid));
          }
        }       
        
        $.steam.tf2items.getItems(id, function(data){          
          for(var i in data.items) {
            var itm = data.items[i];
            fillBox(('#bpitem-' + itm.position + '-' + bpuid), itm);            
          }
          
          // Fix the boxes, since we use float CSS prop.
          backpack.find('.bppage').append('<div style="clear:both"></div>');
          
          if(data.invalid.length) {
            var n = 1;
            var inv = backpack.append('<div class="bpinvalid"></div>').find('.bpinvalid').hide();
            for(var i in data.invalid) {
              var itm = data.invalid[i];
              createBox(inv, ('bpitem-i' + n + '-' + bpuid));
              fillBox(('#bpitem-i' + n + '-' + bpuid), itm);
              n++;
            }
            inv.append('<div style="clear:both"></div>');
          }
          
          backpack.siblings().remove();
          backpack.find('.bppage, .bpinvalid').fadeIn('slow');
          
          callback();        
        });
      },
      loadList: function(element, callback) {       
        if(typeof element === 'string') {
          element = $(element);      
        }
        
        var date = new Date();
        var bpuid = date.getMilliseconds();
        element.append('<div class="bpwrapper" id="bp' + bpuid + '"></div>');
        
        // Find the backpack element
        var backpack = $('#bp'+bpuid);    
          
        $.steam.tf2items.getItemList(function(items){
          var n = 1; 
          // Each page has 50 items named "bpitem-1", "bpitem-2", ...
          for(var i in items) {
            var itm = items[i];    
            createBox(backpack, ('bpitem-' + n + '-' + bpuid));
            fillBox(('#bpitem-' + n + '-' + bpuid), itm);
            n++;
          }
          
          // Fix the boxes, since we use float CSS prop.
          backpack.append('<div style="clear:both"></div>');
          
          backpack.siblings().remove();
          backpack.find('.bppage, .bpinvalid').fadeIn('slow');
          
          callback();
        });
      },
      setItemImageMask: function(_itemImageMask){
        itemImageMask = _itemImageMask;
      }
    }
  }();
  
  $.tf2bp = tf2bp;
});