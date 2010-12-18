$(function(){
  // Functions to use the Status bar
  var status = (function(){
    var busy = false;
    var timer = null;
    var statusBar = $('#status');
    var showTime = 5000;
    
    var setStatus = function(message, type) {
      statusBar.html('<span class="' + type + '">' + message + '</span>').fadeIn();
    }
    
    return {
      error: function(message) {
        if(timer) {
          timer.clearTimeout();
          timer = null;
        }
        timer = setTimeout(function(){
          timer = null;
          status.clear();
        }, showTime);
        setStatus(message, 'error');
      },
      loading: function(message) {
        setStatus((message || 'Loading...'), 'loading');      
        busy = true;
      },
      clear: function(force) {
        if(!timer && !force){
          statusBar.slideUp(function(){
            $(this).html('');
          });
        }
        busy = false;
      },
      busy: function() {
        return busy;
      }
    }
  })();
  
  // Manage the content for each section
  var content = (function() {
    var wrapper = $('#content');
    
    var banner = function(data) {
      if(!data) {
        $('#profile').hide();
        $('#title').show();
      }
      else {
        var profileLink = 'http://steamcommunity.com/profiles/'+data.id;
        $('#profile').html('').attr('class', data.status);
        $('#profile').append('<a href="' + profileLink + '" class="avatar"><img src="' + data.avatar + '" /></a>');
        $('#profile').append('<div class="info"></div>');
      
        $("#profile .info").append('<a href="' + profileLink + '" class="name">' + data.name + '</a>');
        $("#profile .info").append('<ul></ul>');
       
        $("#profile .info ul").append('<li><a href="' + profileLink + '" class="profile">View Profile</a></li>');  
        $("#profile .info ul").append('<li><a href="steam://friends/add/' + data.id + '" class="add">Add on Steam</a></li>');  
        $("#profile .info ul").append('<li><a href="steam://friends/message/' + data.id + '" class="message">Send Message</a></li>');      
        
        $("#profile .info ul li:first").addClass('first');       
        $("#profile .info ul li:last").addClass('last');        

        $('#title').hide();
        $('#profile').show();
      }     
    };
    
    var loadBP = function(id, callback) {
      $.steam.webapi.playerSummaries(id, function(data){
        var playerData = data.response.players.player[0];
        if(playerData.communityvisibilitystate == '3') {
          $.tf2bp.loadBP($('#backpack'), id, function(){
            var status;
            if(playerData.personastate == '3') {
              if(playerData.gameid) {
                status = 'in-game';
              }
              else {
                status = 'online';
              }
            }
            else {
              status = 'offline';
            }
            
            banner({
              id: id,
              avatar: playerData.avatarfull,
              name: playerData.personaname,
              status: status
            });
            
            $('#backpack').siblings().hide();
            
            if(callback) {
              callback();
            }
          });        
        }
        else {
          status.error('Profile is private');
          if(callback) {
            callback();
          }
        }
      });
    }
    
    return {
      // Load player BP
      loadBP: function(player, type, callback) {
        $('#backpack').show();
        
        // If we dont have the player ID, we will need to get it
        if(type == 'id') {
          loadBP(player, callback);
        } 
        else {
          status.error('Search by Player ID is not available yet');
          callback();
        }
      },
      // Load item list
      itemList: function(callback) { 
        $('#backpack').show();
        $.tf2bp.loadList($('#backpack'), function(){
          $('#backpack').siblings().hide();
          
          if(callback) {
            callback();
          }
        });
      },
      // About section
      about: function(callback) {
        wrapper.children().hide();
        $('#backpack').html('');
        $('#about').show();
        banner();
        
        if(callback) {
          callback();
        }
      }
    };
  })();
  
  // This take care about the url, querybox, etc
  var router = (function() {
    var lastState = '';    
    $.History.bind(function(state) {
      // Cancel the action if we are already doing something
      if(status.busy()) {
        $.History.go(lastState);
      }
      // Dont allow recursion
      else if(state !== lastState) {
        if(state.match(/^\/profiles\/[0-9]+$/)) {
          var parts = state.split('/');
          status.loading();
          content.loadBP(parts[parts.length-1], 'id', function(){
            status.clear();
          });
        }
        else if(state.match(/^\/id\/[A-Za-z0-9_-]+$/)) {
          var parts = state.split('/');
          status.loading();
          content.loadBP(parts[parts.length-1], 'name', function(){
            status.clear();
          });
        }
        else if(state.match(/^\/[A-Za-z0-9_-]+$/)) {
          status.loading(); 
          content.loadBP(state, function(){
            status.clear();
          });         
        }
        else if(state.charAt(0) === '!') {
          switch(state) {
            case '!/list':
              status.loading();
              content.itemList(function(){
                status.clear();
              });
            break;
            default:
              status.loading();
              content.about(function(){
                status.clear();
              });
            break;
          }
        }
        lastState = state;
      }      
    });
  
    // Add a default value for the query field
    var defaultQuery = 'profile link, userid or steam id here';
    $('#querybox').focus(function(){
      if($(this).attr('value') == defaultQuery) {
        $(this).attr('value', '');
      }
    }).blur(function(){
      if($(this).attr('value') == '') {
        $(this).attr('value', defaultQuery);
      }
    });
    
    var query = function() {
      var query = $('#querybox').attr('value');
      var success = false;
      if($.steam.validSteamID(query)) {
        $.History.go('/profiles/' + $.steam.getSteamID64(query));
        success = true;
      }
      else if(query.match(/profiles\/[0-9]+[\/]{0,1}$/)) {
        var parts = query.split('/');
        $.History.go('/profiles/' + (parts[parts.length-1] || parts[parts.length-2]));
        success = true;
      }
      else if(query.match(/id\/[A-Za-z0-9_-]+[\/]{0,1}$/)) {
        var parts = query.split('/');
        $.History.go('/id/' + (parts[parts.length-1] || parts[parts.length-2]));
        success = true;
      }
      else if(query.match(/^[A-Za-z0-9_-]+$/)) {
        $.History.go('/id/' + query);
        success = true;
      }
      
      if(success) {
        $('#querybox').attr('value', '');
        $('#querybox').blur();
      }
      else {
        status.error("Couldn't determine Player ID");
      }        
      return success;
    }
    
    $('#search').submit(function(){
      query();
      return false;
    }); 
    $('#gobutton').click(function(){
      query();
      return false;
    });
    
    return {};
  })();

  // Wrapper for options stuff
  var options = (function(){
    var classicImages = false;
    var noColors = false;
    var noIcons = false;
    
    var imagePaths = {
      classic: 'images/items/classic/',
      modern: 'images/items/modern/'
    };
  
    $('#options .title').click(function(){
      $('#options ul').animate({ height: 'toggle', opacity: 'toggle'});
      return false;
    });
    $('#options ul li:last').addClass('last');
    
    // Toggle the noColors option
    $('#toggle-colors').click(function(state) {
      $.cookie('noColors', !noColors ? '1' : '0');
      options.update();
      return false;
    });
    
    // Toggle the noIcons option
    $('#toggle-icons').click(function(state) {
      $.cookie('noIcons', !noIcons ? '1' : '0');
      options.update();
      return false;
    });
    
    // Toggle the classicImage option
    $('#change-images').click(function(state) {
      $.cookie('classicImages', !classicImages ? '1' : '0');
      options.update();
      return false;
    });
    var a = 0;
    var getImageFile = function(str) {
      var parts = str.split('/');
      return parts[parts.length-1];
    };
    
    return {
      init: function() {
        // This is our proxy url
        $.steam.webapi.setBase('tf2bp.com:8080');
        
        $.tf2bp.setItemImageMask(function(src, data) {
          /*var filename = getImageFile(src);
          if(filename == '') {
            filename = 'unknown.png';
          }
          // Once we get an image for each hat color, we can do this
          /*if(data.color) {
            var parts = filename.split('.');
            filename = parts[0] + '_' + data.color + '.' + parts[1];
          }*/
          //return (($.cookie('classicImages') == '1') ? imagePaths.classic : imagePaths.modern) + filename;
          // Temp fix for images
          return src;
        });
      },
      update: function(){ 
        if(noColors = ($.cookie('noColors') == '1')) {
          $("#backpack").addClass('bpnocolors');
        }
        else {
          $("#backpack").removeClass('bpnocolors');
        }
        
        if(noIcons = ($.cookie('noIcons') == '1')) {
          $("#backpack").addClass('bpnoicons');
        }
        else {
          $("#backpack").removeClass('bpnoicons');
        }
        
        // The cost to change image paths is much bigger than add/remove CSS class
        // So, we will just make anything if the option has changed
        if(classicImages != ($.cookie('classicImages') == '1')) {
          var path = (($.cookie('classicImages') == '1') ? imagePaths.classic : imagePaths.modern);
          
          $.tf2bp.setItemImageMask(function(src, data) {
            var filename = getImageFile(src);
            // Once we get an image for each hat color, we can do this
            /*if(data.color) {
              var parts = filename.split('.');
              filename = parts[0] + '_' + data.color + '.' + parts[1];
            }*/
            return path + filename;
          });
          
          $('.bpitem img').each(function(){
            $(this).attr('src', (path + getImageFile($(this).attr('src'))));
          });
          
          classicImages = ($.cookie('classicImages') == '1');
        }
      }
    };
  })();
    
  options.init();
  options.update();
});