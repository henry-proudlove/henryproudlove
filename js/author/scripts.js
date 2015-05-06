
// Init style shamelessly stolen from jQuery http://jquery.com
var Froogaloop = (function(){
    // Define a local copy of Froogaloop
    function Froogaloop(iframe) {
        // The Froogaloop object is actually just the init constructor
        return new Froogaloop.fn.init(iframe);
    }

    var eventCallbacks = {},
        hasWindowEvent = false,
        isReady = false,
        slice = Array.prototype.slice,
        playerDomain = '';

    Froogaloop.fn = Froogaloop.prototype = {
        element: null,

        init: function(iframe) {
            if (typeof iframe === "string") {
                iframe = document.getElementById(iframe);
            }

            this.element = iframe;

            // Register message event listeners
            playerDomain = getDomainFromUrl(this.element.getAttribute('src'));

            return this;
        },

        /*
         * Calls a function to act upon the player.
         *
         * @param {string} method The name of the Javascript API method to call. Eg: 'play'.
         * @param {Array|Function} valueOrCallback params Array of parameters to pass when calling an API method
         *                                or callback function when the method returns a value.
         */
        api: function(method, valueOrCallback) {
            if (!this.element || !method) {
                return false;
            }

            var self = this,
                element = self.element,
                target_id = element.id !== '' ? element.id : null,
                params = !isFunction(valueOrCallback) ? valueOrCallback : null,
                callback = isFunction(valueOrCallback) ? valueOrCallback : null;

            // Store the callback for get functions
            if (callback) {
                storeCallback(method, callback, target_id);
            }

            postMessage(method, params, element);
            return self;
        },

        /*
         * Registers an event listener and a callback function that gets called when the event fires.
         *
         * @param eventName (String): Name of the event to listen for.
         * @param callback (Function): Function that should be called when the event fires.
         */
        addEvent: function(eventName, callback) {
            if (!this.element) {
                return false;
            }

            var self = this,
                element = self.element,
                target_id = element.id !== '' ? element.id : null;


            storeCallback(eventName, callback, target_id);

            // The ready event is not registered via postMessage. It fires regardless.
            if (eventName != 'ready') {
                postMessage('addEventListener', eventName, element);
            }
            else if (eventName == 'ready' && isReady) {
                callback.call(null, target_id);
            }

            return self;
        },

        /*
         * Unregisters an event listener that gets called when the event fires.
         *
         * @param eventName (String): Name of the event to stop listening for.
         */
        removeEvent: function(eventName) {
            if (!this.element) {
                return false;
            }

            var self = this,
                element = self.element,
                target_id = element.id !== '' ? element.id : null,
                removed = removeCallback(eventName, target_id);

            // The ready event is not registered
            if (eventName != 'ready' && removed) {
                postMessage('removeEventListener', eventName, element);
            }
        }
    };

    /**
     * Handles posting a message to the parent window.
     *
     * @param method (String): name of the method to call inside the player. For api calls
     * this is the name of the api method (api_play or api_pause) while for events this method
     * is api_addEventListener.
     * @param params (Object or Array): List of parameters to submit to the method. Can be either
     * a single param or an array list of parameters.
     * @param target (HTMLElement): Target iframe to post the message to.
     */
    function postMessage(method, params, target) {
        if (!target.contentWindow.postMessage) {
            return false;
        }

        var url = target.getAttribute('src').split('?')[0],
            data = JSON.stringify({
                method: method,
                value: params
            });

        if (url.substr(0, 2) === '//') {
            url = window.location.protocol + url;
        }

        target.contentWindow.postMessage(data, url);
    }

    /**
     * Event that fires whenever the window receives a message from its parent
     * via window.postMessage.
     */
    function onMessageReceived(event) {
        var data, method;

        try {
            data = JSON.parse(event.data);
            method = data.event || data.method;
        }
        catch(e)  {
            //fail silently... like a ninja!
        }

        if (method == 'ready' && !isReady) {
            isReady = true;
        }

        // Handles messages from moogaloop only
        if (event.origin != playerDomain) {
            return false;
        }

        var value = data.value,
            eventData = data.data,
            target_id = target_id === '' ? null : data.player_id,

            callback = getCallback(method, target_id),
            params = [];

        if (!callback) {
            return false;
        }

        if (value !== undefined) {
            params.push(value);
        }

        if (eventData) {
            params.push(eventData);
        }

        if (target_id) {
            params.push(target_id);
        }

        return params.length > 0 ? callback.apply(null, params) : callback.call();
    }


    /**
     * Stores submitted callbacks for each iframe being tracked and each
     * event for that iframe.
     *
     * @param eventName (String): Name of the event. Eg. api_onPlay
     * @param callback (Function): Function that should get executed when the
     * event is fired.
     * @param target_id (String) [Optional]: If handling more than one iframe then
     * it stores the different callbacks for different iframes based on the iframe's
     * id.
     */
    function storeCallback(eventName, callback, target_id) {
        if (target_id) {
            if (!eventCallbacks[target_id]) {
                eventCallbacks[target_id] = {};
            }
            eventCallbacks[target_id][eventName] = callback;
        }
        else {
            eventCallbacks[eventName] = callback;
        }
    }

    /**
     * Retrieves stored callbacks.
     */
    function getCallback(eventName, target_id) {
        if (target_id) {
            return eventCallbacks[target_id][eventName];
        }
        else {
            return eventCallbacks[eventName];
        }
    }

    function removeCallback(eventName, target_id) {
        if (target_id && eventCallbacks[target_id]) {
            if (!eventCallbacks[target_id][eventName]) {
                return false;
            }
            eventCallbacks[target_id][eventName] = null;
        }
        else {
            if (!eventCallbacks[eventName]) {
                return false;
            }
            eventCallbacks[eventName] = null;
        }

        return true;
    }

    /**
     * Returns a domain's root domain.
     * Eg. returns http://vimeo.com when http://vimeo.com/channels is sbumitted
     *
     * @param url (String): Url to test against.
     * @return url (String): Root domain of submitted url
     */
    function getDomainFromUrl(url) {
        if (url.substr(0, 2) === '//') {
            url = window.location.protocol + url;
        }

        var url_pieces = url.split('/'),
            domain_str = '';

        for(var i = 0, length = url_pieces.length; i < length; i++) {
            if(i<3) {domain_str += url_pieces[i];}
            else {break;}
            if(i<2) {domain_str += '/';}
        }

        return domain_str;
    }

    function isFunction(obj) {
        return !!(obj && obj.constructor && obj.call && obj.apply);
    }

    function isArray(obj) {
        return toString.call(obj) === '[object Array]';
    }

    // Give the init function the Froogaloop prototype for later instantiation
    Froogaloop.fn.init.prototype = Froogaloop.fn;

    // Listens for the message event.
    // W3C
    if (window.addEventListener) {
        window.addEventListener('message', onMessageReceived, false);
    }
    // IE
    else {
        window.attachEvent('onmessage', onMessageReceived);
    }

    // Expose froogaloop to the global object
    return (window.Froogaloop = window.$f = Froogaloop);

})();
/*!
 * viewport-units-buggyfill v0.5.2
 * @web: https://github.com/rodneyrehm/viewport-units-buggyfill/
 * @author: Rodney Rehm - http://rodneyrehm.de/en/
 */

(function (root, factory) {
  'use strict';
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define([], factory);
  } else if (typeof exports === 'object') {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like enviroments that support module.exports,
    // like Node.
    module.exports = factory();
  } else {
    // Browser globals (root is window)
    root.viewportUnitsBuggyfill = factory();
  }
}(this, function () {
  'use strict';
  /*global document, window, navigator, location, XMLHttpRequest, XDomainRequest*/

  var initialized = false;
  var options;
  var userAgent = window.navigator.userAgent;
  var viewportUnitExpression = /([+-]?[0-9.]+)(vh|vw|vmin|vmax)/g;
  var forEach = [].forEach;
  var dimensions;
  var declarations;
  var styleNode;
  var isBuggyIE = false;
  var isOldIE = false;
  var isOperaMini = userAgent.indexOf('Opera Mini') > -1;

  var isMobileSafari = /(iPhone|iPod|iPad).+AppleWebKit/i.test(userAgent) && (function() {
    // Regexp for iOS-version tested against the following userAgent strings:
    // Example WebView UserAgents:
    // * iOS Chrome on iOS8: "Mozilla/5.0 (iPad; CPU OS 8_1 like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko) CriOS/39.0.2171.50 Mobile/12B410 Safari/600.1.4"
    // * iOS Facebook on iOS7: "Mozilla/5.0 (iPhone; CPU iPhone OS 7_1_1 like Mac OS X) AppleWebKit/537.51.2 (KHTML, like Gecko) Mobile/11D201 [FBAN/FBIOS;FBAV/12.1.0.24.20; FBBV/3214247; FBDV/iPhone6,1;FBMD/iPhone; FBSN/iPhone OS;FBSV/7.1.1; FBSS/2; FBCR/AT&T;FBID/phone;FBLC/en_US;FBOP/5]"
    // Example Safari UserAgents:
    // * Safari iOS8: "Mozilla/5.0 (iPhone; CPU iPhone OS 8_0 like Mac OS X) AppleWebKit/600.1.3 (KHTML, like Gecko) Version/8.0 Mobile/12A4345d Safari/600.1.4"
    // * Safari iOS7: "Mozilla/5.0 (iPhone; CPU iPhone OS 7_0 like Mac OS X) AppleWebKit/537.51.1 (KHTML, like Gecko) Version/7.0 Mobile/11A4449d Safari/9537.53"
    var iOSversion = userAgent.match(/OS (\d)/);
    // viewport units work fine in mobile Safari and webView on iOS 8+
    return iOSversion && iOSversion.length>1 && parseInt(iOSversion[1]) < 8;
  })();

  var isBadStockAndroid = (function() {
    // Android stock browser test derived from
    // http://stackoverflow.com/questions/24926221/distinguish-android-chrome-from-stock-browser-stock-browsers-user-agent-contai
    var isAndroid = userAgent.indexOf(' Android ') > -1;
    if (!isAndroid) {
      return false;
    }

    var isStockAndroid = userAgent.indexOf('Version/') > -1;
    if (!isStockAndroid) {
      return false;
    }

    var versionNumber = parseFloat((userAgent.match('Android ([0-9.]+)') || [])[1]);
    // anything below 4.4 uses WebKit without *any* viewport support,
    // 4.4 has issues with viewport units within calc()
    return versionNumber <= 4.4;
  })();

  // Do not remove the following comment!
  // It is a conditional comment used to
  // identify old Internet Explorer versions

  /*@cc_on

  @if (9 <= @_jscript_version && @_jscript_version <= 10)
    isBuggyIE = true;
  @end
  
  @if (@_jscript_version < 9) {
    isOldIE = true;
  }
  @end
  
  @*/

  // added check for IE11, since it *still* doesn't understand vmax!!!
  if (!isBuggyIE) {
    isBuggyIE = !!navigator.userAgent.match(/Trident.*rv[ :]*11\./);
  }
  function debounce(func, wait) {
    var timeout;
    return function() {
      var context = this;
      var args = arguments;
      var callback = function() {
        func.apply(context, args);
      };

      clearTimeout(timeout);
      timeout = setTimeout(callback, wait);
    };
  }

  // from http://stackoverflow.com/questions/326069/how-to-identify-if-a-webpage-is-being-loaded-inside-an-iframe-or-directly-into-t
  function inIframe() {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  }

  function initialize(initOptions) {
    if (initialized) {
      return;
    }

    if (initOptions === true) {
      initOptions = {
        force: true
      };
    }

    options = initOptions || {};
    options.isMobileSafari = isMobileSafari;
    options.isBadStockAndroid = isBadStockAndroid;

    if (isOldIE || (!options.force && !isMobileSafari && !isBuggyIE && !isBadStockAndroid && !isOperaMini && (!options.hacks || !options.hacks.required(options)))) {
      // this buggyfill only applies to mobile safari, IE9-10 and the Stock Android Browser.
      if (window.console && isOldIE) {
        console.info('viewport-units-buggyfill requires a proper CSSOM and basic viewport unit support, which are not available in IE8 and below');
      }

      return {
        init: function () {}
      };
    }

    options.hacks && options.hacks.initialize(options);

    initialized = true;
    styleNode = document.createElement('style');
    styleNode.id = 'patched-viewport';
    document.head.appendChild(styleNode);

    // Issue #6: Cross Origin Stylesheets are not accessible through CSSOM,
    // therefore download and inject them as <style> to circumvent SOP.
    importCrossOriginLinks(function() {
      var _refresh = debounce(refresh, options.refreshDebounceWait || 100);
      // doing a full refresh rather than updateStyles because an orientationchange
      // could activate different stylesheets
      window.addEventListener('orientationchange', _refresh, true);
      // orientationchange might have happened while in a different window
      window.addEventListener('pageshow', _refresh, true);

      if (options.force || isBuggyIE || inIframe()) {
        window.addEventListener('resize', _refresh, true);
        options._listeningToResize = true;
      }

      options.hacks && options.hacks.initializeEvents(options, refresh, _refresh);

      refresh();
    });
  }

  function updateStyles() {
    styleNode.textContent = getReplacedViewportUnits();
    // move to the end in case inline <style>s were added dynamically
    styleNode.parentNode.appendChild(styleNode);
  }

  function refresh() {
    if (!initialized) {
      return;
    }

    findProperties();

    // iOS Safari will report window.innerWidth and .innerHeight as 0 unless a timeout is used here.
    // TODO: figure out WHY innerWidth === 0
    setTimeout(function() {
      updateStyles();
    }, 1);
  }

  function findProperties() {
    declarations = [];
    forEach.call(document.styleSheets, function(sheet) {
      if (sheet.ownerNode.id === 'patched-viewport' || !sheet.cssRules || sheet.ownerNode.getAttribute('data-viewport-units-buggyfill') === 'ignore') {
        // skip entire sheet because no rules are present, it's supposed to be ignored or it's the target-element of the buggyfill
        return;
      }

      if (sheet.media && sheet.media.mediaText && window.matchMedia && !window.matchMedia(sheet.media.mediaText).matches) {
        // skip entire sheet because media attribute doesn't match
        return;
      }

      forEach.call(sheet.cssRules, findDeclarations);
    });

    return declarations;
  }

  function findDeclarations(rule) {
    if (rule.type === 7) {
      var value;

      // there may be a case where accessing cssText throws an error.
      // I could not reproduce this issue, but the worst that can happen
      // this way is an animation not running properly.
      // not awesome, but probably better than a script error
      // see https://github.com/rodneyrehm/viewport-units-buggyfill/issues/21
      try {
        value = rule.cssText;
      } catch(e) {
        return;
      }

      viewportUnitExpression.lastIndex = 0;
      if (viewportUnitExpression.test(value)) {
        // KeyframesRule does not have a CSS-PropertyName
        declarations.push([rule, null, value]);
        options.hacks && options.hacks.findDeclarations(declarations, rule, null, value);
      }

      return;
    }

    if (!rule.style) {
      if (!rule.cssRules) {
        return;
      }

      forEach.call(rule.cssRules, function(_rule) {
        findDeclarations(_rule);
      });

      return;
    }

    forEach.call(rule.style, function(name) {
      var value = rule.style.getPropertyValue(name);
      // preserve those !important rules
      if (rule.style.getPropertyPriority(name)) {
        value += ' !important';
      }

      viewportUnitExpression.lastIndex = 0;
      if (viewportUnitExpression.test(value)) {
        declarations.push([rule, name, value]);
        options.hacks && options.hacks.findDeclarations(declarations, rule, name, value);
      }
    });
  }

  function getReplacedViewportUnits() {
    dimensions = getViewport();

    var css = [];
    var buffer = [];
    var open;
    var close;

    declarations.forEach(function(item) {
      var _item = overwriteDeclaration.apply(null, item);
      var _open = _item.selector.length ? (_item.selector.join(' {\n') + ' {\n') : '';
      var _close = new Array(_item.selector.length + 1).join('\n}');

      if (!_open || _open !== open) {
        if (buffer.length) {
          css.push(open + buffer.join('\n') + close);
          buffer.length = 0;
        }

        if (_open) {
          open = _open;
          close = _close;
          buffer.push(_item.content);
        } else {
          css.push(_item.content);
          open = null;
          close = null;
        }

        return;
      }

      if (_open && !open) {
        open = _open;
        close = _close;
      }

      buffer.push(_item.content);
    });

    if (buffer.length) {
      css.push(open + buffer.join('\n') + close);
    }

    // Opera Mini messes up on the content hack (it replaces the DOM node's innerHTML with the value).
    // This fixes it. We test for Opera Mini only since it is the most expensive CSS selector
    // see https://developer.mozilla.org/en-US/docs/Web/CSS/Universal_selectors
    if (isOperaMini) {
      css.push('* { content: normal !important; }');
    }

    return css.join('\n\n');
  }

  function overwriteDeclaration(rule, name, value) {
    var _value;
    var _selectors = [];

    _value = value.replace(viewportUnitExpression, replaceValues);

    if (options.hacks) {
      _value = options.hacks.overwriteDeclaration(rule, name, _value);
    }

    if (name) {
      // skipping KeyframesRule
      _selectors.push(rule.selectorText);
      _value = name + ': ' + _value + ';';
    }

    var _rule = rule.parentRule;
    while (_rule) {
      _selectors.unshift('@media ' + _rule.media.mediaText);
      _rule = _rule.parentRule;
    }

    return {
      selector: _selectors,
      content: _value
    };
  }

  function replaceValues(match, number, unit) {
    var _base = dimensions[unit];
    var _number = parseFloat(number) / 100;
    return (_number * _base) + 'px';
  }

  function getViewport() {
    var vh = window.innerHeight;
    var vw = window.innerWidth;

    return {
      vh: vh,
      vw: vw,
      vmax: Math.max(vw, vh),
      vmin: Math.min(vw, vh)
    };
  }

  function importCrossOriginLinks(next) {
    var _waiting = 0;
    var decrease = function() {
      _waiting--;
      if (!_waiting) {
        next();
      }
    };

    forEach.call(document.styleSheets, function(sheet) {
      if (!sheet.href || origin(sheet.href) === origin(location.href)) {
        // skip <style> and <link> from same origin
        return;
      }

      _waiting++;
      convertLinkToStyle(sheet.ownerNode, decrease);
    });

    if (!_waiting) {
      next();
    }
  }

  function origin(url) {
    return url.slice(0, url.indexOf('/', url.indexOf('://') + 3));
  }

  function convertLinkToStyle(link, next) {
    getCors(link.href, function() {
      var style = document.createElement('style');
      style.media = link.media;
      style.setAttribute('data-href', link.href);
      style.textContent = this.responseText;
      link.parentNode.replaceChild(style, link);
      next();
    }, next);
  }

  function getCors(url, success, error) {
    var xhr = new XMLHttpRequest();
    if ('withCredentials' in xhr) {
      // XHR for Chrome/Firefox/Opera/Safari.
      xhr.open('GET', url, true);
    } else if (typeof XDomainRequest !== 'undefined') {
      // XDomainRequest for IE.
      xhr = new XDomainRequest();
      xhr.open('GET', url);
    } else {
      throw new Error('cross-domain XHR not supported');
    }

    xhr.onload = success;
    xhr.onerror = error;
    xhr.send();
    return xhr;
  }

  return {
    version: '0.5.2',
    findProperties: findProperties,
    getCss: getReplacedViewportUnits,
    init: initialize,
    refresh: refresh
  };

}));
/*!
* jQuery Cycle2; version: 2.1.6 build: 20141007
* http://jquery.malsup.com/cycle2/
* Copyright (c) 2014 M. Alsup; Dual licensed: MIT/GPL
*/

