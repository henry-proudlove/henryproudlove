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
