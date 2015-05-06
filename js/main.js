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
	
	function getHeader(event){
		if(Modernizr.cssanimations && Modernizr.inlinesvg && Modernizr.svgclippaths){
			var inline  = '.header-inline';
			var stacked = '.header-stacked';
			var m = $(window).width() < 768;
			// Load appropriate header based on screen widths
			if (m && $(stacked).length < 1){
				$title.load(uriStem + 'img/header-svg/HenryProudlove-stacked.svg', function(){
					introAnim(stacked);
				});	
			}else if(!m && $(inline).length < 1){
				$title.load(uriStem + 'img//header-svg/HenryProudlove-inline.svg', function(){
					introAnim(inline);
				});
			}
		}else{
			$title.addClass('header-png');
			setTimeout(function(){
				$(document).trigger('showpage');
			}, 1000);
		}
	}
		
	$(window).on('debouncedresize', function(e){
		getHeader();
	});
	
	function introAnim(svg){
		$svg = $(svg);
		var delayStart = 1;
		var paths = $svg.find('.fill > path');
		$svg.parent().css('opacity' , '1');
		$svg.find('.mask').css({
			'transform' : 'scaleX(0)',
			'-webkit-transform' : 'scaleX(0)'
		}).addBack().find('.stroke').css({
			'stroke-opacity' : '0.1',
			'stroke-width' : '2px',
			'opacity' : '0',
			'transition-delay' : '0'
		});
		var n = paths.length -1;
		var totalDuration = 0;
		$('head').append('<style type="text/css" id="intro-anim-styles"></style>');
		$.each(paths, function(i){
			$(this).attr('class' , 'animation');
				//var $path = $(this);
				var offset = Math.abs(1/2 - i/n);
				var duration = 0.5 + (i/20);
				var delay = i/50;
				if(i==n){
					totalDuration = duration + delay;
				}
				l = $(this)[0].getTotalLength();
				id = $(this).attr('id');
				var animName = id + '-anim';
				var animSeq = {
					'0%': {
						'stroke-opacity' : '0',
						'stroke-width' : '2px',
						'stroke-dasharray' : l,
					    'stroke-dashoffset': l,
						'fill-opacity' : '0',
						//'opacity': '0',
						'transition' : 'none',
						'-webkit-transition' : 'none'
					},
					'66.67%' : {
						'stroke-opacity' : '0.66',
						'stroke-width' : '2px',
						//'opacity' : '1',
						'stroke-dasharray' : l,
					    'stroke-dashoffset': 0,
						'fill-opacity' : '0'
					},
					'100%' : {
						'stroke-opacity' : '1',
						'stroke-width' : '2px',
						'stroke-dasharray' : l,
					    'stroke-dashoffset': 0,
						'fill-opacity' : '1'
					}
				}
				controller = {
					'name' : animName,
				    'duration': duration + 's',
				    'delay': delay + 's',
				    'timing-function': 'ease-in',
					'play-state' : 'paused',
				    'fill-mode': 'backwards'
				}
				prefix = ['-webkit-', ''];
				$('#intro-anim-styles').append(function(){
					style = ".header-svg path#" + id + ".animation{\n";
					$.each(prefix, function(i){
						$.each(controller, function(k , v){
								style += "\t" + prefix[i] + "animation-" + k + " : " + v + ";\n";
						});
					});
					style += "}\n";
					$.each(prefix, function(i){
						style += "@" + prefix[i] + "keyframes " + animName + " {\n";
							$.each(animSeq, function(k , v){
								style +=  "\t" + k + "{\n";
	 							$.each(v , function(k, v){
	 								style += "\t\t" + k + " : " + v + ";\n"
	 							});
								style += "\t}\n";
							});
						  	style += "}\n";
					});
					return style;
				});
		});
		setTimeout(function(){
			var done = 0;
			var n = paths.length;
			$.each(paths, function(i){
				$(this).attr('class' , 'animation animating').on(animationEnd, function(e){
					done ++;
					
					if(done == n){
						$(document).trigger('showpage');
						$svg
							.find('.mask')
							.removeAttr('style')
							.attr('class', 'mask animated')
							.addBack().find('.stroke')
							.removeAttr('style')
							.attr('class' ,  'stroke animated');
					}	
				});						
			});
		}, delayStart * 1000);
	}
	$(document).on('showpage', function(e){
		$('#container').addClass('active');
		$(window).trigger('cycle-activate');
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
			//console.log(this);
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
			cycleTimer = null;
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
		enter: function(){
			//updateLocation(url);
			var id = this.sectionID;
			var cs = this.isCaseStudy();
			if(!cs){
				if(id == 'about' || id == 'contact'){
					acScrollTop();
				}else if(id == null){
					cycleInit();
				}
				backBtn.down();
			}else{
				projectSlideshow();
				csHeadAnimate();
				packeryInit();
			}
			$(window).trigger('debouncedresize');
			backBtn.up();
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
								$content.removeClass('incoming').one(transitionEnd, function(){
									$(window).trigger('cycle-stage');
								});
								activePage.enter();
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
		cyclePause();
		$('.menu-wrapper').removeAttr('style');
		if(activePage.sectionID == 'about' || activePage.sectionID == 'contact'){
			acHeadAnimateKill();
		}
		$menCnt.addClass('active');
		$('body').addClass('menu');
	}
	
	function closeMenu(){
		if(activePage.sectionID == null){
			$('.site-title').on(transitionEnd, function(e){
				if(e.originalEvent.propertyName == 'padding-bottom'){
					$('#container').addClass('cycle-active');
					$(this).off(transitionEnd).trigger('cycle-stage');
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
						
	var videoSpinner = '<svg version="1.1" class="video-spinner active fg-color trans" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="1054.6 58.3 107.8 107.8" enable-background="new 1054.6 58.3 107.8 107.8" xml:space="preserve">\
							<g class="fill">\
								<path id="o-spinner" class="animated" d="M1108.5,65.4c25.8,0,46.7,20.9,46.7,46.7s-20.9,46.7-46.7,46.7s-46.7-20.9-46.7-46.7\
								S1082.7,65.4,1108.5,65.4 M1108.5,58.3c-29.8,0-53.9,24.1-53.9,53.9s24.1,53.9,53.9,53.9c29.8,0,53.9-24.1,53.9-53.9\
								S1138.3,58.3,1108.5,58.3L1108.5,58.3z"/>\
							</g>\
							<g id="spinner">\
								<g id="spinner-left">\
									<path d="M1108.5,65.4v-7.2c-29.8,0-53.9,24.1-53.9,53.9h7.2C1061.8,86.4,1082.7,65.4,1108.5,65.4z"/>\
									<rect x="1054.6" y="58.3" fill="none" stroke="none" width="107.8" height="107.8"/>\
								</g>\
								<g id="spinner-right">\
									<path d="M1162.4,112.2h-7.2c0,25.8-20.9,46.7-46.7,46.7v7.2C1138.3,166.1,1162.4,141.9,1162.4,112.2z"/>\
									<rect x="1054.6" y="58.3" fill="none" stroke="none" width="107.8" height="107.8"/>\
								</g>\
							</g>\
						</svg>';
	
	var slideshows = {};
					
	function projectSlideshow(){
		if($(window).width() > 550){
			var slideshowID = $('article.content').data('name') + '-slideshow';
			// Waits for a video to appear in the vid object tells it to play/stop given certain conditions
			function videoController(slide, cmd){
				console.log(slide);
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
						//$(var	vidcont  = $('.slideshow-wrapper').find('#slide-video-' + index);
						function appendVideo(){
							if($vidcont.length > 0){
								clearInterval(vidinterval);
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
						}
						var vidinterval = setInterval(appendVideo, 500);
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
				//'opacity': 0
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
				//hello = this.title.add(this.client).add(this.img).addClass('changing-transform-opacity');
				//console.log(hello);
				this.d = this.img.height();
				this.o = this.client.height();
				this.e = this.img.height();
				this.client.add($title).add(this.title).css('transform', 'translate3d(0, 0, 0)');
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
			});//.removeClass('changing-transform-opacity');
			csHead.title.css({
				'transform': 'translate3d(0,' + (csHead.o * -1) * 1.5 + 'px,0)',
				'opacity': 0
			});//.removeClass('changing-transform-opacity');
			csHead.img.css({
				'transform': 'translate3d(0, -100px, 0)'
			});//.removeClass('changing-transform-opacity');
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
				this.header = $('section.text header');
				this.client = this.header.find('h1');
				this.title  = this.header.find('h2');
				this.o = 60;
				this.s = this.header.offset().top - $(window).height();
				this.e = $(document).height() - $(window).height() - this.s;
				//this.client.add(this.title).css('transform', 'translate3d(0, 0, 0)');
				this.ok = true;
				style = {
					'transform': 'translate3d(0,' + (this.o) + 'px,0)',
					'opacity' : 0
				}
				this.client.css(style);
				this.title.css(style);
			}
		}
	}
	var csText = clone(csTextObj);
	
	function csTextAnimPlay(){
		// if(!csText.go){
// 			$('section.images .grid').removeClass('hover-fade');
// 		}
		csText.go = true;
		var x = (scrolled - csText.s) / csText.e;
		var offset = (csText.o * -1) + (csText.o * x);
		csText.client.css({
			'transform': 'translate3d(0,' + Math.min(offset, 0) + 'px,0)',
			'opacity': Math.min(1, x * 1.5)
		});
		csText.title.css({
			'transform': 'translate3d(0,' + Math.min(offset * 1.5, 0) + 'px,0)',
			'opacity': Math.min(1, x)
		});
		
	}
	function csTextAnimStop(){
		//$('section.images .grid').addClass('hover-fade');
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
		//console.log(csHead);
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
			//console.log(e);
			var prop = e.originalEvent.propertyName;
			if(prop == 'transform' || prop == '-webkit-transform' || prop == '-ms-transform'){
				//console.log('gogogogogogog');
				//scrollAnimate();
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
	}
	function acHeadAnimate(){
		acHead.init();	
		$(window).on('scroll', function(e){
			scrolled = $(this).scrollTop();
			if(scrolled <= acHead.e && acHead.ok){
		    	acHeadAnim = requestAnimationFrame(acHeadAnimPlay);
			}else/* if(acHead.go && acHead.ok)*/{
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
		log: false,
		fx :  'homeTrans',
		startingSlide : 0,
		paused: true
	}
	// Timeout for all autoanim and idle timeouts
	var cycleTimer = null;
	
	$.fn.cycle.transitions.homeTrans = {
	    before: function( opts, curr, next, fwd ) {
			//cycleCss = $(next).data('project-name');
			cycleSwitchVisibility(next, fwd);	
	    }
	}
	
	// Properties for cyclescroll anim
	var cyc = {
		w  : $(window).height(),
		h  : this.w / 4, // How far user has to scroll to trigger transition
		shift : this.w / 2, // Amount slide is transformed by before vis jump
		wsize : function(slides){ // Refreshes viewport dependent props
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
		if($('section.cycle').length > 0){
			cyc.wsize(cycleSlides);	
		}
	});
	
	$(document).on('cycle-post-initialize', function(e, opts){
		if($(e.target).is('section.cycle')){
			cycleSlides = $(opts.slides).each(function(i){
				$(this).data('slideindex', i);
			});
			var fade = $('<div class="fade"/>');
			$('section.cycle').css('position', 'fixed').append(fade);
			//
			cyc.reset();
			cyc.wsize(opts.slideCount);
			cyc.section = 0;
			//
			window.scrollTo(0, 0);
			var visible = $(cycleSlides[cyc.section + 1]).addClass('cycle-slide-visible').add(cycleSlides[cyc.section]);
			$(cycleSlides).not(visible).addClass('cycle-slide-hidden');
			//
			var firstRun = true;
			$(window).on('cycle-activate', function(e){
				if($('html:hover').length > 0){
					$('#container').addClass('cycle-scroll');
					cycleScrollInit(opts);
					if(firstRun){
						$('.cycle-pager').css('transition', 'none');
						$(window).one('scrollstart mousemove', function(){
							$('.cycle-pager').removeAttr('style');
						});
					}
				}else{
					autoAnimate(cyc.section, 3000);
				}
				firstRun = false;
			});
		}
	});
	
	$(window).on('cycle-stage', function(){
		if($cycle != null){
			$(this).trigger('cycle-activate');
		}else{
			$(document).on('cycle-post-initialize', function(e){
				if($(e.target).is('section.cycle')){
					$(window).trigger('cycle-activate');
				}
			});
		}
	})
	
	function cycleScrollInit(opts){
		// Clear the autoAnimate interval
		window.clearTimeout(cycleTimer);
		// Set section holder to currSlide
		cyc.section = opts.currSlide;
		// Scroll to the section scrollbar
		scrollto = opts.currSlide * cyc.h;
		window.scrollTo(0, scrollto);
		
		// Advance slides on scrolll
		cycleScroll();
		
		//Switch to auto transition after timeout
		cycleScrolledTimeout(opts);
	}
	
	function cycleScrolledTimeout(opts){
		//console.log(opts);
		var idle = true;
		$(window).one('mousemove scrollstart', function(e){
			idle = false;
		});
		cycleTimer = window.setTimeout(function(){
			if(idle && !$('body').hasClass('menu')){
				$('#container').addClass('timeout');
				cycleClearScrollAuto(opts);
			}else{
				cycleScrolledTimeout(opts);
			}
		}, 3000);
	}
	
	function cycleClearScrollAuto(opts, delay){
		window.clearTimeout(cycleTimer);
		$(window).off('scroll scrollstop scrollstart mousemove');
		$('#container').removeClass('cycle-scroll');
		cyc.section = opts.currSlide;
		cycleSwitchVisibility(cycleSlides[cyc.section], true);
		var delay = delay || 1000;
		autoAnimate(cyc.section, delay);
	}
	
	function autoAnimate(start, initalDelay){
		var i = start;
		var opts = $('section.cycle').data('cycle.opts');
		//var int = 550;
		var curr, next, nextSec;
		//
		var t = 0;
		// Initial anim loop three sceconds, advance slide…
		autoSwitch(function(){
			cycleTimeout(function(){
				scrollto = opts.currSlide * cyc.h;
				//window.scrollTo(0, scrollto);
				advanceSlide(autoMainLoop);
				//console.log('mainLoop called');
			}, initalDelay);
		});
		// Main anim loop wait 5 seconds, adance slide
		function autoMainLoop(){
			cycleTimeout(function(){
				autoSwitch(function(){
					advanceSlide(autoMainLoop);
				});
			}, 5000)
		}
		function cycleTimeout(callBack, time){
			window.clearTimeout(cycleTimer);
			cycleTimer = window.setTimeout(function(){
				callBack = callBack || noop;
				callBack();
			}, time);
		}
		//cycleInterval = setTimeout(advanceSlide, 2000);
		function autoSwitch(callBack){
			//clearTimeout(cycleInterval);
			var loop;
			curr = cycleSlides[i];
			if(i < cycleSlides.length - 1){
				nextSec = i + 1;
				next = cycleSlides[nextSec];
				cyc.a = 1;
				loop = false;
				cycleSwitchVisibility(curr, true);
			}else{
				nextSec = 0;
				next = cycleSlides[nextSec];
				cyc.a = 1;
				loop = true;
				cycleSwitchVisibility(curr, true, loop);
			}
			callBack = callBack || noop;
			callBack();
		}
		//cycleInterval = setInterval(advanceSlide, 6000);
		function advanceSlide(callBack){
			$('#container').addClass('cycle-auto-transition');
			//clearTimeout(cycleInterval);
			$(next).find('figure').css('transform', 'translate3d(0,75%,0)').transition({
				transform : 'translate3d(0,50%,0))' 
			}, 667, 'easeInQuart');
			//
			$('.fade').css('opacity', 1).transition({
				opacity : 0 
			}, 667, 'easeInQuart');
			//
			$(curr).find('figure').css('transform' , 'translate3d(0,0,0)').transition({
				transform : 'translate3d(0,-50%,0)'
			}, 667, 'easeInQuart', function(){
				//
				cyc.a = -1;
				$cycle.cycle('goto', nextSec);
				//
				$(next).find('figure').css('transform' , 'translate3d(0,50%,0)').transition({
					transform : 'translate3d(0,0,0))' 
				}, 667, 'easeOutQuart');
				//
				$('.fade').css('opacity' , 0).transition({
					opacity : 1 
				}, 667, 'easeOutQuart');
				//
				$(curr).find('figure').css('transform' , 'translate3d(0,-50%,0)').transition({
					transform : 'translate3d(0,-75%,0)' 
				}, 667, 'easeOutQuart', function(){
					$('#container').removeClass('cycle-auto-transition').trigger('cycle-auto-transition-end');
					
				});
			});
			if(i < cycleSlides.length - 1){ i++; } else { i=0; }
			callBack = callBack || noop;
			callBack();
		}
		
		$(window).one('mousemove scrollstart', function(e){
			//console.log(e);
			//$(this).off('mousemove scrollstart');
			//clearInterval(cycleInterval);
			var opts = $('section.cycle').data('cycle.opts');
			//cycleSwitchToScroll(opts);
			$('#container').removeClass('timeout').addClass('cycle-scroll');
			if(!$('#container').hasClass('cycle-auto-transition')){
				cycleScrollInit(opts);
			}else{
				//console.log('section.cycle hasClass cycle-auto-transition-end');
				$('#container').one('cycle-auto-transition-end' , function(){
					cycleScrollInit(opts);
				});
			}
		});
	}
	
	// Stop slides clicking through is mid transition
	$('section.cycle.cycle-auto-transition a').click(function(e){
		e.preventDefault();
	});
	
	function cycleInit(){
		$('#container').addClass('cycle-active');
		$cycle = $('section.cycle').cycle(cycleOpts);
	}
		
	var cycleAnim; // Holder for requestframanim	
	// Animation functions
	function cycleScrollAnimPlay(){
		cyc.frame(scrolled);
		//console.log('offset : ' + cyc.o, 'curve : ' + cyc.c, 'area :' + cyc.a, 'speed: ' + cyc.speed)
		var n;
		if(cyc.speed < 120){
			if(cyc.o > 0){
				n = 1;
				moveSlide(-1);
				cycleFadeUp();
				moveNextBackSlide(1, 'bottom');
				//console.log('next slide visible');
				if(cyc.pa != cyc.a){
					cycleSwitchVisibility(cycleSlides[cyc.section], true);
				}
			}else{
				n = -1;
				moveSlide(1);
				cycleFadeUp();
				moveNextBackSlide(-1, 'top');
				if(cyc.pa != cyc.a){
					cycleSwitchVisibility(cycleSlides[cyc.section], false);
				}
				//console.log('previous slide visible');
			}
			if(cyc.section != cyc.psection){
				$cycle.cycle('goto', cyc.section);
				cyc.psection = cyc.section;
			}
		}else{
			cycleAnim = cancelAnimationFrame(cycleScrollAnimPlay);
			$(window).off('scroll scrollstop');
			$cycle.addClass('too-fast').on(transitionEnd, function(){
				cyc.section = Math.round(scrolled/cyc.h);
				if(cyc.section != cyc.psection){
					$cycle.cycle('goto', cyc.section);
					cyc.psection = cyc.section;
				}else{
					cycleTooFastRefresh();
				}
			});
		}
		cyc.pscroll = scrolled;
		cyc.pa = cyc.a;
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

	// Speed too great! Don't perform transition
	function cycleTooFast(){
		$cycle.on('cycle-after', function(e, opts){
			cycleTooFastRefresh();
		});
	}
	function cycleTooFastRefresh(){
		if($cycle.is('.too-fast')){
			$cycle.removeClass('too-fast');
			$(window).scrollTop(cyc.h * cyc.section);
			cycleScroll();
		}
	}
	
	// Switch visibility classes during scroll animation
	function cycleSwitchVisibility(slide, fwd, loop){
		var a = cyc.a;
		$(slide).removeClass('cycle-slide-visible cycle-slide-hidden');//.data('slideindex');	
		switch(true){
			case loop && a > 0:
				poop = $(cycleSlides[0]).removeClass('cycle-slide-hidden').addClass('cycle-slide-visible').add(slide);
				break;
			case a < 0 && $(slide).data('slideindex') == 0:
				poop = $(cycleSlides[cycleSlides.length -1]).addClass('cycle-slide-visible').add(slide);
				break;
			case fwd && a >= 0:
				poop = $(slide).next('a').removeClass('cycle-slide-hidden').addClass('cycle-slide-visible').add(slide);
				break;
			case fwd && a < 0:
				poop = $(slide).prev('a').removeClass('cycle-slide-hidden').addClass('cycle-slide-visible').add(slide);
				break;
			case !fwd && a < 0:
				poop = $(slide).prev('a').removeClass('cycle-slide-hidden').addClass('cycle-slide-visible').add(slide);
				break;
			case !fwd && a >= 0:
				poop = $(slide).next('a').removeClass('cycle-slide-hidden').addClass('cycle-slide-visible').add(slide);
				break;
		}
		$(cycleSlides).not(poop).removeClass('cycle-slide-visible').addClass('cycle-slide-hidden');
	}
	
	function cycleKill(){
		if($cycle != null){
			// Clear any possible running timeouts
			cycleClear();
			// Empty all vars
			$cycle.cycle('destroy');
			$cycle = null;
			cycleSlides = null;
			cycleAnim = null;
			// reset the cyc anim object to its default values
			cyc.reset();
		}
	}
	
	function cycleClear(){
		$(window).off('scroll scrollstop scrollstart mousemove');
		window.clearTimeout(cycleTimer);
		cycleTimer = null;
		$('#container').removeClass('cycle-active cycle-scroll cycle-auto-transition timeout');
	}
	
	function cyclePause(){
		if($cycle != null){
			if(!$('#container').hasClass('cycle-auto-transition')){
				cycleClear();
			}else{
				$('#container').one('cycle-auto-transition-end' , function(){
					cycleClear();
				});
			}
		}
	}
	
	//var pstep = 0;
	//$('section.cycle a').addClass('cursor-move-up');
	
	function cycleScroll(){
		//$('.fade').addClass('changing-opacity');
		$(window).on('scroll', function(e){
			scrolled = $(this).scrollTop();
			if($cycle != null){
				cycleAnim = requestAnimationFrame(cycleScrollAnimPlay);
			}
		}).trigger('scroll').on('scrollstop', {latency: 333}, function(e){
			if($cycle != null){
				$bodyHTML.stop().animate({
					scrollTop: (cyc.h * cyc.section)
				}, 333, function(){
					//$('.fade').removeClass('changing-opacity');
				});
			}
		});
	}
	
	/* 
	==============================================
	Lazy loading
	============================================== */
	
	window.lazySizesConfig = {
		addClasses: true
	};
	
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
	activePage.enter();
	
});
