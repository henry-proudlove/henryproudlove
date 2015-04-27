<div class="loader stop"></div>
</div><!--.container-->
			<svg width="0" height="0">    
			    <filter id="grad">
			        <feColorMatrix type="matrix" values="0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0 0 0 1 0"></feColorMatrix> 
a
			      <feComponentTransfer>
			        <feFuncR id="funcR" type="table" tableValues="0.0784313725490196 0.7803921568627451"></feFuncR>
			        <feFuncG id="funcG" type="table" tableValues="0.07450980392156863 0.11764705882352941"></feFuncG>
			        <feFuncB id="funcB" type="table" tableValues="0.10588235294117647 0.08235294117647059"></feFuncB>        
			      </feComponentTransfer>
			  </filter>
			</svg>
<!--[if lt IE 9]>
            <p class="chromeframe">You are using an <strong>outdated</strong> browser. Please <a href="http://browsehappy.com/">upgrade your browser</a> or <a href="http://www.google.com/chromeframe/?redirect=true">activate Google Chrome Frame</a> to improve your experience.</p>
        <![endif]-->

        <!--<script src="//ajax.googleapis.com/ajax/libs/jquery/1.9.0/jquery.min.js"></script>-->
        <script>window.jQuery || document.write('<script src="<?php echo $page->rel_depth() . 'js/vendor/jquery-1.9.0.min.js'; ?>"><\/script>')</script>
        <script src="<?php echo $page->rel_depth() . 'js/vendor/froogaloop.min.js';?>"></script>
		<script src="<?php echo $page->rel_depth() . 'js/vendor/viewport-units-buggyfill.js';?>"></script>
        <script src="<?php echo $page->rel_depth() . 'js/vendor/jquery.cycle2.js';?>"></script>
        <script src="<?php echo $page->rel_depth() . 'js/vendor/jquery.cycle2.swipe.min.js';?>"></script>
        <script src="<?php echo $page->rel_depth() . 'js/plugins.js';?>"></script>
        <script src="<?php echo $page->rel_depth() . 'js/main.js';?>"></script>

        <!-- Google Analytics: change UA-XXXXX-X to be your site's ID. -->
        <!--<script>
            var _gaq=[['_setAccount','UA-XXXXX-X'],['_trackPageview']];
            (function(d,t){var g=d.createElement(t),s=d.getElementsByTagName(t)[0];
            g.src=('https:'==location.protocol?'//ssl':'//www')+'.google-analytics.com/ga.js';
            s.parentNode.insertBefore(g,s)}(document,'script'));
        </script>-->
		
    </body>
</html>
<?php //include(DIR_INCLUDE . 'cache/bottom-cache.php'); ?>