/* Cycle2 core engine */
;(function($) {
"use strict";

var version = '2.1.6';

$.fn.cycle = function( options ) {
    // fix mistakes with the ready state
    var o;
    if ( this.length === 0 && !$.isReady ) {
        o = { s: this.selector, c: this.context };
        $.fn.cycle.log('requeuing slideshow (dom not ready)');
        $(function() {
            $( o.s, o.c ).cycle(options);
        });
        return this;
    }

    return this.each(function() {
        var data, opts, shortName, val;
        var container = $(this);
        var log = $.fn.cycle.log;

        if ( container.data('cycle.opts') )
            return; // already initialized

        if ( container.data('cycle-log') === false || 
            ( options && options.log === false ) ||
            ( opts && opts.log === false) ) {
            log = $.noop;
        }

        log('--c2 init--');
        data = container.data();
        for (var p in data) {
            // allow props to be accessed sans 'cycle' prefix and log the overrides
            if (data.hasOwnProperty(p) && /^cycle[A-Z]+/.test(p) ) {
                val = data[p];
                shortName = p.match(/^cycle(.*)/)[1].replace(/^[A-Z]/, lowerCase);
                log(shortName+':', val, '('+typeof val +')');
                data[shortName] = val;
            }
        }

        opts = $.extend( {}, $.fn.cycle.defaults, data, options || {});

        opts.timeoutId = 0;
        opts.paused = opts.paused || false; // #57
        opts.container = container;
        opts._maxZ = opts.maxZ;

        opts.API = $.extend ( { _container: container }, $.fn.cycle.API );
        opts.API.log = log;
        opts.API.trigger = function( eventName, args ) {
            opts.container.trigger( eventName, args );
            return opts.API;
        };

        container.data( 'cycle.opts', opts );
        container.data( 'cycle.API', opts.API );

        // opportunity for plugins to modify opts and API
        opts.API.trigger('cycle-bootstrap', [ opts, opts.API ]);

        opts.API.addInitialSlides();
        opts.API.preInitSlideshow();

        if ( opts.slides.length )
            opts.API.initSlideshow();
    });
};

$.fn.cycle.API = {
    opts: function() {
        return this._container.data( 'cycle.opts' );
    },
    addInitialSlides: function() {
        var opts = this.opts();
        var slides = opts.slides;
        opts.slideCount = 0;
        opts.slides = $(); // empty set
        
        // add slides that already exist
        slides = slides.jquery ? slides : opts.container.find( slides );

        if ( opts.random ) {
            slides.sort(function() {return Math.random() - 0.5;});
        }

        opts.API.add( slides );
    },

    preInitSlideshow: function() {
        var opts = this.opts();
        opts.API.trigger('cycle-pre-initialize', [ opts ]);
        var tx = $.fn.cycle.transitions[opts.fx];
        if (tx && $.isFunction(tx.preInit))
            tx.preInit( opts );
        opts._preInitialized = true;
    },

    postInitSlideshow: function() {
        var opts = this.opts();
        opts.API.trigger('cycle-post-initialize', [ opts ]);
        var tx = $.fn.cycle.transitions[opts.fx];
        if (tx && $.isFunction(tx.postInit))
            tx.postInit( opts );
    },

    initSlideshow: function() {
        var opts = this.opts();
        var pauseObj = opts.container;
        var slideOpts;
        opts.API.calcFirstSlide();

        if ( opts.container.css('position') == 'static' )
            opts.container.css('position', 'relative');

        $(opts.slides[opts.currSlide]).css({
            opacity: 1,
            display: 'block',
            visibility: 'visible'
        });
        opts.API.stackSlides( opts.slides[opts.currSlide], opts.slides[opts.nextSlide], !opts.reverse );

        if ( opts.pauseOnHover ) {
            // allow pauseOnHover to specify an element
            if ( opts.pauseOnHover !== true )
                pauseObj = $( opts.pauseOnHover );

            pauseObj.hover(
                function(){ opts.API.pause( true ); }, 
                function(){ opts.API.resume( true ); }
            );
        }

        // stage initial transition
        if ( opts.timeout ) {
            slideOpts = opts.API.getSlideOpts( opts.currSlide );
            opts.API.queueTransition( slideOpts, slideOpts.timeout + opts.delay );
        }

        opts._initialized = true;
        opts.API.updateView( true );
        opts.API.trigger('cycle-initialized', [ opts ]);
        opts.API.postInitSlideshow();
    },

    pause: function( hover ) {
        var opts = this.opts(),
            slideOpts = opts.API.getSlideOpts(),
            alreadyPaused = opts.hoverPaused || opts.paused;

        if ( hover )
            opts.hoverPaused = true; 
        else
            opts.paused = true;

        if ( ! alreadyPaused ) {
            opts.container.addClass('cycle-paused');
            opts.API.trigger('cycle-paused', [ opts ]).log('cycle-paused');

            if ( slideOpts.timeout ) {
                clearTimeout( opts.timeoutId );
                opts.timeoutId = 0;
                
                // determine how much time is left for the current slide
                opts._remainingTimeout -= ( $.now() - opts._lastQueue );
                if ( opts._remainingTimeout < 0 || isNaN(opts._remainingTimeout) )
                    opts._remainingTimeout = undefined;
            }
        }
    },

    resume: function( hover ) {
        var opts = this.opts(),
            alreadyResumed = !opts.hoverPaused && !opts.paused,
            remaining;

        if ( hover )
            opts.hoverPaused = false; 
        else
            opts.paused = false;

    
        if ( ! alreadyResumed ) {
            opts.container.removeClass('cycle-paused');
            // #gh-230; if an animation is in progress then don't queue a new transition; it will
            // happen naturally
            if ( opts.slides.filter(':animated').length === 0 )
                opts.API.queueTransition( opts.API.getSlideOpts(), opts._remainingTimeout );
            opts.API.trigger('cycle-resumed', [ opts, opts._remainingTimeout ] ).log('cycle-resumed');
        }
    },

    add: function( slides, prepend ) {
        var opts = this.opts();
        var oldSlideCount = opts.slideCount;
        var startSlideshow = false;
        var len;

        if ( $.type(slides) == 'string')
            slides = $.trim( slides );

        $( slides ).each(function(i) {
            var slideOpts;
            var slide = $(this);

            if ( prepend )
                opts.container.prepend( slide );
            else
                opts.container.append( slide );

            opts.slideCount++;
            slideOpts = opts.API.buildSlideOpts( slide );

            if ( prepend )
                opts.slides = $( slide ).add( opts.slides );
            else
                opts.slides = opts.slides.add( slide );

            opts.API.initSlide( slideOpts, slide, --opts._maxZ );

            slide.data('cycle.opts', slideOpts);
            opts.API.trigger('cycle-slide-added', [ opts, slideOpts, slide ]);
        });

        opts.API.updateView( true );

        startSlideshow = opts._preInitialized && (oldSlideCount < 2 && opts.slideCount >= 1);
        if ( startSlideshow ) {
            if ( !opts._initialized )
                opts.API.initSlideshow();
            else if ( opts.timeout ) {
                len = opts.slides.length;
                opts.nextSlide = opts.reverse ? len - 1 : 1;
                if ( !opts.timeoutId ) {
                    opts.API.queueTransition( opts );
                }
            }
        }
    },

    calcFirstSlide: function() {
        var opts = this.opts();
        var firstSlideIndex;
        firstSlideIndex = parseInt( opts.startingSlide || 0, 10 );
        if (firstSlideIndex >= opts.slides.length || firstSlideIndex < 0)
            firstSlideIndex = 0;

        opts.currSlide = firstSlideIndex;
        if ( opts.reverse ) {
            opts.nextSlide = firstSlideIndex - 1;
            if (opts.nextSlide < 0)
                opts.nextSlide = opts.slides.length - 1;
        }
        else {
            opts.nextSlide = firstSlideIndex + 1;
            if (opts.nextSlide == opts.slides.length)
                opts.nextSlide = 0;
        }
    },

    calcNextSlide: function() {
        var opts = this.opts();
        var roll;
        if ( opts.reverse ) {
            roll = (opts.nextSlide - 1) < 0;
            opts.nextSlide = roll ? opts.slideCount - 1 : opts.nextSlide-1;
            opts.currSlide = roll ? 0 : opts.nextSlide+1;
        }
        else {
            roll = (opts.nextSlide + 1) == opts.slides.length;
            opts.nextSlide = roll ? 0 : opts.nextSlide+1;
            opts.currSlide = roll ? opts.slides.length-1 : opts.nextSlide-1;
        }
    },

    calcTx: function( slideOpts, manual ) {
        var opts = slideOpts;
        var tx;

        if ( opts._tempFx )
            tx = $.fn.cycle.transitions[opts._tempFx];
        else if ( manual && opts.manualFx )
            tx = $.fn.cycle.transitions[opts.manualFx];

        if ( !tx )
            tx = $.fn.cycle.transitions[opts.fx];

        opts._tempFx = null;
        this.opts()._tempFx = null;

        if (!tx) {
            tx = $.fn.cycle.transitions.fade;
            opts.API.log('Transition "' + opts.fx + '" not found.  Using fade.');
        }
        return tx;
    },

    prepareTx: function( manual, fwd ) {
        var opts = this.opts();
        var after, curr, next, slideOpts, tx;

        if ( opts.slideCount < 2 ) {
            opts.timeoutId = 0;
            return;
        }
        if ( manual && ( !opts.busy || opts.manualTrump ) ) {
            opts.API.stopTransition();
            opts.busy = false;
            clearTimeout(opts.timeoutId);
            opts.timeoutId = 0;
        }
        if ( opts.busy )
            return;
        if ( opts.timeoutId === 0 && !manual )
            return;

        curr = opts.slides[opts.currSlide];
        next = opts.slides[opts.nextSlide];
        slideOpts = opts.API.getSlideOpts( opts.nextSlide );
        tx = opts.API.calcTx( slideOpts, manual );

        opts._tx = tx;

        if ( manual && slideOpts.manualSpeed !== undefined )
            slideOpts.speed = slideOpts.manualSpeed;

        // if ( opts.nextSlide === opts.currSlide )
        //     opts.API.calcNextSlide();

        // ensure that:
        //      1. advancing to a different slide
        //      2. this is either a manual event (prev/next, pager, cmd) or 
        //              a timer event and slideshow is not paused
        if ( opts.nextSlide != opts.currSlide && 
            (manual || (!opts.paused && !opts.hoverPaused && opts.timeout) )) { // #62

            opts.API.trigger('cycle-before', [ slideOpts, curr, next, fwd ]);
            if ( tx.before )
                tx.before( slideOpts, curr, next, fwd );

            after = function() {
                opts.busy = false;
                // #76; bail if slideshow has been destroyed
                if (! opts.container.data( 'cycle.opts' ) )
                    return;

                if (tx.after)
                    tx.after( slideOpts, curr, next, fwd );
                opts.API.trigger('cycle-after', [ slideOpts, curr, next, fwd ]);
                opts.API.queueTransition( slideOpts);
                opts.API.updateView( true );
            };

            opts.busy = true;
            if (tx.transition)
                tx.transition(slideOpts, curr, next, fwd, after);
            else
                opts.API.doTransition( slideOpts, curr, next, fwd, after);

            opts.API.calcNextSlide();
            opts.API.updateView();
        } else {
            opts.API.queueTransition( slideOpts );
        }
    },

    // perform the actual animation
    doTransition: function( slideOpts, currEl, nextEl, fwd, callback) {
        var opts = slideOpts;
        var curr = $(currEl), next = $(nextEl);
        /*var fn = function() {
            // make sure animIn has something so that callback doesn't trigger immediately
            next.animate(opts.animIn || { opacity: 1}, opts.speed, opts.easeIn || opts.easing, callback);
        };*/
		
        var fn = function() {
            // make sure animIn has something so that callback doesn't trigger immediately
            next.transition(opts.animIn || { opacity: 1}, opts.speed, callback);
        };

        next.css(opts.cssBefore || {});
        /*curr.animate(opts.animOut || {}, opts.speed, opts.easeOut || opts.easing, function() {
            curr.css(opts.cssAfter || {});
            if (!opts.sync) {
                fn();
            }
        });*/
        curr.transition(opts.animOut || {}, opts.speed, function() {
            curr.css(opts.cssAfter || {});
            if (!opts.sync) {
                fn();
            }
        });
        if (opts.sync) {
            fn();
        }
    },

    queueTransition: function( slideOpts, specificTimeout ) {
        var opts = this.opts();
        var timeout = specificTimeout !== undefined ? specificTimeout : slideOpts.timeout;
        if (opts.nextSlide === 0 && --opts.loop === 0) {
            opts.API.log('terminating; loop=0');
            opts.timeout = 0;
            if ( timeout ) {
                setTimeout(function() {
                    opts.API.trigger('cycle-finished', [ opts ]);
                }, timeout);
            }
            else {
                opts.API.trigger('cycle-finished', [ opts ]);
            }
            // reset nextSlide
            opts.nextSlide = opts.currSlide;
            return;
        }
        if ( opts.continueAuto !== undefined ) {
            if ( opts.continueAuto === false || 
                ($.isFunction(opts.continueAuto) && opts.continueAuto() === false )) {
                opts.API.log('terminating automatic transitions');
                opts.timeout = 0;
                if ( opts.timeoutId )
                    clearTimeout(opts.timeoutId);
                return;
            }
        }
        if ( timeout ) {
            opts._lastQueue = $.now();
            if ( specificTimeout === undefined )
                opts._remainingTimeout = slideOpts.timeout;

            if ( !opts.paused && ! opts.hoverPaused ) {
                opts.timeoutId = setTimeout(function() { 
                    opts.API.prepareTx( false, !opts.reverse ); 
                }, timeout );
            }
        }
    },

    stopTransition: function() {
        var opts = this.opts();
        if ( opts.slides.filter(':animated').length ) {
            opts.slides.stop(false, true);
            opts.API.trigger('cycle-transition-stopped', [ opts ]);
        }

        if ( opts._tx && opts._tx.stopTransition )
            opts._tx.stopTransition( opts );
    },

    // advance slide forward or back
    advanceSlide: function( val ) {
        var opts = this.opts();
        clearTimeout(opts.timeoutId);
        opts.timeoutId = 0;
        opts.nextSlide = opts.currSlide + val;
        
        if (opts.nextSlide < 0)
            opts.nextSlide = opts.slides.length - 1;
        else if (opts.nextSlide >= opts.slides.length)
            opts.nextSlide = 0;

        opts.API.prepareTx( true,  val >= 0 );
        return false;
    },

    buildSlideOpts: function( slide ) {
        var opts = this.opts();
        var val, shortName;
        var slideOpts = slide.data() || {};
        for (var p in slideOpts) {
            // allow props to be accessed sans 'cycle' prefix and log the overrides
            if (slideOpts.hasOwnProperty(p) && /^cycle[A-Z]+/.test(p) ) {
                val = slideOpts[p];
                shortName = p.match(/^cycle(.*)/)[1].replace(/^[A-Z]/, lowerCase);
                opts.API.log('['+(opts.slideCount-1)+']', shortName+':', val, '('+typeof val +')');
                slideOpts[shortName] = val;
            }
        }

        slideOpts = $.extend( {}, $.fn.cycle.defaults, opts, slideOpts );
        slideOpts.slideNum = opts.slideCount;

        try {
            // these props should always be read from the master state object
            delete slideOpts.API;
            delete slideOpts.slideCount;
            delete slideOpts.currSlide;
            delete slideOpts.nextSlide;
            delete slideOpts.slides;
        } catch(e) {
            // no op
        }
        return slideOpts;
    },

    getSlideOpts: function( index ) {
        var opts = this.opts();
        if ( index === undefined )
            index = opts.currSlide;

        var slide = opts.slides[index];
        var slideOpts = $(slide).data('cycle.opts');
        return $.extend( {}, opts, slideOpts );
    },
    
    initSlide: function( slideOpts, slide, suggestedZindex ) {
        var opts = this.opts();
        slide.css( slideOpts.slideCss || {} );
        if ( suggestedZindex > 0 )
            slide.css( 'zIndex', suggestedZindex );

        // ensure that speed settings are sane
        if ( isNaN( slideOpts.speed ) )
            slideOpts.speed = $.fx.speeds[slideOpts.speed] || $.fx.speeds._default;
        if ( !slideOpts.sync )
            slideOpts.speed = slideOpts.speed / 2;

        slide.addClass( opts.slideClass );
    },

    updateView: function( isAfter, isDuring, forceEvent ) {
        var opts = this.opts();
        if ( !opts._initialized )
            return;
        var slideOpts = opts.API.getSlideOpts();
        var currSlide = opts.slides[ opts.currSlide ];

        if ( ! isAfter && isDuring !== true ) {
            opts.API.trigger('cycle-update-view-before', [ opts, slideOpts, currSlide ]);
            if ( opts.updateView < 0 )
                return;
        }

        if ( opts.slideActiveClass ) {
            opts.slides.removeClass( opts.slideActiveClass )
                .eq( opts.currSlide ).addClass( opts.slideActiveClass );
        }

        if ( isAfter && opts.hideNonActive )
            opts.slides.filter( ':not(.' + opts.slideActiveClass + ')' ).css('visibility', 'hidden');

        if ( opts.updateView === 0 ) {
            setTimeout(function() {
                opts.API.trigger('cycle-update-view', [ opts, slideOpts, currSlide, isAfter ]);
            }, slideOpts.speed / (opts.sync ? 2 : 1) );
        }

        if ( opts.updateView !== 0 )
            opts.API.trigger('cycle-update-view', [ opts, slideOpts, currSlide, isAfter ]);
        
        if ( isAfter )
            opts.API.trigger('cycle-update-view-after', [ opts, slideOpts, currSlide ]);
    },

    getComponent: function( name ) {
        var opts = this.opts();
        var selector = opts[name];
        if (typeof selector === 'string') {
            // if selector is a child, sibling combinator, adjancent selector then use find, otherwise query full dom
            return (/^\s*[\>|\+|~]/).test( selector ) ? opts.container.find( selector ) : $( selector );
        }
        if (selector.jquery)
            return selector;
        
        return $(selector);
    },

    stackSlides: function( curr, next, fwd ) {
        var opts = this.opts();
        if ( !curr ) {
            curr = opts.slides[opts.currSlide];
            next = opts.slides[opts.nextSlide];
            fwd = !opts.reverse;
        }

        // reset the zIndex for the common case:
        // curr slide on top,  next slide beneath, and the rest in order to be shown
        $(curr).css('zIndex', opts.maxZ);

        var i;
        var z = opts.maxZ - 2;
        var len = opts.slideCount;
        if (fwd) {
            for ( i = opts.currSlide + 1; i < len; i++ )
                $( opts.slides[i] ).css( 'zIndex', z-- );
            for ( i = 0; i < opts.currSlide; i++ )
                $( opts.slides[i] ).css( 'zIndex', z-- );
        }
        else {
            for ( i = opts.currSlide - 1; i >= 0; i-- )
                $( opts.slides[i] ).css( 'zIndex', z-- );
            for ( i = len - 1; i > opts.currSlide; i-- )
                $( opts.slides[i] ).css( 'zIndex', z-- );
        }

        $(next).css('zIndex', opts.maxZ - 1);
    },

    getSlideIndex: function( el ) {
        return this.opts().slides.index( el );
    }

}; // API

// default logger
$.fn.cycle.log = function log() {
    /*global console:true */
    if (window.console && console.log)
        console.log('[cycle2] ' + Array.prototype.join.call(arguments, ' ') );
};

$.fn.cycle.version = function() { return 'Cycle2: ' + version; };

// helper functions

function lowerCase(s) {
    return (s || '').toLowerCase();
}

// expose transition object
$.fn.cycle.transitions = {
    custom: {
    },
    none: {
        before: function( opts, curr, next, fwd ) {
            opts.API.stackSlides( next, curr, fwd );
            opts.cssBefore = { opacity: 1, visibility: 'visible', display: 'block' };
        }
    },
    fade: {
        before: function( opts, curr, next, fwd ) {
            var css = opts.API.getSlideOpts( opts.nextSlide ).slideCss || {};
            opts.API.stackSlides( curr, next, fwd );
            opts.cssBefore = $.extend(css, { opacity: 0, visibility: 'visible', display: 'block' });
            opts.animIn = { opacity: 1 };
            opts.animOut = { opacity: 0 };
        }
    },
    fadeout: {
        before: function( opts , curr, next, fwd ) {
            var css = opts.API.getSlideOpts( opts.nextSlide ).slideCss || {};
            opts.API.stackSlides( curr, next, fwd );
            opts.cssBefore = $.extend(css, { opacity: 1, visibility: 'visible', display: 'block' });
            opts.animOut = { opacity: 0 };
        }
    },
    scrollHorz: {
        before: function( opts, curr, next, fwd ) {
            opts.API.stackSlides( curr, next, fwd );
            var w = opts.container.css('overflow','hidden').width();
            opts.cssBefore = { left: fwd ? w : - w, top: 0, opacity: 1, visibility: 'visible', display: 'block' };
            opts.cssAfter = { zIndex: opts._maxZ - 2, left: 0 };
            opts.animIn = { left: 0 };
            opts.animOut = { left: fwd ? -w : w };
        }
    }
};

// @see: http://jquery.malsup.com/cycle2/api
$.fn.cycle.defaults = {
    allowWrap:        true,
    autoSelector:     '.cycle-slideshow[data-cycle-auto-init!=false]',
    delay:            0,
    easing:           null,
    fx:              'fade',
    hideNonActive:    true,
    loop:             0,
    manualFx:         undefined,
    manualSpeed:      undefined,
    manualTrump:      true,
    maxZ:             100,
    pauseOnHover:     false,
    reverse:          false,
    slideActiveClass: 'cycle-slide-active',
    slideClass:       'cycle-slide',
    slideCss:         { position: 'absolute', top: 0, left: 0 },
    slides:          '> img',
    speed:            500,
    startingSlide:    0,
    sync:             true,
    timeout:          4000,
    updateView:       0
};

// automatically find and run slideshows
$(document).ready(function() {
    $( $.fn.cycle.defaults.autoSelector ).cycle();
});

})(jQuery);

