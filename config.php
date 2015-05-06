<?php
	// Global consants
	define('SERVER_FLAG',	FALSE);
	define('DIR_ROOT',      dirname( dirname( __FILE__ ) ));
	define('SUB_DOM',       '/henryproudlove/');
	define('DIR_BASE',      DIR_ROOT    . SUB_DOM);
	define('DIR_PROJECT',   DIR_BASE    . 'work/');
	define('DIR_MEDIA',     DIR_BASE    . 'media/');
	define('DIR_INCLUDE',   DIR_BASE    . 'include/');
	define('DIR_CLASSES',   DIR_INCLUDE . 'classes/');
	define('DIR_GLOBAL',    DIR_INCLUDE . 'global/');
	define('DIR_MARKUP',    DIR_INCLUDE . 'markup/');
	define('VIEW_HEADER',   DIR_GLOBAL  . 'header.php');
	define('VIEW_FUNCTIONS',DIR_GLOBAL  . 'functions.php');
	define('VIEW_FOOTER',   DIR_GLOBAL  . 'footer.php');
	// Cache
	include(DIR_INCLUDE . 'cache/top-cache.php');
?>