/*! Cycle2 autoheight plugin; Copyright (c) M.Alsup, 2012; version: 20130913 */
(function($) {
"use strict";

$.extend($.fn.cycle.defaults, {
    autoHeight: 0, // setting this option to false disables autoHeight logic
    autoHeightSpeed: 250,
    autoHeightEasing: null
});    

$(document).on( 'cycle-initialized', function( e, opts ) {
    var autoHeight = opts.autoHeight;
    var t = $.type( autoHeight );
    var resizeThrottle = null;
    var ratio;

    if ( t !== 'string' && t !== 'number' )
        return;

    // bind events
    opts.container.on( 'cycle-slide-added cycle-slide-removed', initAutoHeight );
    opts.container.on( 'cycle-destroyed', onDestroy );

    if ( autoHeight == 'container' ) {
        opts.container.on( 'cycle-before', onBefore );
    }
    else if ( t === 'string' && /\d+\:\d+/.test( autoHeight ) ) { 
        // use ratio
        ratio = autoHeight.match(/(\d+)\:(\d+)/);
        ratio = ratio[1] / ratio[2];
        opts._autoHeightRatio = ratio;
    }

    // if autoHeight is a number then we don't need to recalculate the sentinel
    // index on resize
    if ( t !== 'number' ) {
        // bind unique resize handler per slideshow (so it can be 'off-ed' in onDestroy)
        opts._autoHeightOnResize = function () {
            clearTimeout( resizeThrottle );
            resizeThrottle = setTimeout( onResize, 50 );
        };

        $(window).on( 'resize orientationchange', opts._autoHeightOnResize );
    }

    setTimeout( onResize, 30 );

    function onResize() {
        initAutoHeight( e, opts );
    }
});

function initAutoHeight( e, opts ) {
    var clone, height, sentinelIndex;
    var autoHeight = opts.autoHeight;

    if ( autoHeight == 'container' ) {
        height = $( opts.slides[ opts.currSlide ] ).outerHeight();
        opts.container.height( height );
    }
    else if ( opts._autoHeightRatio ) { 
        opts.container.height( opts.container.width() / opts._autoHeightRatio );
    }
    else if ( autoHeight === 'calc' || ( $.type( autoHeight ) == 'number' && autoHeight >= 0 ) ) {
        if ( autoHeight === 'calc' )
            sentinelIndex = calcSentinelIndex( e, opts );
        else if ( autoHeight >= opts.slides.length )
            sentinelIndex = 0;
        else 
            sentinelIndex = autoHeight;

        // only recreate sentinel if index is different
        if ( sentinelIndex == opts._sentinelIndex )
            return;

        opts._sentinelIndex = sentinelIndex;
        if ( opts._sentinel )
            opts._sentinel.remove();

        // clone existing slide as sentinel
        clone = $( opts.slides[ sentinelIndex ].cloneNode(true) );
        
        // #50; remove special attributes from cloned content
        clone.removeAttr( 'id name rel' ).find( '[id],[name],[rel]' ).removeAttr( 'id name rel' );

        clone.css({
            position: 'static',
            visibility: 'hidden',
            display: 'block'
        }).prependTo( opts.container ).addClass('cycle-sentinel cycle-slide').removeClass('cycle-slide-active');
        clone.find( '*' ).css( 'visibility', 'hidden' );

        opts._sentinel = clone;
    }
}    

function calcSentinelIndex( e, opts ) {
    var index = 0, max = -1;

    // calculate tallest slide index
    opts.slides.each(function(i) {
        var h = $(this).height();
        if ( h > max ) {
            max = h;
            index = i;
        }
    });
    return index;
}

function onBefore( e, opts, outgoing, incoming, forward ) {
    var h = $(incoming).outerHeight();
    opts.container.transition( { height: h }, opts.autoHeightSpeed, opts.autoHeightEasing );
}

function onDestroy( e, opts ) {
    if ( opts._autoHeightOnResize ) {
        $(window).off( 'resize orientationchange', opts._autoHeightOnResize );
        opts._autoHeightOnResize = null;
    }
    opts.container.off( 'cycle-slide-added cycle-slide-removed', initAutoHeight );
    opts.container.off( 'cycle-destroyed', onDestroy );
    opts.container.off( 'cycle-before', onBefore );

    if ( opts._sentinel ) {
        opts._sentinel.remove();
        opts._sentinel = null;
    }
}

})(jQuery);

/*! caption plugin for Cycle2;  version: 20130306 */
(function($) {
"use strict";

$.extend($.fn.cycle.defaults, {
    caption:          '> .cycle-caption',
    captionTemplate:  '{{slideNum}} / {{slideCount}}',
    overlay:          '> .cycle-overlay',
    overlayTemplate:  '<div>{{title}}</div><div>{{desc}}</div>',
    captionModule:    'caption'
});    

$(document).on( 'cycle-update-view', function( e, opts, slideOpts, currSlide ) {
    if ( opts.captionModule !== 'caption' )
        return;
    var el;
    $.each(['caption','overlay'], function() {
        var name = this; 
        var template = slideOpts[name+'Template'];
        var el = opts.API.getComponent( name );
        if( el.length && template ) {
            el.html( opts.API.tmpl( template, slideOpts, opts, currSlide ) );
            el.show();
        }
        else {
            el.hide();
        }
    });
});

$(document).on( 'cycle-destroyed', function( e, opts ) {
    var el;
    $.each(['caption','overlay'], function() {
        var name = this, template = opts[name+'Template'];
        if ( opts[name] && template ) {
            el = opts.API.getComponent( 'caption' );
            el.empty();
        }
    });
});

})(jQuery);

/*! command plugin for Cycle2;  version: 20140415 */
(function($) {
"use strict";

var c2 = $.fn.cycle;

$.fn.cycle = function( options ) {
    var cmd, cmdFn, opts;
    var args = $.makeArray( arguments );

    if ( $.type( options ) == 'number' ) {
        return this.cycle( 'goto', options );
    }

    if ( $.type( options ) == 'string' ) {
        return this.each(function() {
            var cmdArgs;
            cmd = options;
            opts = $(this).data('cycle.opts');

            if ( opts === undefined ) {
                c2.log('slideshow must be initialized before sending commands; "' + cmd + '" ignored');
                return;
            }
            else {
                cmd = cmd == 'goto' ? 'jump' : cmd; // issue #3; change 'goto' to 'jump' internally
                cmdFn = opts.API[ cmd ];
                if ( $.isFunction( cmdFn )) {
                    cmdArgs = $.makeArray( args );
                    cmdArgs.shift();
                    return cmdFn.apply( opts.API, cmdArgs );
                }
                else {
                    c2.log( 'unknown command: ', cmd );
                }
            }
        });
    }
    else {
        return c2.apply( this, arguments );
    }
};

// copy props
$.extend( $.fn.cycle, c2 );

$.extend( c2.API, {
    next: function() {
        var opts = this.opts();
        if ( opts.busy && ! opts.manualTrump )
            return;

        var count = opts.reverse ? -1 : 1;
        if ( opts.allowWrap === false && ( opts.currSlide + count ) >= opts.slideCount )
            return;

        opts.API.advanceSlide( count );
        opts.API.trigger('cycle-next', [ opts ]).log('cycle-next');
    },

    prev: function() {
        var opts = this.opts();
        if ( opts.busy && ! opts.manualTrump )
            return;
        var count = opts.reverse ? 1 : -1;
        if ( opts.allowWrap === false && ( opts.currSlide + count ) < 0 )
            return;

        opts.API.advanceSlide( count );
        opts.API.trigger('cycle-prev', [ opts ]).log('cycle-prev');
    },

    destroy: function() {
        this.stop(); //#204

        var opts = this.opts();
        var clean = $.isFunction( $._data ) ? $._data : $.noop;  // hack for #184 and #201
        clearTimeout(opts.timeoutId);
        opts.timeoutId = 0;
        opts.API.stop();
        opts.API.trigger( 'cycle-destroyed', [ opts ] ).log('cycle-destroyed');
        opts.container.removeData();
        clean( opts.container[0], 'parsedAttrs', false );

        // #75; remove inline styles
        if ( ! opts.retainStylesOnDestroy ) {
            opts.container.removeAttr( 'style' );
            opts.slides.removeAttr( 'style' );
            opts.slides.removeClass( opts.slideActiveClass );
        }
        opts.slides.each(function() {
            var slide = $(this);
            slide.removeData();
            slide.removeClass( opts.slideClass );
            clean( this, 'parsedAttrs', false );
        });
    },

    jump: function( index, fx ) {
        // go to the requested slide
        var fwd;
        var opts = this.opts();
        if ( opts.busy && ! opts.manualTrump )
            return;
        var num = parseInt( index, 10 );
        if (isNaN(num) || num < 0 || num >= opts.slides.length) {
            opts.API.log('goto: invalid slide index: ' + num);
            return;
        }
        if (num == opts.currSlide) {
            opts.API.log('goto: skipping, already on slide', num);
            return;
        }
        opts.nextSlide = num;
        clearTimeout(opts.timeoutId);
        opts.timeoutId = 0;
        opts.API.log('goto: ', num, ' (zero-index)');
        fwd = opts.currSlide < opts.nextSlide;
        opts._tempFx = fx;
        opts.API.prepareTx( true, fwd );
    },

    stop: function() {
        var opts = this.opts();
        var pauseObj = opts.container;
        clearTimeout(opts.timeoutId);
        opts.timeoutId = 0;
        opts.API.stopTransition();
        if ( opts.pauseOnHover ) {
            if ( opts.pauseOnHover !== true )
                pauseObj = $( opts.pauseOnHover );
            pauseObj.off('mouseenter mouseleave');
        }
        opts.API.trigger('cycle-stopped', [ opts ]).log('cycle-stopped');
    },

    reinit: function() {
        var opts = this.opts();
        opts.API.destroy();
        opts.container.cycle();
    },

    remove: function( index ) {
        var opts = this.opts();
        var slide, slideToRemove, slides = [], slideNum = 1;
        for ( var i=0; i < opts.slides.length; i++ ) {
            slide = opts.slides[i];
            if ( i == index ) {
                slideToRemove = slide;
            }
            else {
                slides.push( slide );
                $( slide ).data('cycle.opts').slideNum = slideNum;
                slideNum++;
            }
        }
        if ( slideToRemove ) {
            opts.slides = $( slides );
            opts.slideCount--;
            $( slideToRemove ).remove();
            if (index == opts.currSlide)
                opts.API.advanceSlide( 1 );
            else if ( index < opts.currSlide )
                opts.currSlide--;
            else
                opts.currSlide++;

            opts.API.trigger('cycle-slide-removed', [ opts, index, slideToRemove ]).log('cycle-slide-removed');
            opts.API.updateView();
        }
    }

});

// listen for clicks on elements with data-cycle-cmd attribute
$(document).on('click.cycle', '[data-cycle-cmd]', function(e) {
    // issue cycle command
    e.preventDefault();
    var el = $(this);
    var command = el.data('cycle-cmd');
    var context = el.data('cycle-context') || '.cycle-slideshow';
    $(context).cycle(command, el.data('cycle-arg'));
});


})(jQuery);

/*! hash plugin for Cycle2;  version: 20130905 */
(function($) {
"use strict";

$(document).on( 'cycle-pre-initialize', function( e, opts ) {
    onHashChange( opts, true );

    opts._onHashChange = function() {
        onHashChange( opts, false );
    };

    $( window ).on( 'hashchange', opts._onHashChange);
});

$(document).on( 'cycle-update-view', function( e, opts, slideOpts ) {
    if ( slideOpts.hash && ( '#' + slideOpts.hash ) != window.location.hash ) {
        opts._hashFence = true;
        window.location.hash = slideOpts.hash;
    }
});

$(document).on( 'cycle-destroyed', function( e, opts) {
    if ( opts._onHashChange ) {
        $( window ).off( 'hashchange', opts._onHashChange );
    }
});

function onHashChange( opts, setStartingSlide ) {
    var hash;
    if ( opts._hashFence ) {
        opts._hashFence = false;
        return;
    }
    
    hash = window.location.hash.substring(1);

    opts.slides.each(function(i) {
        if ( $(this).data( 'cycle-hash' ) == hash ) {
            if ( setStartingSlide === true ) {
                opts.startingSlide = i;
            }
            else {
                var fwd = opts.currSlide < i;
                opts.nextSlide = i;
                opts.API.prepareTx( true, fwd );
            }
            return false;
        }
    });
}

})(jQuery);

/*! loader plugin for Cycle2;  version: 20131121 */
(function($) {
"use strict";

$.extend($.fn.cycle.defaults, {
    loader: false
});

$(document).on( 'cycle-bootstrap', function( e, opts ) {
    var addFn;

    if ( !opts.loader )
        return;

    // override API.add for this slideshow
    addFn = opts.API.add;
    opts.API.add = add;

    function add( slides, prepend ) {
        var slideArr = [];
        if ( $.type( slides ) == 'string' )
            slides = $.trim( slides );
        else if ( $.type( slides) === 'array' ) {
            for (var i=0; i < slides.length; i++ )
                slides[i] = $(slides[i])[0];
        }

        slides = $( slides );
        var slideCount = slides.length;

        if ( ! slideCount )
            return;

        slides.css('visibility','hidden').appendTo('body').each(function(i) { // appendTo fixes #56
            var count = 0;
            var slide = $(this);
            var images = slide.is('img') ? slide : slide.find('img');
            slide.data('index', i);
            // allow some images to be marked as unimportant (and filter out images w/o src value)
            images = images.filter(':not(.cycle-loader-ignore)').filter(':not([src=""])');
            if ( ! images.length ) {
                --slideCount;
                slideArr.push( slide );
                return;
            }

            count = images.length;
            images.each(function() {
                // add images that are already loaded
                if ( this.complete ) {
                    imageLoaded();
                }
                else {
                    $(this).load(function() {
                        imageLoaded();
                    }).on("error", function() {
                        if ( --count === 0 ) {
                            // ignore this slide
                            opts.API.log('slide skipped; img not loaded:', this.src);
                            if ( --slideCount === 0 && opts.loader == 'wait') {
                                addFn.apply( opts.API, [ slideArr, prepend ] );
                            }
                        }
                    });
                }
            });

            function imageLoaded() {
                if ( --count === 0 ) {
                    --slideCount;
                    addSlide( slide );
                }
            }
        });

        if ( slideCount )
            opts.container.addClass('cycle-loading');
        

        function addSlide( slide ) {
            var curr;
            if ( opts.loader == 'wait' ) {
                slideArr.push( slide );
                if ( slideCount === 0 ) {
                    // #59; sort slides into original markup order
                    slideArr.sort( sorter );
                    addFn.apply( opts.API, [ slideArr, prepend ] );
                    opts.container.removeClass('cycle-loading');
                }
            }
            else {
                curr = $(opts.slides[opts.currSlide]);
                addFn.apply( opts.API, [ slide, prepend ] );
                curr.show();
                opts.container.removeClass('cycle-loading');
            }
        }

        function sorter(a, b) {
            return a.data('index') - b.data('index');
        }
    }
});

})(jQuery);

/*! pager plugin for Cycle2;  version: 20140415 */
(function($) {
"use strict";

$.extend($.fn.cycle.defaults, {
    pager:            '> .cycle-pager',
    pagerActiveClass: 'cycle-pager-active',
    pagerEvent:       'click.cycle',
    pagerEventBubble: undefined,
    pagerTemplate:    '<span>&bull;</span>'
});

$(document).on( 'cycle-bootstrap', function( e, opts, API ) {
    // add method to API
    API.buildPagerLink = buildPagerLink;
});

$(document).on( 'cycle-slide-added', function( e, opts, slideOpts, slideAdded ) {
    if ( opts.pager ) {
        opts.API.buildPagerLink ( opts, slideOpts, slideAdded );
        opts.API.page = page;
    }
});

$(document).on( 'cycle-slide-removed', function( e, opts, index, slideRemoved ) {
    if ( opts.pager ) {
        var pagers = opts.API.getComponent( 'pager' );
        pagers.each(function() {
            var pager = $(this);
            $( pager.children()[index] ).remove();
        });
    }
});

$(document).on( 'cycle-update-view', function( e, opts, slideOpts ) {
    var pagers;

    if ( opts.pager ) {
        pagers = opts.API.getComponent( 'pager' );
        pagers.each(function() {
           $(this).children().removeClass( opts.pagerActiveClass )
            .eq( opts.currSlide ).addClass( opts.pagerActiveClass );
        });
    }
});

$(document).on( 'cycle-destroyed', function( e, opts ) {
    var pager = opts.API.getComponent( 'pager' );

    if ( pager ) {
        pager.children().off( opts.pagerEvent ); // #202
        if ( opts.pagerTemplate )
            pager.empty();
    }
});

function buildPagerLink( opts, slideOpts, slide ) {
    var pagerLink;
    var pagers = opts.API.getComponent( 'pager' );
    pagers.each(function() {
        var pager = $(this);
        if ( slideOpts.pagerTemplate ) {
            var markup = opts.API.tmpl( slideOpts.pagerTemplate, slideOpts, opts, slide[0] );
            pagerLink = $( markup ).appendTo( pager );
        }
        else {
            pagerLink = pager.children().eq( opts.slideCount - 1 );
        }
        pagerLink.on( opts.pagerEvent, function(e) {
            if ( ! opts.pagerEventBubble )
                e.preventDefault();
            opts.API.page( pager, e.currentTarget);
        });
    });
}

function page( pager, target ) {
    /*jshint validthis:true */
    var opts = this.opts();
    if ( opts.busy && ! opts.manualTrump )
        return;

    var index = pager.children().index( target );
    var nextSlide = index;
    var fwd = opts.currSlide < nextSlide;
    if (opts.currSlide == nextSlide) {
        return; // no op, clicked pager for the currently displayed slide
    }
    opts.nextSlide = nextSlide;
    opts._tempFx = opts.pagerFx;
    opts.API.prepareTx( true, fwd );
    opts.API.trigger('cycle-pager-activated', [opts, pager, target ]);
}

})(jQuery);

/*! prevnext plugin for Cycle2;  version: 20140408 */
(function($) {
"use strict";

$.extend($.fn.cycle.defaults, {
    next:           '> .cycle-next',
    nextEvent:      'click.cycle',
    disabledClass:  'disabled',
    prev:           '> .cycle-prev',
    prevEvent:      'click.cycle',
    swipe:          false
});

$(document).on( 'cycle-initialized', function( e, opts ) {
    opts.API.getComponent( 'next' ).on( opts.nextEvent, function(e) {
        e.preventDefault();
        opts.API.next();
    });

    opts.API.getComponent( 'prev' ).on( opts.prevEvent, function(e) {
        e.preventDefault();
        opts.API.prev();
    });

    if ( opts.swipe ) {
        var nextEvent = opts.swipeVert ? 'swipeUp.cycle' : 'swipeLeft.cycle swipeleft.cycle';
        var prevEvent = opts.swipeVert ? 'swipeDown.cycle' : 'swipeRight.cycle swiperight.cycle';
        opts.container.on( nextEvent, function(e) {
            opts._tempFx = opts.swipeFx;
            opts.API.next();
        });
        opts.container.on( prevEvent, function() {
            opts._tempFx = opts.swipeFx;
            opts.API.prev();
        });
    }
});

$(document).on( 'cycle-update-view', function( e, opts, slideOpts, currSlide ) {
    if ( opts.allowWrap )
        return;

    var cls = opts.disabledClass;
    var next = opts.API.getComponent( 'next' );
    var prev = opts.API.getComponent( 'prev' );
    var prevBoundry = opts._prevBoundry || 0;
    var nextBoundry = (opts._nextBoundry !== undefined)?opts._nextBoundry:opts.slideCount - 1;

    if ( opts.currSlide == nextBoundry )
        next.addClass( cls ).prop( 'disabled', true );
    else
        next.removeClass( cls ).prop( 'disabled', false );

    if ( opts.currSlide === prevBoundry )
        prev.addClass( cls ).prop( 'disabled', true );
    else
        prev.removeClass( cls ).prop( 'disabled', false );
});


$(document).on( 'cycle-destroyed', function( e, opts ) {
    opts.API.getComponent( 'prev' ).off( opts.nextEvent );
    opts.API.getComponent( 'next' ).off( opts.prevEvent );
    opts.container.off( 'swipeleft.cycle swiperight.cycle swipeLeft.cycle swipeRight.cycle swipeUp.cycle swipeDown.cycle' );
});

})(jQuery);

/*! progressive loader plugin for Cycle2;  version: 20130315 */
(function($) {
"use strict";

$.extend($.fn.cycle.defaults, {
    progressive: false
});

$(document).on( 'cycle-pre-initialize', function( e, opts ) {
    if ( !opts.progressive )
        return;

    var API = opts.API;
    var nextFn = API.next;
    var prevFn = API.prev;
    var prepareTxFn = API.prepareTx;
    var type = $.type( opts.progressive );
    var slides, scriptEl;

    if ( type == 'array' ) {
        slides = opts.progressive;
    }
    else if ($.isFunction( opts.progressive ) ) {
        slides = opts.progressive( opts );
    }
    else if ( type == 'string' ) {
        scriptEl = $( opts.progressive );
        slides = $.trim( scriptEl.html() );
        if ( !slides )
            return;
        // is it json array?
        if ( /^(\[)/.test( slides ) ) {
            try {
                slides = $.parseJSON( slides );
            }
            catch(err) {
                API.log( 'error parsing progressive slides', err );
                return;
            }
        }
        else {
            // plain text, split on delimeter
            slides = slides.split( new RegExp( scriptEl.data('cycle-split') || '\n') );
            
            // #95; look for empty slide
            if ( ! slides[ slides.length - 1 ] )
                slides.pop();
        }
    }



    if ( prepareTxFn ) {
        API.prepareTx = function( manual, fwd ) {
            var index, slide;

            if ( manual || slides.length === 0 ) {
                prepareTxFn.apply( opts.API, [ manual, fwd ] );
                return;
            }

            if ( fwd && opts.currSlide == ( opts.slideCount-1) ) {
                slide = slides[ 0 ];
                slides = slides.slice( 1 );
                opts.container.one('cycle-slide-added', function(e, opts ) {
                    setTimeout(function() {
                        opts.API.advanceSlide( 1 );
                    },50);
                });
                opts.API.add( slide );
            }
            else if ( !fwd && opts.currSlide === 0 ) {
                index = slides.length-1;
                slide = slides[ index ];
                slides = slides.slice( 0, index );
                opts.container.one('cycle-slide-added', function(e, opts ) {
                    setTimeout(function() {
                        opts.currSlide = 1;
                        opts.API.advanceSlide( -1 );
                    },50);
                });
                opts.API.add( slide, true );
            }
            else {
                prepareTxFn.apply( opts.API, [ manual, fwd ] );
            }
        };
    }

    if ( nextFn ) {
        API.next = function() {
            var opts = this.opts();
            if ( slides.length && opts.currSlide == ( opts.slideCount - 1 ) ) {
                var slide = slides[ 0 ];
                slides = slides.slice( 1 );
                opts.container.one('cycle-slide-added', function(e, opts ) {
                    nextFn.apply( opts.API );
                    opts.container.removeClass('cycle-loading');
                });
                opts.container.addClass('cycle-loading');
                opts.API.add( slide );
            }
            else {
                nextFn.apply( opts.API );    
            }
        };
    }
    
    if ( prevFn ) {
        API.prev = function() {
            var opts = this.opts();
            if ( slides.length && opts.currSlide === 0 ) {
                var index = slides.length-1;
                var slide = slides[ index ];
                slides = slides.slice( 0, index );
                opts.container.one('cycle-slide-added', function(e, opts ) {
                    opts.currSlide = 1;
                    opts.API.advanceSlide( -1 );
                    opts.container.removeClass('cycle-loading');
                });
                opts.container.addClass('cycle-loading');
                opts.API.add( slide, true );
            }
            else {
                prevFn.apply( opts.API );
            }
        };
    }
});

})(jQuery);

/*! tmpl plugin for Cycle2;  version: 20121227 */
(function($) {
"use strict";

$.extend($.fn.cycle.defaults, {
    tmplRegex: '{{((.)?.*?)}}'
});

$.extend($.fn.cycle.API, {
    tmpl: function( str, opts /*, ... */) {
        var regex = new RegExp( opts.tmplRegex || $.fn.cycle.defaults.tmplRegex, 'g' );
        var args = $.makeArray( arguments );
        args.shift();
        return str.replace(regex, function(_, str) {
            var i, j, obj, prop, names = str.split('.');
            for (i=0; i < args.length; i++) {
                obj = args[i];
                if ( ! obj )
                    continue;
                if (names.length > 1) {
                    prop = obj;
                    for (j=0; j < names.length; j++) {
                        obj = prop;
                        prop = prop[ names[j] ] || str;
                    }
                } else {
                    prop = obj[str];
                }

                if ($.isFunction(prop))
                    return prop.apply(obj, args);
                if (prop !== undefined && prop !== null && prop != str)
                    return prop;
            }
            return str;
        });
    }
});    

})(jQuery);
/* Plugin for Cycle2; Copyright (c) 2012 M. Alsup; v20141007 */
!function(a){"use strict";a.event.special.swipe=a.event.special.swipe||{scrollSupressionThreshold:10,durationThreshold:1e3,horizontalDistanceThreshold:30,verticalDistanceThreshold:75,setup:function(){var b=a(this);b.bind("touchstart",function(c){function d(b){if(g){var c=b.originalEvent.touches?b.originalEvent.touches[0]:b;e={time:(new Date).getTime(),coords:[c.pageX,c.pageY]},Math.abs(g.coords[0]-e.coords[0])>a.event.special.swipe.scrollSupressionThreshold&&b.preventDefault()}}var e,f=c.originalEvent.touches?c.originalEvent.touches[0]:c,g={time:(new Date).getTime(),coords:[f.pageX,f.pageY],origin:a(c.target)};b.bind("touchmove",d).one("touchend",function(){b.unbind("touchmove",d),g&&e&&e.time-g.time<a.event.special.swipe.durationThreshold&&Math.abs(g.coords[0]-e.coords[0])>a.event.special.swipe.horizontalDistanceThreshold&&Math.abs(g.coords[1]-e.coords[1])<a.event.special.swipe.verticalDistanceThreshold&&g.origin.trigger("swipe").trigger(g.coords[0]>e.coords[0]?"swipeleft":"swiperight"),g=e=void 0})})}},a.event.special.swipeleft=a.event.special.swipeleft||{setup:function(){a(this).bind("swipe",a.noop)}},a.event.special.swiperight=a.event.special.swiperight||a.event.special.swipeleft}(jQuery);
// Clone Object
function clone(obj) {
    var result = {};
    for (var key in obj) {
        result[key] = obj[key];
    }
    return result;
}

// Avoid `console` errors in browsers that lack a console.
(function() {
    var method;
    var noop = function () {};
    var methods = [
        'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
        'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
        'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
        'timeStamp', 'trace', 'warn'
    ];
    var length = methods.length;
    var console = (window.console = window.console || {});

    while (length--) {
        method = methods[length];

        // Only stub undefined methods.
        if (!console[method]) {
            console[method] = noop;
        }
    }
}());

/*
 * debouncedresize: special jQuery event that happens once after a window resize
 *
 * latest version and complete README available on Github:
 * https://github.com/louisremi/jquery-smartresize
 *
 * Copyright 2012 @louis_remi
 * Licensed under the MIT license.
 *
 * This saved you an hour of work? 
 * Send me music http://www.amazon.co.uk/wishlist/HNTU0468LQON
 */

(function($) {

var $event = $.event,
	$special,
	resizeTimeout;

$special = $event.special.debouncedresize = {
	setup: function() {
		$( this ).on( "resize", $special.handler );
	},
	teardown: function() {
		$( this ).off( "resize", $special.handler );
	},
	handler: function( event, execAsap ) {
		// Save the context
		var context = this,
			args = arguments,
			dispatch = function() {
				// set correct event type
				event.type = "debouncedresize";
				$event.dispatch.apply( context, args );
			};

		if ( resizeTimeout ) {
			clearTimeout( resizeTimeout );
		}

		execAsap ?
			dispatch() :
			resizeTimeout = setTimeout( dispatch, $special.threshold );
	},
	threshold: 150
};

})(jQuery);

(function(t,e){if(typeof define==="function"&&define.amd){define(["jquery"],e)}else if(typeof exports==="object"){module.exports=e(require("jquery"))}else{e(t.jQuery)}})(this,function(t){t.transit={version:"0.9.12",propertyMap:{marginLeft:"margin",marginRight:"margin",marginBottom:"margin",marginTop:"margin",paddingLeft:"padding",paddingRight:"padding",paddingBottom:"padding",paddingTop:"padding"},enabled:true,useTransitionEnd:false};var e=document.createElement("div");var n={};function i(t){if(t in e.style)return t;var n=["Moz","Webkit","O","ms"];var i=t.charAt(0).toUpperCase()+t.substr(1);for(var r=0;r<n.length;++r){var s=n[r]+i;if(s in e.style){return s}}}function r(){e.style[n.transform]="";e.style[n.transform]="rotateY(90deg)";return e.style[n.transform]!==""}var s=navigator.userAgent.toLowerCase().indexOf("chrome")>-1;n.transition=i("transition");n.transitionDelay=i("transitionDelay");n.transform=i("transform");n.transformOrigin=i("transformOrigin");n.filter=i("Filter");n.transform3d=r();var a={transition:"transitionend",MozTransition:"transitionend",OTransition:"oTransitionEnd",WebkitTransition:"webkitTransitionEnd",msTransition:"MSTransitionEnd"};var o=n.transitionEnd=a[n.transition]||null;for(var u in n){if(n.hasOwnProperty(u)&&typeof t.support[u]==="undefined"){t.support[u]=n[u]}}e=null;t.cssEase={_default:"ease","in":"ease-in",out:"ease-out","in-out":"ease-in-out",snap:"cubic-bezier(0,1,.5,1)",easeInCubic:"cubic-bezier(.550,.055,.675,.190)",easeOutCubic:"cubic-bezier(.215,.61,.355,1)",easeInOutCubic:"cubic-bezier(.645,.045,.355,1)",easeInCirc:"cubic-bezier(.6,.04,.98,.335)",easeOutCirc:"cubic-bezier(.075,.82,.165,1)",easeInOutCirc:"cubic-bezier(.785,.135,.15,.86)",easeInExpo:"cubic-bezier(.95,.05,.795,.035)",easeOutExpo:"cubic-bezier(.19,1,.22,1)",easeInOutExpo:"cubic-bezier(1,0,0,1)",easeInQuad:"cubic-bezier(.55,.085,.68,.53)",easeOutQuad:"cubic-bezier(.25,.46,.45,.94)",easeInOutQuad:"cubic-bezier(.455,.03,.515,.955)",easeInQuart:"cubic-bezier(.895,.03,.685,.22)",easeOutQuart:"cubic-bezier(.165,.84,.44,1)",easeInOutQuart:"cubic-bezier(.77,0,.175,1)",easeInQuint:"cubic-bezier(.755,.05,.855,.06)",easeOutQuint:"cubic-bezier(.23,1,.32,1)",easeInOutQuint:"cubic-bezier(.86,0,.07,1)",easeInSine:"cubic-bezier(.47,0,.745,.715)",easeOutSine:"cubic-bezier(.39,.575,.565,1)",easeInOutSine:"cubic-bezier(.445,.05,.55,.95)",easeInBack:"cubic-bezier(.6,-.28,.735,.045)",easeOutBack:"cubic-bezier(.175, .885,.32,1.275)",easeInOutBack:"cubic-bezier(.68,-.55,.265,1.55)"};t.cssHooks["transit:transform"]={get:function(e){return t(e).data("transform")||new f},set:function(e,i){var r=i;if(!(r instanceof f)){r=new f(r)}if(n.transform==="WebkitTransform"&&!s){e.style[n.transform]=r.toString(true)}else{e.style[n.transform]=r.toString()}t(e).data("transform",r)}};t.cssHooks.transform={set:t.cssHooks["transit:transform"].set};t.cssHooks.filter={get:function(t){return t.style[n.filter]},set:function(t,e){t.style[n.filter]=e}};if(t.fn.jquery<"1.8"){t.cssHooks.transformOrigin={get:function(t){return t.style[n.transformOrigin]},set:function(t,e){t.style[n.transformOrigin]=e}};t.cssHooks.transition={get:function(t){return t.style[n.transition]},set:function(t,e){t.style[n.transition]=e}}}p("scale");p("scaleX");p("scaleY");p("translate");p("rotate");p("rotateX");p("rotateY");p("rotate3d");p("perspective");p("skewX");p("skewY");p("x",true);p("y",true);function f(t){if(typeof t==="string"){this.parse(t)}return this}f.prototype={setFromString:function(t,e){var n=typeof e==="string"?e.split(","):e.constructor===Array?e:[e];n.unshift(t);f.prototype.set.apply(this,n)},set:function(t){var e=Array.prototype.slice.apply(arguments,[1]);if(this.setter[t]){this.setter[t].apply(this,e)}else{this[t]=e.join(",")}},get:function(t){if(this.getter[t]){return this.getter[t].apply(this)}else{return this[t]||0}},setter:{rotate:function(t){this.rotate=b(t,"deg")},rotateX:function(t){this.rotateX=b(t,"deg")},rotateY:function(t){this.rotateY=b(t,"deg")},scale:function(t,e){if(e===undefined){e=t}this.scale=t+","+e},skewX:function(t){this.skewX=b(t,"deg")},skewY:function(t){this.skewY=b(t,"deg")},perspective:function(t){this.perspective=b(t,"px")},x:function(t){this.set("translate",t,null)},y:function(t){this.set("translate",null,t)},translate:function(t,e){if(this._translateX===undefined){this._translateX=0}if(this._translateY===undefined){this._translateY=0}if(t!==null&&t!==undefined){this._translateX=b(t,"px")}if(e!==null&&e!==undefined){this._translateY=b(e,"px")}this.translate=this._translateX+","+this._translateY}},getter:{x:function(){return this._translateX||0},y:function(){return this._translateY||0},scale:function(){var t=(this.scale||"1,1").split(",");if(t[0]){t[0]=parseFloat(t[0])}if(t[1]){t[1]=parseFloat(t[1])}return t[0]===t[1]?t[0]:t},rotate3d:function(){var t=(this.rotate3d||"0,0,0,0deg").split(",");for(var e=0;e<=3;++e){if(t[e]){t[e]=parseFloat(t[e])}}if(t[3]){t[3]=b(t[3],"deg")}return t}},parse:function(t){var e=this;t.replace(/([a-zA-Z0-9]+)\((.*?)\)/g,function(t,n,i){e.setFromString(n,i)})},toString:function(t){var e=[];for(var i in this){if(this.hasOwnProperty(i)){if(!n.transform3d&&(i==="rotateX"||i==="rotateY"||i==="perspective"||i==="transformOrigin")){continue}if(i[0]!=="_"){if(t&&i==="scale"){e.push(i+"3d("+this[i]+",1)")}else if(t&&i==="translate"){e.push(i+"3d("+this[i]+",0)")}else{e.push(i+"("+this[i]+")")}}}}return e.join(" ")}};function c(t,e,n){if(e===true){t.queue(n)}else if(e){t.queue(e,n)}else{t.each(function(){n.call(this)})}}function l(e){var i=[];t.each(e,function(e){e=t.camelCase(e);e=t.transit.propertyMap[e]||t.cssProps[e]||e;e=h(e);if(n[e])e=h(n[e]);if(t.inArray(e,i)===-1){i.push(e)}});return i}function d(e,n,i,r){var s=l(e);if(t.cssEase[i]){i=t.cssEase[i]}var a=""+y(n)+" "+i;if(parseInt(r,10)>0){a+=" "+y(r)}var o=[];t.each(s,function(t,e){o.push(e+" "+a)});return o.join(", ")}t.fn.transition=t.fn.transit=function(e,i,r,s){var a=this;var u=0;var f=true;var l=t.extend(true,{},e);if(typeof i==="function"){s=i;i=undefined}if(typeof i==="object"){r=i.easing;u=i.delay||0;f=typeof i.queue==="undefined"?true:i.queue;s=i.complete;i=i.duration}if(typeof r==="function"){s=r;r=undefined}if(typeof l.easing!=="undefined"){r=l.easing;delete l.easing}if(typeof l.duration!=="undefined"){i=l.duration;delete l.duration}if(typeof l.complete!=="undefined"){s=l.complete;delete l.complete}if(typeof l.queue!=="undefined"){f=l.queue;delete l.queue}if(typeof l.delay!=="undefined"){u=l.delay;delete l.delay}if(typeof i==="undefined"){i=t.fx.speeds._default}if(typeof r==="undefined"){r=t.cssEase._default}i=y(i);var p=d(l,i,r,u);var h=t.transit.enabled&&n.transition;var b=h?parseInt(i,10)+parseInt(u,10):0;if(b===0){var g=function(t){a.css(l);if(s){s.apply(a)}if(t){t()}};c(a,f,g);return a}var m={};var v=function(e){var i=false;var r=function(){if(i){a.unbind(o,r)}if(b>0){a.each(function(){this.style[n.transition]=m[this]||null})}if(typeof s==="function"){s.apply(a)}if(typeof e==="function"){e()}};if(b>0&&o&&t.transit.useTransitionEnd){i=true;a.bind(o,r)}else{window.setTimeout(r,b)}a.each(function(){if(b>0){this.style[n.transition]=p}t(this).css(l)})};var z=function(t){this.offsetWidth;v(t)};c(a,f,z);return this};function p(e,i){if(!i){t.cssNumber[e]=true}t.transit.propertyMap[e]=n.transform;t.cssHooks[e]={get:function(n){var i=t(n).css("transit:transform");return i.get(e)},set:function(n,i){var r=t(n).css("transit:transform");r.setFromString(e,i);t(n).css({"transit:transform":r})}}}function h(t){return t.replace(/([A-Z])/g,function(t){return"-"+t.toLowerCase()})}function b(t,e){if(typeof t==="string"&&!t.match(/^[\-0-9\.]+$/)){return t}else{return""+t+e}}function y(e){var n=e;if(typeof n==="string"&&!n.match(/^[\-0-9\.]+/)){n=t.fx.speeds[n]||t.fx.speeds._default}return b(n,"ms")}t.transit.getTransitionValue=d;return t});

/*global jQuery */
/*jshint browser:true */
/*!
* FitVids 1.1
*
* Copyright 2013, Chris Coyier - http://css-tricks.com + Dave Rupert - http://daverupert.com
* Credit to Thierry Koblentz - http://www.alistapart.com/articles/creating-intrinsic-ratios-for-video/
* Released under the WTFPL license - http://sam.zoy.org/wtfpl/
*
*/

;(function( $ ){

  'use strict';

  $.fn.fitVids = function( options ) {
    var settings = {
      customSelector: null,
      ignore: null
    };

    if(!document.getElementById('fit-vids-style')) {
      // appendStyles: https://github.com/toddmotto/fluidvids/blob/master/dist/fluidvids.js
      var head = document.head || document.getElementsByTagName('head')[0];
      var css = '.fluid-width-video-wrapper{width:100%;position:relative;padding:0;}.fluid-width-video-wrapper iframe,.fluid-width-video-wrapper object,.fluid-width-video-wrapper embed {position:absolute;top:0;left:0;width:100%;height:100%;}';
      var div = document.createElement("div");
      div.innerHTML = '<p>x</p><style id="fit-vids-style">' + css + '</style>';
      head.appendChild(div.childNodes[1]);
    }

    if ( options ) {
      $.extend( settings, options );
    }

    return this.each(function(){
      var selectors = [
        'iframe[src*="player.vimeo.com"]',
        'iframe[src*="youtube.com"]',
        'iframe[src*="youtube-nocookie.com"]',
        'iframe[src*="kickstarter.com"][src*="video.html"]',
        'object',
        'embed'
      ];

      if (settings.customSelector) {
        selectors.push(settings.customSelector);
      }

      var ignoreList = '.fitvidsignore';

      if(settings.ignore) {
        ignoreList = ignoreList + ', ' + settings.ignore;
      }

      var $allVideos = $(this).find(selectors.join(','));
      $allVideos = $allVideos.not('object object'); // SwfObj conflict patch
      $allVideos = $allVideos.not(ignoreList); // Disable FitVids on this video.

      $allVideos.each(function(count){
        var $this = $(this);
        if($this.parents(ignoreList).length > 0) {
          return; // Disable FitVids on this video.
        }
        if (this.tagName.toLowerCase() === 'embed' && $this.parent('object').length || $this.parent('.fluid-width-video-wrapper').length) { return; }
        if ((!$this.css('height') && !$this.css('width')) && (isNaN($this.attr('height')) || isNaN($this.attr('width'))))
        {
          $this.attr('height', 9);
          $this.attr('width', 16);
        }
        var height = ( this.tagName.toLowerCase() === 'object' || ($this.attr('height') && !isNaN(parseInt($this.attr('height'), 10))) ) ? parseInt($this.attr('height'), 10) : $this.height(),
            width = !isNaN(parseInt($this.attr('width'), 10)) ? parseInt($this.attr('width'), 10) : $this.width(),
            aspectRatio = height / width;
        if(!$this.attr('id')){
          var videoID = 'fitvid' + count;
          $this.attr('id', videoID);
        }
        $this.wrap('<div class="fluid-width-video-wrapper"></div>').parent('.fluid-width-video-wrapper').css('padding-top', (aspectRatio * 100)+'%');
        $this.removeAttr('height').removeAttr('width');
      });
    });
  };
// Works with either jQuery or Zepto
})( window.jQuery || window.Zepto );

/*! lazysizes - v1.0.0-RC2 - 2015-02-18
 Licensed MIT */
!function(a,b){a.lazySizes=b(a,a.document),"function"==typeof define&&define.amd&&define(a.lazySizes)}(window,function(a,b){"use strict";if(b.getElementsByClassName){var c,d=b.documentElement,e=/^picture$/i,f=["load","error","lazyincluded","_lazyloaded"],g=function(a,b){var c=new RegExp("(\\s|^)"+b+"(\\s|$)");return a.className.match(c)&&c},h=function(a,b){g(a,b)||(a.className+=" "+b)},i=function(a,b){var c;(c=g(a,b))&&(a.className=a.className.replace(c," "))},j=function(a,b,c){var d=c?"addEventListener":"removeEventListener";c&&j(a,b),f.forEach(function(c){a[d](c,b)})},k=function(a,c,d,e,f){var g=b.createEvent("Event");return g.initEvent(c,!e,!f),g.details=d||{},a.dispatchEvent(g),g},l=function(b,d){var e;a.HTMLPictureElement||((e=a.picturefill||a.respimage||c.polyfill)?e({reevaluate:!0,reparse:!0,elements:[b]}):d&&d.src&&(b.src=d.src))},m=function(a,b){return getComputedStyle(a,null)[b]},n=function(a,b){for(var d=a.offsetWidth;d<c.minSize&&b&&!a._lazysizesWidth;)d=b.offsetWidth,b=b.parentNode;return d},o=function(a){var c,d,e=function(){c&&(c=!1,a())},f=function(){clearInterval(d),b.hidden||(e(),d=setInterval(e,51))};return b.addEventListener("visibilitychange",f),f(),function(a){c=!0,a===!0&&e()}},p=function(){var f,n,r,s,t,u,v,w,x,y,z,A=a.HTMLPictureElement&&navigator.userAgent.match(/hrome\/(\d+)/)&&40==RegExp.$1,B=/^img$/i,C=/^iframe$/i,D="onscroll"in a,E=-2,F=E,G=E,H=E,I=0,J=0,K=0,L=function(a){J--,a&&a.target&&j(a.target,L),(!a||0>J||!a.target)&&(J=0)},M=function(a,b){var c,d=a,e="hidden"!=m(a,"visibility");for(w-=b,z+=b,x-=b,y+=b;e&&(d=d.offsetParent);)e=s&&2>J||(m(d,"opacity")||1)>0,e&&"visible"!=m(d,"overflow")&&(c=d.getBoundingClientRect(),e=y>c.left-1&&x<c.right+1&&z>c.top-1&&w<c.bottom+1);return e},N=function(){var a,b,d,e,g,h,i,j,k,l=n.length;if(l&&p.m){for(b=Date.now(),f||S(),a=K;l>a;a++,K++)if(n[a]&&!n[a]._lazyRace)if(D){if((j=n[a].getAttribute("data-expand"))&&(h=1*j)||(h=H),!(J>6&&(!j||"src"in n[a])))if(h>E&&(p.m<2||J>3)&&(h=E),k!==h&&(u=innerWidth+h,v=innerHeight+h,i=-1*h,k=h),d=n[a].getBoundingClientRect(),(z=d.bottom)>=i&&(w=d.top)<=v&&(y=d.right)>=i&&(x=d.left)<=u&&(z||y||x||w)&&(s&&G>H&&3>J&&4>I&&!j||M(n[a],h)))K--,b+=2,R(n[a]),g=!0;else{if(Date.now()-b>3)return K++,void O();!g&&s&&!e&&3>J&&4>I&&(r[0]||c.preloadAfterLoad)&&(r[0]||!j&&(z||y||x||w||"auto"!=n[a].getAttribute(c.sizesAttr)))&&(e=r[0]||n[a])}}else R(n[a]);K=0,I++,G>H&&2>J&&I>5&&p.m>2?(H=G,I=0,O()):H=H!=F&&p.m>1&&I>4?F:E,e&&!g&&R(e)}},O=o(N),P=function(a){h(a.target,c.loadedClass),i(a.target,c.loadingClass),j(a.target,P)},Q=function(a,b){try{a.contentWindow.location.replace(b)}catch(c){a.setAttribute("src",b)}},R=function(a,b){var d,f,m,n,o,p,r,u,v,w,x,y=a.currentSrc||a.src,z=B.test(a.nodeName),D=a.getAttribute(c.sizesAttr)||a.getAttribute("sizes"),E="auto"==D;if(!E&&s||!z||!y||a.complete||g(a,c.errorClass)){if(a._lazyRace=!0,!(v=k(a,"lazybeforeunveil",{force:!!b})).defaultPrevented){if(D&&(E?q.updateElem(a,!0):a.setAttribute("sizes",D)),p=a.getAttribute(c.srcsetAttr),o=a.getAttribute(c.srcAttr),z&&(r=a.parentNode,u=e.test(r.nodeName||"")),w=v.details.firesLoad||"src"in a&&(p||o||u),w&&(J++,j(a,L,!0),clearTimeout(t),t=setTimeout(L,3e3)),u)for(d=r.getElementsByTagName("source"),f=0,m=d.length;m>f;f++)(x=c.customMedia[d[f].getAttribute("data-media")||d[f].getAttribute("media")])&&d[f].setAttribute("media",x),n=d[f].getAttribute(c.srcsetAttr),n&&d[f].setAttribute("srcset",n);p?(a.setAttribute("srcset",p),A&&D&&a.removeAttribute("src")):o&&(C.test(a.nodeName)?Q(a,o):a.setAttribute("src",o)),h(a,c.loadingClass),j(a,P,!0)}setTimeout(function(){a._lazyRace&&delete a._lazyRace,"auto"==D&&h(a,c.autosizesClass),(p||u)&&l(a,{src:o}),i(a,c.lazyClass),(!w||a.complete&&y==(a.currentSrc||a.src))&&(w&&L(v),P(v)),a=null})}},S=function(){f||(F=Math.max(Math.min(c.expand||140,300),9),G=4*F),f=!0},T=function(){p.m=3},U=function(){s=!0,T(),O(!0)};return{_i:function(){n=b.getElementsByClassName(c.lazyClass),r=b.getElementsByClassName(c.lazyClass+" "+c.preloadClass),c.scroll&&addEventListener("scroll",O,!0),addEventListener("resize",function(){f=!1,O()},!0),a.MutationObserver?new MutationObserver(O).observe(d,{childList:!0,subtree:!0,attributes:!0}):(d.addEventListener("DOMNodeInserted",O,!0),d.addEventListener("DOMAttrModified",O,!0),setInterval(O,3e3)),addEventListener("hashchange",O,!0),["transitionstart","transitionend","load","focus","mouseover","animationend","click"].forEach(function(a){b.addEventListener(a,O,!0)}),(s=/d$|^c/.test(b.readyState))||(addEventListener("load",U),b.addEventListener("DOMContentLoaded",O)),setTimeout(T,777),O(n.length>0)},m:1,checkElems:O,unveil:R}}(),q=function(){var a,d=function(a,b){var c,d,f,g,h,i=a.parentNode;if(i&&(c=n(a,i),h=k(a,"lazybeforesizes",{width:c,dataAttr:!!b}),!h.defaultPrevented&&(c=h.details.width,c&&c!==a._lazysizesWidth))){if(a._lazysizesWidth=c,c+="px",a.setAttribute("sizes",c),e.test(i.nodeName||""))for(d=i.getElementsByTagName("source"),f=0,g=d.length;g>f;f++)d[f].setAttribute("sizes",c);h.details.dataAttr||l(a,h.details)}},f=function(){var b,c=a.length;if(c)for(b=0;c>b;b++)d(a[b])},g=o(f);return{_i:function(){a=b.getElementsByClassName(c.autosizesClass),addEventListener("resize",g)},checkElems:g,updateElem:d}}(),r=function(){r.i||(r.i=!0,q._i(),p._i())};return function(){var b,d={lazyClass:"lazyload",loadedClass:"lazyloaded",loadingClass:"lazyloading",preloadClass:"lazypreload",errorClass:"lazyerror",scroll:!0,autosizesClass:"lazyautosizes",srcAttr:"data-src",srcsetAttr:"data-srcset",sizesAttr:"data-sizes",minSize:50,customMedia:{},init:!0};c=a.lazySizesConfig||{};for(b in d)b in c||(c[b]=d[b]);a.lazySizesConfig=c,setTimeout(function(){c.init&&r()})}(),{cfg:c,autoSizer:q,loader:p,init:r,uP:l,aC:h,rC:i,hC:g,fire:k,gW:n}}});

function whichTransitionEvent(){
  var t,
  el = document.createElement("fakeelement");

  var transitions = {
    "transition"      : "transitionend",
    "OTransition"     : "oTransitionEnd",
    "MozTransition"   : "transitionend",
    "WebkitTransition": "webkitTransitionEnd"
  }

  for (t in transitions){
    if (el.style[t] !== undefined){
      return transitions[t];
    }
  }
}	
transitionEnd = whichTransitionEvent();

function whichAnimationEvent(){
  var t,
  el = document.createElement("fakeelement");

  var transitions = {
    "animation"      : "animationend",
    "OAnimation"     : "oAnimationEnd",
    "MozAnimation"   : "animationend",
    "WebkitAnimation": "webkitAnimationEnd"
  }

  for (t in transitions){
    if (el.style[t] !== undefined){
      return transitions[t];
    }
  }
}	
animationEnd = whichAnimationEvent();

/*
 * jQuery Easing v1.3 - http://gsgd.co.uk/sandbox/jquery/easing/
*/

jQuery.easing['jswing'] = jQuery.easing['swing'];

jQuery.extend( jQuery.easing,
{
	easeInQuart: function (x, t, b, c, d) {
			return c*(t/=d)*t*t*t + b;
	},
	easeOutQuart: function (x, t, b, c, d) {
		return -c * ((t=t/d-1)*t*t*t - 1) + b;
	},
	easeOutCirc: function (x, t, b, c, d) {
		return c * Math.sqrt(1 - (t=t/d-1)*t) + b;
	},
});

window.onload = function() {
  if(/iP(hone|ad)/.test(window.navigator.userAgent)) {
    document.body.addEventListener('touchstart', function() {}, false);
  }
};

/*
 * SCROLLSTOP EVENT
 */

!function(factory){"function"==typeof define&&define.amd?define(["jquery"],factory):"object"==typeof exports?module.exports=factory(require("jquery")):factory(jQuery)}(function($){var dispatch=$.event.dispatch||$.event.handle,special=$.event.special,uid1="D"+ +new Date,uid2="D"+(+new Date+1);special.scrollstart={setup:function(data){var timer,_data=$.extend({latency:special.scrollstop.latency},data),handler=function(evt){var _self=this,_args=arguments;timer?clearTimeout(timer):(evt.type="scrollstart",dispatch.apply(_self,_args)),timer=setTimeout(function(){timer=null},_data.latency)};$(this).bind("scroll",handler).data(uid1,handler)},teardown:function(){$(this).unbind("scroll",$(this).data(uid1))}},special.scrollstop={latency:250,setup:function(data){var timer,_data=$.extend({latency:special.scrollstop.latency},data),handler=function(evt){var _self=this,_args=arguments;timer&&clearTimeout(timer),timer=setTimeout(function(){timer=null,evt.type="scrollstop",dispatch.apply(_self,_args)},_data.latency)};$(this).bind("scroll",handler).data(uid2,handler)},teardown:function(){$(this).unbind("scroll",$(this).data(uid2))}}});

/**
 * debounce
 * @param {integer} milliseconds This param indicates the number of milliseconds
 *     to wait after the last call before calling the original function.
 * @param {object} What "this" refers to in the returned function.
 * @return {function} This returns a function that when called will wait the
 *     indicated number of milliseconds after the last call before
 *     calling the original function.
 */
Function.prototype.debounce = function (milliseconds, context) {
    var baseFunction = this,
        timer = null,
        wait = milliseconds;

    return function () {
        var self = context || this,
            args = arguments;

        function complete() {
            baseFunction.apply(self, args);
            timer = null;
        }

        if (timer) {
            clearTimeout(timer);
        }

        timer = setTimeout(complete, wait);
    };
};
$(document).ready(function(e){
	
	/* 
	==============================================
	Global
	============================================== */

	var noop = function(){};
	var $bodyHTML = $('body, html');
	var linkContainers = '.menu-wrapper , .content-wrapper';
	var $menCnt        = $('.menu-container');
	var $siteLnks      = $('.menu-wrapper a');
	var $menuBtn       = $('.menu-button a');
	var $title         = $('.site-title a');
	var $cycle         = null;
	var uriStem 	   = $('body[data-uri-stem]').length > 0 ? $('body').data('uri-stem') : '/';
	
	/*
	==============================================
	Intro Anim
	============================================== */
	
	// function getHeader(event){
// 		// if(Modernizr.cssanimations && Modernizr.inlinesvg && Modernizr.svgclippaths){
// // 			var inline  = '.header-inline';
// // 			var stacked = '.header-stacked';
// // 			var m = $(window).width() < 769;
// // 			// Load appropriate header based on screen widths
// // 			if (m && $(stacked).length < 1){
// // 				$title.load(uriStem + 'img/header-svg/HenryProudlove-stacked.svg', function(){
// // 					introAnim(stacked);
// // 				});
// // 			}else if(!m && $(inline).length < 1){
// // 				$title.load(uriStem + 'img//header-svg/HenryProudlove-inline.svg', function(){
// // 					introAnim(inline);
// // 				});
// // 			}
// // 		}else{
// // 			$title.addClass('header-png');
// // 			setTimeout(function(){
// // 				$(document).trigger('showpage');
// // 			}, 1000);
// // 		}
// 	}
		
	// $(window).on('debouncedresize', function(e){
// 		getHeader();
// 	});

	$('.header-svg, .header-svg #spinner').addClass('animating').on(animationEnd, function(){
		introAnim();
	});
	
	function introAnim(firstimg){
		//$svg = $(svg);
		if($('img').length < 1 || firstimg){
			//console.log('this fjfjfjklsd');
			hideLoader();
		}
		function hideLoader(){
			window.setTimeout(function(){
				$(document).trigger('showpage');
			}, 2000);
		}
	}
	
	$(document).on('showpage', function(e){
		$('#container').addClass('active');
		if(activePage.sectionID == null){
			$(window).trigger('cycle-activate');
		}
		//$('.header-svg').find('.fill > path').removeAttr('class');
		$('.site-title a').removeAttr('style');
	});
	
	/* 
	==============================================
	ActvePage object
	============================================== */
	
	// Stores data about the current page, set's the active link 
	var activePage = {
		page       : null,
		caller     : false,
		activeLink : null,
		sub        : false,		
		locate     : function(url, caller, callBack){
			updateLocation(url);
			$(linkContainers).find('a.active').removeClass('active');
			this.page = url;
			this.caller = caller;
			this.getSection(url);
			//return this.page;
			callBack = callBack || noop;
			callBack();
		},
		getSection : function(url){
			secs = $('.site-links a').map(function(){
				return $(this).attr('href').replace(/\//g, '\\/');
			}).get().join('|');
			patt = new RegExp('(' + secs + ')(?=\\/|$)',"g");
			var section = url.match(patt);
			if(section == null){
				this.sectionID = null;
				this.activeLink = $('a[href="' + url + '"]').addClass('active');
			}else{
				section = section[0];
				this.sectionID = section.replace(/\/|henryproudlove/g, '');
				if(url == section || url == (section + '/')){
					this.sub = false;
				}else{
					this.sub = true;
				}
				this.activeLink = $('a[href="' + section + '"]').addClass('active');
			}
		},
		isCaseStudy : function(){
			if(this.sectionID == 'work' && this.sub == true){
				return true;
			}else{
				return false;
			}
		},
		exit : function(callBack){
			window.clearTimeout(cycleTimer);
			window.clearTimeout(idleTimer);
			cycleTimer = null;
			idleTimer = null;
			$('.menu-wrapper').removeAttr('style');
			var id = this.sectionID;
			var cs = this.isCaseStudy();
			if(!cs){
				if(id == 'about' || id == 'contact'){
					acHeadAnimateKill();
 				}else if(id == null){
					cycleKill();
 				}
			}else{
				slideshowKill();
				csHeadAnimateKill();
			}
			callBack = callBack || noop;
			callBack();
		},
		enter: function(initial){
			//updateLocation(url);
			var id = this.sectionID;
			var cs = this.isCaseStudy();
			if(!cs){
				if(id == 'about' || id == 'contact'){
					acScrollTop();
				}else if(id == null){
					initial = initial || false;
					cycleInit(initial);
				}
				backBtn.down();
			}else{
				projectSlideshow();
				csHeadAnimate();
				packeryInit();
			}
			$(window).trigger('debouncedresize');
			backBtn.up();
			idleTimeout();
		}
	}
	/* 
	==============================================
	navChange
	============================================== */ 

    // Nav change fired every time link or back/forward buttons clicked
	// Refreshes activePage object and navigates to that updated target
	$(document).on('navChange',  function(e, url, caller){
		cyclePause();
		navigate.init(url, caller);
		// Close the main menu if click is from there
		if($(caller).hasClass('menu-wrapper')) $menCnt.add($menuBtn).toggleClass('active');
	});
	
	// Fire navChange event on internal link click
	$(linkContainers).on('click', 'a:not([href^="http://"])', function(e){
	    var url = $(this).attr('href');
		var loc = activePage.page;
		//console.log(e);
		if(url != loc){
			//updateLocation(url);
			$(document).trigger('navChange', [ url, e.delegateTarget ]);
		}
		e.preventDefault();
	});
	
	function updateLocation(url){
	    var base = $('<base href="' + url + '">');
	    $("head").append(base);
	    history.pushState(null, null, url);
	};
	
	// Fix for older webkit firing popstate on page load
	var popped = ('state' in window.history && window.history.state !== null), initialURL = location.href;
	// Fire navChange event on back/forward button link
	$(window).on('popstate', function(e) {
  	  var initialPop = !popped && location.href == initialURL
  	  	popped = true;
		if(!initialPop){
			$(document).trigger('navChange', [ window.location.pathname, 'back-forward' ]);
		}	
	});
	
	/* 
	==============================================
	Navigate object
	============================================== */
	// Takes current activePage, fetches it, inserts it into the DOM fires event when done
	
	var navigate = {
		init : function(page, caller){
			$.ajax({
				url: page,
				dataType: 'html',
				beforeSend: function(){
					$('#container').addClass('transition');
					navigate.loaderUp();
				},
				success: function(data){
					$('.content').addClass('outgoing');
 					var $content = $('.content' , $.parseHTML(data));
 					$content.addClass('incoming').appendTo('.content-wrapper');
 					// When outgoing finishes transition,
 					$('.outgoing').children().on(transitionEnd, function(e){
						e.stopPropagation();
					}).parent().one(transitionEnd, function(e){
						//console.log(e);
 						activePage.exit(function(){
							activePage.locate(page, caller, function(){
								if(activePage.isCaseStudy()){
									$('body').attr('class' , $content.data('name') + ' project');
								}else{
									$('body').attr('class' , $content.data('name'));
								}
								$('.outgoing').remove();
								window.scrollTo(0,0);
								$('#container').removeClass('transition');
								// $(window).trigger('cycle-activate');
								activePage.enter();
								$content.removeClass('incoming');// .one(transitionEnd, function(){
// 									if(activePage.sectionID == null){
// 										$(window).trigger('cycle-activate');
// 									}
// 								});
							});
  						});
 					});
				},
				error: function(){
					$('<div class="error"><div class="error-text">Sorry! Something went wrong :(</div></div>').appendTo('#container').on(animationEnd, function(){
						$(this).remove();
						//console.log('this');
					});
					$('#container').removeClass('transition').one(transitionEnd, function(){
						$(window).trigger('cycle-stage');
						//console.log('error');
					});
				}
			});
		},
		loader : $('.loader'),
		loaderInit : false,
		loaderUp: function(){
			if(!this.loaderInit){
				this.loader.addClass('active').removeClass('stop');
				this.loaderInit = true;
			}else{
				this.loader.addClass('active').removeClass('stop');
			}
		}
	}
	/* 
	==============================================
	back Button on sub section pages
	============================================== */
	// Button back to the work landing page on projects 	
	var backBtn = {
		el        : $('<nav class="back-button-holder"><a class="back-button" href="#"><span class="fg-color trans">Back</span></a></nav>'),
		target    : null,
		appended  : false,
		getTarget : function(){
			//return activePage.section.attr('href');
			return $('.site-links a.active').attr('href');
		},
		up : function(){
			switch (true){
				case (activePage.isCaseStudy() && !this.appended):
					this.el.find('a').addClass('active');
					this.el.appendTo('.main-header');
					this.appended = true;
					break;					
			  	case (activePage.isCaseStudy()):
					this.el.find('a').addClass('active');
					break;
				default : 
					this.el.find('a').removeClass('active');
			}
		},
		down : function(){
			//$('.back-button').removeClass('active');
		}	
	}
		
	backBtn.el.on('click' , function(e){
		url = backBtn.getTarget();
		$(document).trigger('navChange', [ url, e.target ]);
		e.preventDefault();
	});
	
	/* 
	==============================================
	Main menu
	============================================== */
	// Show/hide main menu
	
	$menuBtn.click(function(e){
		$(this).removeClass('active').siblings().addClass('active');
		// Menu opens
		if($(this).is(':first-child')){
			menuOpen();
		// Menu closes
		}else{
			closeMenu();
		}
		e.preventDefault();
	});
	
	function menuOpen(){
		$('.site-title').off(transitionEnd);
		$('#container').addClass('menu-open')
		cyclePause();
		$('.menu-wrapper').removeAttr('style');
		if(activePage.sectionID == 'about' || activePage.sectionID == 'contact'){
			acHeadAnimateKill()
		}
		$menCnt.addClass('active');
		$('body').addClass('menu');
	}
	
	function closeMenu(){
		if(activePage.sectionID == null){
			$('.site-title').on(transitionEnd, function(e){
				if(e.originalEvent.propertyName == 'padding-bottom'){
					$('#container').addClass('cycle-active');
					$('#container').removeClass('menu-open')
					$(this).off(transitionEnd).trigger('cycle-activate');
				}
			});
		}
		//$(this).add($menCnt)
		$menCnt.removeClass('active');
		$('body').removeClass('menu');
		if(activePage.sectionID == 'about' || activePage.sectionID == 'contact'){
			acScrollTop();
		}
	}
	
	$(window).on('keyup', function(e){
 		if(e.keyCode == 27 && $('body').hasClass('menu')){
			$menuBtn.filter('.active').removeClass('active').siblings().addClass('active');
			closeMenu();
		}else if(e.keyCode == 13 && !$('body').hasClass('menu')){
			$menuBtn.filter('.active').removeClass('active').siblings().addClass('active');
			menuOpen();
		}
 	});
	
	/* 
	==============================================
	Image/Video Zoom
	============================================== */
	// Object stores video cycle slides vimeo api objects
	var video = {};
	var slideshowHTML = '<section class="slideshow-wrapper">\
							<nav class="slideshow-paging">\
								<div class="back-button-holder">\
									<a href="#" class="back-button active"><span class="fg-color trans">Next Image</span></a>\
								</div>\
								<div class="next-button-holder">\
									<a href="#" class="next-button active"><span class="fg-color trans">Previous Image</span></a>\
								</div>\
							</nav>\
							<nav class="slideshow-close">\
								<a href="#" class="active">\
									<span class="close">Close\
										<span class="first bar fg-color"></span>\
										<span class="second bar fg-color"></span>\
									</span>\
								</a>\
							</nav>\
						</section>';
						
	var videoSpinner = '<svg version="1.1" class="video-spinner fg-color active trans" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"\
		 viewBox="0 0 40 40" enable-background="new 0 0 40 40" xml:space="preserve">\
		 <g id="spinner-holder" transform="translate(20,20)">\
			<g id="spinner">\
				<g id="spinner-left">\
					<path d="M0-17.3V-20c-11.1,0-20,8.9-20,20h2.7C-17.3-9.5-9.6-17.3,0-17.3z"/>\
				</g>\
				<g id="spinner-right">\
					<path d="M20,0h-2.7c0,9.6-7.8,17.3-17.3,17.3V20C11.1,20,20,11,20,0z"/>\
				</g>\
			</g>\
		</g>\
	</svg>';
	
	var slideshows = {};
					
	function projectSlideshow(){
		var slideshowID = $('article.content').data('name') + '-slideshow';
		// Waits for a video to appear in the vid object tells it to play/stop given certain conditions
		function videoController(slide, cmd){
			//console.log(slide);
			var vpfx = 'slide-video-';
			var x = (cmd == 'play' ? true : false);
			thisVideo = $(slide).attr('id').substr(vpfx.length);
			//console.log(thisVideo);
			if(video.hasOwnProperty(thisVideo)){
				video[thisVideo].api(cmd);
			}
		}

		var slidesobj = [];
		$.each($('.grid figure'), function(i){
			$(this).data('slideindex', i);
			//console.log(i);
			$(this).hasClass('video') ? slide = videoSlide($(this), i) : slide = imageSlide($(this) , i);
			slidesobj[i] = slide;
		});

		if(!slideshows.hasOwnProperty(slideshowID)){
			$(slideshowHTML).attr('id' , slideshowID).prependTo('body').append(slidesobj).cycle({
				slides : 'figure',
				startingSlide : 0,
				swipe  : true,
				log    : false,
				next   : '.slideshow-paging .next-button',
				prev   : '.slideshow-paging .back-button',
				paused : true,
				manualSpeed : 200	
			});
		}

		var $slideshowID = $('#' + slideshowID);
		slideshows[slideshowID] = $('#' + slideshowID);

		$('article.project .grid').on('click' , 'figure', function(e){
			var cycleopts = $slideshowID.data('cycle.opts');
			var clicked = $(e.currentTarget).data('slideindex');
			if(clicked != cycleopts.currSlide){				
				$slideshowID.cycle('goto', clicked).on('cycle-after', function(){
					$(this).addClass('active');
				});
			}else{
				$slideshowID.trigger('cycle-show' , [ cycleopts, null,cycleopts.slides[cycleopts.currSlide]]).addClass('active');
			}
			$('body').addClass('slideshow');
		});

		// Prepare slides and add them to slideshow container
		function videoSlide(slide, index){
			// Get the video	
			var videoPath = slide.find('img').data('video');
			var videoId = slideshowID + '-video-' + index;
			//var videoId = id.replace(/-|–|slideshow/g, '');
			//var videoId = id; 
			var $vidcont = $('<figure id="slide-video-' + videoId + '" class="video">' + videoSpinner + '</figure>');
			//var $vidcont = $('<figure id="slide-video-' + videoId + '" class="video"></figure>');
			$.ajax({
				url : 'https://vimeo.com/api/oembed.json?url=' + videoPath + '&api=true&player_id=' + videoId + '&title=false&portrait=false&byline=false',
				success : function(data){
					var	vidcont  = $('.slideshow-wrapper').find('#slide-video-' + index);
					var iframe = $(data.html)
						.wrap('<div class="lazyload center"></div>')
						.parent()
						.fitVids()
						.appendTo($vidcont)
						.addClass('active')
						.find('iframe')
						.attr('id' , videoId)[0];
					var player = $f(iframe);
				    player.addEvent('ready', function() {
						video[videoId] = player;
						$vidcont.find('.video-spinner').attr('class', 'video-spinner').on(transitionEnd, function(){
								$(this).remove();
							});
					});
				}
			});
			// Add a placeholder contianer for video
			return $vidcont;
		}
		function imageSlide(slide, index){
			imgClasses = slide.attr('class').split(/\s+/);
			slidefig = '<figure id="slide-image-' + index + '" class="image"><div class="vertical-center"></div></figure>';
			slide = slide
				.clone()
				.off('click')
				.find('img')
				.data('classes', imgClasses)
				.removeAttr('srcset')
				.attr('sizes' , '100vw')
				.removeClass().addClass('lazyload');

			return $(slidefig).find('div').append(slide).parent();
		}

		$slideshowID.on('cycle-after cycle-show' , function(e, opts, outgoing, incoming){
			//console.log($slideshow)
			var is = e.type;
			//var incoming = (is == 'cycle-after' ? incoming);
			if(is == "cycle-after" && $(outgoing).hasClass('image')){
				$(window).off('mousemove');
				$(outgoing).off('hoverspeed').find('img').css({
					'top' : '0',
					'-webkit-transition-duration' : '0',
					        'transition-duration' : '0',
					'cursor' : 'auto'
				});
			}else if(is == "cycle-after" && $(outgoing).hasClass('video')){
				videoController(outgoing, 'pause');
			}
	
			if($(incoming).hasClass('image')){
				var $img      = $(incoming).find('img');
				var height    = 0;
				var imgHeight = 0;
				var offset    = 0;
				var speed     = 0;
				var steps     = 3;
				var time      = 0.67;
				var duration = 0;
				$img.css({
					'transition-duration':'0.33s'
				});
				// Update height based on resize 
				height = $(window).height();
				imgHeight = $img.height();
				offset = imgHeight - height;
				$(window).on('mousemove', function(e){
					if(imgHeight > height){
						var pos = e.clientY;
						var center = height / 2;
						var xspeed = Math.round((pos - center)/center * steps) / steps;
						if(xspeed != speed){
							speed = xspeed;
							$(incoming).trigger('hoverspeed' , [speed]);
						}
					}else{
						$img.removeAttr('style');
					}
				}).trigger('mousemove');
				// Update img css based on speed
				$(incoming).on('hoverspeed', function(e, speed){
					switch(true){
						case (speed < 0):
							duration = time / Math.sin(speed * -1);
							$img.css({
								'transform' : 'translate3d(0,' + offset/2 + 'px,0)',
								'transition-duration': duration + 's',
							})
							$('.slideshow-wrapper').addClass('cursor-move-up').removeClass('cursor-move-down cursor-move');
							break;
						case (speed > 0):
							duration = time / Math.sin(speed);
							$img.css({
						    	'transform' : 'translate3d(0,' + offset/2 * -1 + 'px,0)',
						        'transition-duration' : duration + 's',
							})
							$('.slideshow-wrapper').addClass('cursor-move-down').removeClass('cursor-move-up cursor-move');
							break;
						default:
							$img.css({
						    	'transform' : $img.css('transform'),
						        'transition-duration' : '0',
							})
							$('.slideshow-wrapper').addClass('cursor-move').removeClass('cursor-move-up cursor-move-down');
					}
				});
			}else{
				videoController(incoming, 'play');
			}
		});

		$(document).on('click' , '.slideshow-close a' , function(e){
			closeSlideshow();
			e.preventDefault();
	
		});
		$(document).keyup(function(e){
			if (e.keyCode == 27) {
			  closeSlideshow();
			}
		});

		function closeSlideshow(){
			$slideshowID.removeClass('active');
			if($('.cycle-slide-active.video').length > 0){
				videoController($('.cycle-slide-active')[0], 'pause');
			}
			$('.slidesshow-wrapper').removeClass('cursor-move cursor-move-down cursor-move-up')
			var $img = $slideshowID.find('.cycle-slide-active img');
			var style = $img.css('transform');
			$img.attr('style', style);
			$(window).trigger('debouncedresize');
		}
	}
	
	function slideshowKill(){
		$('article.project .grid').off('click');
	}
	
	/* 
	==============================================
	Masonry
	============================================== */
	
	var $grid;
	var	fitItems = [{
		project: 'design-in-china',
		pairs : [ [1,2] , [5,6] ]
	},
	{ 
		project: 'huawei',
		pairs : [ [2,3] , [4,5] ]
	}];
	
	function packeryInit(){
		var $grid = $('.project .grid');
		var toFit;
		var y;
		//var w = $grid.width();
		//var d = getLayoutType(w);
		$.each(fitItems, function(i){
			toPair = []
			if($('body').hasClass(this.project)){
				$.each(this.pairs, function(i){
					var pair = {}
					pair.el = [
						$grid.children().eq(this[0]).removeClass('width1'),
						$grid.children().eq(this[1]).removeClass('width1')
					];
					var h = 0;
					$.each(pair.el, function(i){
						classes = this.attr('class');
						var hstr = 'height';
						var hp = classes.substring(classes.indexOf(hstr));
						h = parseInt(hp.substring(hstr.length)) + h;
					});
					pair.wrapper = '<div class="box width1 height' + h + ' pair"></div></div>';
					toPair.push(pair);
				});
				$.each(toPair, function(){
					$(this.el[0][0]).add(this.el[1][0]).wrapAll(this.wrapper);
				});
			}
		});
	}
			
	/* 
	==============================================
	Scroll animation
	============================================== */
	
	var csHeadAnim;
	var csTextAnim;
	var acHeadAnim;
		
	var scrolled = 0;

	var acHeadObj = {
		ok : false,
		go : true,
		init: function(){
			var ch = $('.content').height();
			var wh = $(window).height();
			if($('article.about, article.contact').length > 0 && ch > wh){
				this.header = $('.menu-wrapper');
				this.h = this.header.height();
				//console.log(this.h);
				this.d = ch - wh;
				this.o = this.h * -1;
				this.e = /*this.d*/ this.header.offset().top + this.h;
				this.ok = true;
			}
		},
		reset : function(){
			var init = this.init;
			var reset = this.reset;
			acHead = {
				ok: false,
				go: true,
				init: init,
				reset: reset
			}
		}
	}
	var acHead = clone(acHeadObj);
	
	function acHeadAnimPlay(){
		acHead.go = true;
		var x = scrolled/acHead.e;
		acHead.header.css({
			'transition-delay' : '0',
			'transition' : 'none',
			'transform': 'translate3d(0, ' + Math.max(acHead.o * x , acHead.o) + 'px, 0)',
			'opacity': 1 - (3 * x)
		});
	}
	function acHeadAnimStop(){
		if(acHead.go){
		 	acHead.go = false;
			acHead.header.css({
				'transform': 'translate3d(' + acHead.o + 'px)',
			});
	     	cancelAnimationFrame(acHeadAnim);
		}
	}
	
	var csHeadObj = {
		ok : false,
		go : true,
		init: function(){
			if($('article.project').length > 0 ){
				this.img = $('section.images > figure');
				this.header = $('article.project > header');
				this.client = this.header.find('h1');
				this.title  = this.header.find('h2');
				this.d = this.img.height();
				this.o = this.client.height();
				this.e = this.img.height();
				if(!Modernizr.touchevents){
					this.client.add($title).add(this.title).css('transform', 'translate3d(0, 0, 0)');
				}
				this.img.css('background-color', '#222');
				this.ok = true;
			}
		}
	}
	var csHead = clone(csHeadObj);
	
	function csHeadAnimPlay(){
		if(!csHead.go){
			$('section.images .grid').removeClass('hover-fade');
		}
		csHead.go = true;
		var x = scrolled/csHead.e;
		var offset = csHead.o * -1;
		csHead.client.css({
			'transform': 'translate3d(0,' + Math.max(offset, offset * x) + 'px,0)',
			'opacity': 1 - x
		});
		csHead.title.css({
			'transform': 'translate3d(0,' + Math.max(offset, offset * x * 1.5)  + 'px,0)',
			'opacity': 1 - (1.5 * x)
		});
		csHead.img.css({
			'transform': 'translate3d(0,' + x * 100 * -1 + 'px, 0)'
		});
		csHead.img.find('.pad').css('opacity', 1 - (x * 0.75));
	}
	
	function csHeadAnimStop(){
		if(csHead.go){
		 	csHead.go = false;
			csHead.client.css({
				'transform': 'translate3d(0,' + (csHead.o * -1) + 'px,0)',
				'opacity': 0
			});
			csHead.title.css({
				'transform': 'translate3d(0,' + (csHead.o * -1) * 1.5 + 'px,0)',
				'opacity': 0
			});
			csHead.img.css({
				'transform': 'translate3d(0, -100px, 0)'
			});
			csHead.img.find('.pad').css('opacity', 0.25 );
	     	cancelAnimationFrame(csHeadAnim);
			$('section.images .grid').addClass('hover-fade');
		}
	}
	
	var csTextObj = {
		ok : false,
		go : true,
		init: function(){
			if($('article.project').length > 0 ){
				this.wh = $(window).height();
				this.header = $('section.text header');
				this.client = this.header.find('h1');
				this.title  = this.header.find('h2');
				this.o = 60;
				this.s = this.header.offset().top - this.wh;
				var d = Math.min($(document).height() - this.wh, $('section.text').offset().top);
				this.e = d - this.s;			
				this.ok = true;
				if(!Modernizr.touchevents){
					style = {
						'transform': 'translate3d(0,' + (this.o) + 'px,0)',
						'opacity' : 0
					}
					this.client.css(style);
					this.title.css(style);
				}
			}
		}
	}
	var csText = clone(csTextObj);
	
	function csTextAnimPlay(){
		csText.go = true;
		var x = (scrolled - csText.s) / csText.e;
		var offset = (csText.o * -1) + (csText.o * x);
		csText.client.css({
			'transform': 'translate3d(0,' + Math.min(offset, 0) + 'px,0)',
			'opacity': Math.min(1, x * 1.5)
		});
		csText.title.css({
			'transform': 'translate3d(0,' + Math.min(offset * 1.33, 0) + 'px,0)',
			'opacity': Math.min(1, x)
		});
		
	}
	function csTextAnimStop(){
		if(csText.go){
		 	csText.go = false;
			csText.client.css({
				'transform': 'translate3d(0,' + (csText.o * -1 ) + 'px,0)',
				'opacity': 0
			});
			csText.title.css({
				'transform': 'translate3d(0,' + (csText.o * -1 ) + 'px,0)',
				'opacity': 0
			});
	     	cancelAnimationFrame(csTextAnim);
		}
	}
	
	$(window).on('debouncedresize', function(e){
		acHead.init();
		csHead.init();
		csText.init();
	});
	
	function acScrollTop(){
		setTimeout(acScrollToTop , 300);
		function acScrollToTop(){	
			if($('body').scrollTop() > 0){	
				$bodyHTML.stop().animate({ scrollTop: 0 }, 667 , 'easeOutCirc');
			}
		}
		$('.menu-wrapper').children().on(transitionEnd, function(e){
			e.stopPropagation();
		}).parent().on(transitionEnd, function(e){
			var prop = e.originalEvent.propertyName;
			if(prop == 'transform' || prop == '-webkit-transform' || prop == '-ms-transform'){
				acHeadAnimate();
				$(this).off(transitionEnd);
			}
		});
	}
	
	/* 
	==============================================
	Scroll Animation Bindings
	============================================== */
	
	function csHeadAnimate(){
		scrolled = $(this).scrollTop();
		if(!Modernizr.touchevents){
	    	csHeadAnim = requestAnimationFrame(csHeadAnimPlay);
	    	csTextAnim = requestAnimationFrame(csTextAnimPlay);
			$(window).on('scroll', function(e){
				scrolled = $(this).scrollTop();
				if(scrolled <= csHead.e){
			    	csHeadAnim = requestAnimationFrame(csHeadAnimPlay);
				}else if(csHead.go){
					csHeadAnim = requestAnimationFrame(csHeadAnimStop);
				}
				if(scrolled > csText.s){
			    	csTextAnim = requestAnimationFrame(csTextAnimPlay);
				}else if(csText.go && csText.ok){
					csTextAnim = requestAnimationFrame(csTextAnimStop);
				}
			});
		}else{
			csHead.init();
			var showHide = false;
			var header = csHead.client.add(csHead.title).add(csHead.img);
			var imgh = csHead.img.height();
			$(window).on('scroll', function(e){
				scrolled = $(this).scrollTop();
					if(scrolled > imgh/2 && !showHide){
						header.addClass('touchanim hide').removeClass('show');
						showHide = true;
					}else if(scrolled <= imgh/2 && showHide){
						//console.log('show');
						header.addClass('show').removeClass('hide');
						showHide = false;
					}
			});
		}
	}
	function acHeadAnimate(){
		acHead.init();
		var showHide = false;		
		$(window).on('scroll', function(e){
			scrolled = $(this).scrollTop();
			if(scrolled > 0 && scrolled <= acHead.e && acHead.ok){
				acHeadAnim = requestAnimationFrame(acHeadAnimPlay);
			}else{
				acHeadAnim = requestAnimationFrame(acHeadAnimStop);
			}
		});
		
	}
	function csHeadAnimateKill(callBack){
		$(window).off('scroll scrollstart');
		csHeadAnim = null;
		csTextAnim = null;
		csHead = clone(csHeadObj);
		csText = clone(csTextObj);
	}
	function acHeadAnimateKill(){
		$(window).off('scroll');
		//acHead.header.removeClass('show hide touchanim');
		acHeadAnim = null;
		acHead = clone(acHeadObj);
	}	

	/* 
	==============================================
	Home page cycle interaction
	============================================== */
	// Holder for cycle slides
	var cycleSlides;
	// Options for cycle instance
	var cycleOpts = {
		speed: 1000,
		manualSpeed: 1,
		slides: '> a',
		loader: true,
		pager: '.cycle-pager',
		log: false,
		startingSlide : 0,
		paused: true
	}
	// Timeout for all autoanim and idle timeouts
	var cycleTimer = null;
	// Holder for filtered slideshow instance
	var $autoCycle = null;
	
	function cycleInit(onReady){
		//console.log('cycleInit')
		$cycle = $('section.cycle')
		cycleSlides = $cycle.find('> a').each(function(i){
			$(this).data('slideindex', i)
		});
		$autoCycle = $cycle.clone().attr('id', 'cycle-auto-holder').addClass('filter').appendTo('.content').cycle(cycleOpts);
		var fade = $('<div class="fade"/>').appendTo('#cycle-scroll-holder');		
		//
		cyc.reset();
		cyc.wsize(cycleSlides.length);
		cyc.section = 0;
		//
		window.scrollTo(0, 0);
		//
		$('.cycle-pager').addClass('notrans');
		$(window).on('cycle-activate', function(e){
			$('#container').addClass('cycle-active');
			if($('html:hover').length > 0){
				cycleScrollInit(true);
				$autoCycle.addClass('hidden')
			}else{
				cycleAuto(true);
				$cycle.addClass('hidden')
			}
			onReady = false;
		});
		if(!onReady){
			$(window).trigger('cycle-activate');
		}
	}
	
	// Properties for cyclescroll anim
	var cyc = {
		w  : $(window).height(),
		h  : this.w / 4, // How far user has to scroll to trigger transition
		shift : this.w / 2, // Amount slide is transformed by before vis jump
		pager : $('.cycle-pager'),
		wsize : function(slides){ // Refreshes viewport dependent props
				//console.log(slides);
				this.w = $(window).height();
				this.h = this.w /4;
				this.shift = this.w/2;
				$('.content').height((this.h * slides) + (this.w - this.h));
				this.slideCount = slides;
		},
		frame : function(scrolled){ // Calculate props based on window.scrollTop
			this.section = Math.round(scrolled/this.h);
			this.o = (( scrolled / this.h ) - this.section ) * 2;
			curve = Math.pow(Math.abs(this.o), 6);
			this.c = curve < 0.1 ? 0 : curve;
			this.speed = Math.abs(scrolled - this.pscroll);
			if(this.o < 0){
				this.a = -1;
			}else if(this.o > 0){
				this.a = 1;
			}else{
				this.a = 0;
			}
		},
		reset : function(){ // Returns props to initial state
			this.section = 0; // Current section
			this.psection = 0;  // Previous section
			this.pscroll = 0; // Previous value of global scrolled var for comparison
			this.speed = 0; //pscroll - scroll
			this.o = 0; // Distance from resting position for each slides from -1 to 1, 0 is resting point
			this.a = 0; // Current scroll area. Determines current target for animation, curr && prev || next
			this.pa = 0; // Previous value for 'a'
			this.c = 0; // Tranform curve for animation
		} 
	}
	// Refresh viewport dependant props on resize
	$(window).on('debouncedresize', function(){
		if($('#cycle-scroll-holder section.cycle').length > 0){
			cyc.wsize(cycleSlides.length);	
		}
	})
	
	function cycleScrollInit(firstRun){
		//console.log('cycleScrollInit')
		if($cycle != null){
			cycleSwitchVisibility(cycleSlides[cyc.section], true)
			firstRun = firstRun || false
			if(!firstRun){
				$('#cycle-scroll-holder').removeClass('hidden')
				$('#container').addClass('cycle-scroll').one(animationEnd, function(e){
					//console.log(e)
					$('#cycle-auto-holder').addClass('hidden')
					cycleScroll()
					cycleScrolledTimeout(firstRun)
				});
			}else{
				$('.cycle-pager').addClass('notrans')
				$('#container').addClass('cycle-scroll')
				cycleScroll()
				cycleScrolledTimeout(true)
			}
		}
	}
	
	function cycleScrolledTimeout(firstRun){
		//console.log('cycleScrollTimeout')
		var idle = true;
		firstRun = firstRun || false
		$(window).on('mousemove scrollstart touchstart click', function(e){
			if(firstRun){
				$('.cycle-pager').removeClass('notrans');
			}
			$(this).off('mousemove scrollstart touchstart click');
			idle = false;
		});
		cycleTimer = window.setTimeout(function(){
			if(idle && !$('body').hasClass('menu')){
				if(firstRun){
					$('.cycle-pager').removeClass('notrans');
				}
				//console.log('cycleScrolledTimeout : ' + cycleTimer);
				cycleAuto();
			}else{
				cycleScrolledTimeout();
			}
		}, 4000);
	}
	
	function cycleAuto(firstRun){
		$(this).off('mousemove scrollstart touchstart click')
		$autoCycle.cycle('goto', cyc.section)
		cycleSlides.removeClass('cycle-slide-hidden cycle-slide-visible')
		firstRun = firstRun || false
		if(!firstRun){
			$('#cycle-auto-holder').removeClass('hidden')
			$(window).off('scroll scrollstop scrollstart mousemove')
			$('#cycle-scroll-holder').addClass('out').one(animationEnd, function(e){
				//console.log(e)
				$(this).removeClass('out').find('figure').removeAttr('style')
				$('#container').removeClass('cycle-scroll')
				$autoCycle.cycle('resume')
				clearCycleAuto()
			});
		}else{
			$('.cycle-pager').removeClass('notrans')
			$autoCycle.cycle('resume')
			clearCycleAuto()
		}
	}
	
	function clearCycleAuto(){
		//console.log('clearCycleAuto')
		var counter = 0;
		$(window).on('mousemove scrollstart click touchstart', function(e){
			if(!e.type == 'mousemove' || counter > 0){
				//console.log(e)
				$(this).off('mousemove scrollstart click touchstart')
				$autoCycle.cycle('pause')
				var currSection = $autoCycle.data('cycle.opts').currSlide
				cyc.section = currSection
				scrollto = cyc.section * cyc.h
				window.scrollTo(0, scrollto)
				cycleScrollInit()
			}else{
				counter ++;
			}
		
		});
	}
		
	var cycleAnim;
	function cycleScrollAnimPlay(){
		cyc.frame(scrolled);
		var n;
			if(cyc.o > 0){
				n = 1
				moveSlide(-1)
				cycleFadeUp()
				moveNextBackSlide(1, 'bottom')
				if(cyc.pa != cyc.a){
					cycleSwitchVisibility(cycleSlides[cyc.section], true)
				}
			}else{
				n = -1
				moveSlide(1)
				cycleFadeUp()
				moveNextBackSlide(-1, 'top')
				if(cyc.pa != cyc.a){
					cycleSwitchVisibility(cycleSlides[cyc.section], false)
				}
			}
			if(cyc.section != cyc.psection){
				cyc.psection = cyc.section
			}
		cyc.pscroll = scrolled
		cyc.pa = cyc.a
	}
	function moveSlide(d){
		var move = cyc.c * 50 * d;
		$(cycleSlides[cyc.section])
			.find('figure')
			.css('transform' , 'translate3d(0,' + move + '%,0)');
	}
	function moveNextBackSlide(n, p){
		if(p == 'bottom'){
			var move = (cyc.c * -25) + 75;
		}else{
			var move = (cyc.c * 25) -75;
			//var move = (cyc.c * (cyc.w / 4)) - (cyc.w * 0.75);
		}
		// if(p == 'top'){
// 			pos = (cyc.w * -1) + cyc.shift + (cyc.c * (cyc.shift / 2));
// 		}else{
// 			pos = cyc.w - cyc.shift + (cyc.c - cyc.c * (cyc.shift / 2));
// 		}
		$(cycleSlides[cyc.section + n])
			.find('figure')
			//.css('transform' , 'translate3d(0,' + move + 'px,0)');
			//.css('transform' , 'translateY(' + move + '%)');
			.css('transform' , 'translate3d(0 ,' + move + '%, 0)');
	}
	function cycleFadeUp(){
		$('.fade').css('opacity', 1 - cyc.c);
	}
	
	// Switch visibility classes during scroll animation
	function cycleSwitchVisibility(slide, fwd, loop){
		var a = cyc.a;
		$(slide).removeClass('cycle-slide-visible cycle-slide-hidden').addClass('cycle-slide-active');
		switch(true){
			case loop && a > 0:
				poop = $(cycleSlides[0]).removeClass('cycle-slide-hidden cycle-slide-active').addClass('cycle-slide-visible').add(slide);
				break;
			case a < 0 && $(slide).data('slideindex') == 0:
				poop = $(cycleSlides[cycleSlides.length -1]).addClass('cycle-slide-visible').add(slide);
				break;
			case fwd && a >= 0:
				poop = $(slide).next('a').removeClass('cycle-slide-hidden cycle-slide-active').addClass('cycle-slide-visible').add(slide);
				break;
			case fwd && a < 0:
				poop = $(slide).prev('a').removeClass('cycle-slide-hidden cycle-slide-active').addClass('cycle-slide-visible').add(slide);
				break;
			case !fwd && a < 0:
				poop = $(slide).prev('a').removeClass('cycle-slide-hidden cycle-slide-active').addClass('cycle-slide-visible').add(slide);
				break;
			case !fwd && a >= 0:
				poop = $(slide).next('a').removeClass('cycle-slide-hidden cycle-slide-active').addClass('cycle-slide-visible').add(slide);
				break;
		}
		$(cycleSlides).not(poop).removeClass('cycle-slide-visible cycle-slide-active').addClass('cycle-slide-hidden');
	}
	
	function cycleKill(){
		if($cycle != null && $autoCycle != null){
			// Clear any possible running timeouts
			cycleClear()
			// Empty all vars
			$('#container').removeClass('cycle-active')
			$autoCycle.cycle('destroy')
			$('#container').removeClass('cycle-active cycle-scroll cycle-auto-transition')
			$autoCycle = null
			$cycle = null
			cycleSlides = null
			cycleAnim = null
			// reset the cyc anim object to its default values
			cyc.reset()
		}
	}
	
	function cycleClear(){
		window.clearTimeout(cycleTimer)
		$(window).off('scroll scrollstop scrollstart mousemove click touchstart')
		$autoCycle.cycle('pause')
		cycleTimer = null
	}
	
	function cyclePause(){
		if($autoCycle != null && $cycle != null){
			cycleClear()
		}
	}
		
	function cycleScroll(){
		//console.log('cycleScroll')
		var $pager = $('.cycle-pager')
		$(window).on('scrollstart', function(e){
			$pager.addClass('notrans')
		}).on('scroll', function(e){
			scrolled = $(this).scrollTop()
			if($cycle != null){
				cycleAnim = requestAnimationFrame(cycleScrollAnimPlay)
			}
		}).trigger('scroll').on('scrollstop', {latency: 333}, function(e){
			cycleSnap()
		});
		
		function cycleSnap(){
			$(window).off('scrollstop')
			$bodyHTML.stop().animate({
				scrollTop: (cyc.h * cyc.section)
			}, 333, function(){
				$pager.removeClass('notrans')
				$pagerActive = $($pager.find('figcaption:nth-child(' + (cyc.section + 1) + ')'))
				//console.log($pagerActive)
				if(!$pagerActive.hasClass('cycle-pager-active')){
					$pagerActive.addClass('cycle-pager-active').siblings().removeClass('cycle-pager-active')
				}
				$(window).on('scrollstop', {latency: 333}, function(e){
					cycleSnap()
				})
			})
		}
	}
	
	/* 
	==============================================
	Lazy loading
	============================================== */
	
	window.lazySizesConfig = {
		addClasses: true
	};
	var firstimg = false;
	$(document).on('lazybeforeunveil', function(e){
		if(!firstimg){
			//$(this).trigger('firstimg');
			firstimg = true;
			introAnim(firstimg)
		}
		$(e.target).parents('figure').removeClass('loading');
		//console.log('loader removed')
	});
	
	// /*
// 	==============================================
// 	Title Underline
// 	============================================== */
//
// 	var titleState = false;
// 	function titleStrokeIn(){
// 		if(titleState || !$(container).hasClass('.active')){
// 			return;
// 		}else{
// 			var animation = $(':visible #line-mask-in');
// 			animation.beginElement();
// 			titleState = true;
// 		}
// 	}
// 	function titleStrokeOut(){
// 		if(!titleState){
// 			return;
// 		}else{
// 			var animation = $(':visible #line-mask-out');
// 			animation.beginElement();
// 			titleState = false;
// 		}
// 	}
	
	/* 
	==============================================
	Filters on Page idle
	============================================== */

	// Append filter stylet to head
	var string = "<style type='text/css'>\n\t";
	var trans = Modernizr.prefixed('transform');
	if(trans == 'WebkitTransform'){
		string += "\
			.filter{\n\t\t\
				filter: grayscale(1);\n\t\t\
				-webkit-filter: grayscale(1);\n\t\t\
				background-color: rgba(178,182,184,0.33);\n\t\t\
				opacity: 0.66;\n\t\t\
				-webkit-transform: translate3d(0,0,0);\n\t\
			}\n\t\
			.filter:after{\n\t\t\
				display:block !important;\n\t\t\
				z-index: 2;\n\t\t\
				opacity: 1;\n\t\
			}\n";
	}else{
		string += "\
			.filter{\t\t\
				filter: url('#grad');\n\t\t\
				-webkit-filter: url('#grad');\n\t\
			}";
	}
	string += "\n</style>";
	$('head').append(string);
	
	var idleTimer;
	
	// After a period of inactivty turn the page red
	function idleTimeout(){
		if(Modernizr.cssfilters && !$('body.home').length > 0 && !$('body.slideshow').length > 0) {
			var idle = true;
			$(window).on('mousemove scrollstart click', function(e){
				//console.log(e)
				$(window).off('mousemove scrollstart click');
				idle = false;
			});
			idleTimer = window.setTimeout(function(){
				if(idle && $('body.slideshow').length < 1){
					applyFilter();
				}else{
					idleTimeout();
				}
			}, 6000);
		}
	}
	
	function applyFilter(){
		window.clearTimeout(idleTimer);
		//
		var $container = $('#container');
		var $filtered = $container.clone().addClass('filtered');
		$filtered.find('.content-wrapper')/*.add($filtered.find('.main-header nav'))*/.addClass('filter');
		//
		if($container.length < 2){
			$filtered.insertAfter($container);
			$container.addClass('unfiltered fade');
			// Clear the filter if the user interacts
			$(window).one('mousemove scroll click', function(e){
				$(window).off('mousemove scrollstart click');
				$container.removeClass('fade').one(transitionEnd, function(){
					$(this).removeClass('unfiltered');
					$('.filtered').remove();
					idleTimeout();
				});
			});
		}
	}	
	
	/* 
	==============================================
	Viewport Units
	============================================== */
	window.viewportUnitsBuggyfill.init();
	
	/* 
	==============================================
	Do scripts
	============================================== */
	
	activePage.locate(window.location.pathname, null);
	activePage.enter(true);
});
