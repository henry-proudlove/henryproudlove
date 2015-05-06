<?php
	include(VIEW_FUNCTIONS);
	$page = new Page;
	$cs = get_the_project();
?>
<!DOCTYPE html>
<html itemscope itemtype="http://schema.org/Person" lang="en-GB">
<!--[if lt IE 7]>      <html class="no-js lt-ie9 lt-ie8 lt-ie7"> <![endif]-->
<!--[if IE 7]>         <html class="no-js lt-ie9 lt-ie8"> <![endif]-->
<!--[if IE 8]>         <html class="no-js lt-ie9"> <![endif]-->
<!--[if gt IE 8]><!--> <html class="no-js" > <!--<![endif]-->
    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
        <title><?php echo get_title(); ?></title>
        <meta name="description" content="<?php echo get_description();?>">
		<!-- Schema -->
		<meta itemprop="name" content="Henry Proudlove // Independent Creative">
		<meta itemprop="description" content="Portfolio site of freelance designer and creative director Henry Proudlove. This site showcases recent projects including work for AMV BBDO, Universal Music, The Guardian, Huawei and more.">
		<meta itemprop="image" content="http://henryproudlove.com/img/schema_image.png">
		<!-- Open Graph -->
		<meta property="og:site_name" content="Henry Proudlove // Independent Creative"/>
		<meta property="og:title" content="Portfolio site of freelance designer and creative director Henry Proudlove" />
		<meta property="og:description" content="This site showcases some of my more recent projects including work for AMV BBDO, Universal Music, The Guardian, Huawei and more" />
		<meta property="og:image" content="<?php echo $page->rel_depth() . 'img/og_image.png'; ?>" />
		<meta property="og:type" content="article" />
		<meta property="article:publisher" content="http://henryproudlove.com" />
		<!-- Viewport initial scale -->
		<meta name="viewport" content="width=device-width, initial-scale=1">
		<!-- Favicons -->
		<link rel="icon" type="image/png" href="<?php echo $page->rel_depth() . 'img/favicon/favicon-32x32.png'; ?>" sizes="32x32" />
		<link rel="icon" type="image/png" href="<?php echo $page->rel_depth() . 'img/favicon/favicon-16x16.png'; ?>" sizes="16x16" />
		<!-- iOS bookmarking -->
		<link rel="apple-touch-icon-precomposed" sizes="144x144" href="<?php echo $page->rel_depth() . 'img/thumbs/apple-touch-icon-144x144.png';?>" />
		<link rel="apple-touch-icon-precomposed" sizes="152x152" href="<?php echo $page->rel_depth() . 'img/thumbs/apple-touch-icon-152x152.png'; ?>" />
		<!-- Windows bookmarking -->
		<meta name="application-name" content="Henry Proudlove // Independent Creative"/>
		<meta name="msapplication-TileColor" content="#E55242" />
		<meta name="msapplication-TileImage" content="<?php echo $page->rel_depth() . 'img/thumbs/mstile-144x144.png';?>" />
		<!-- Main Styles -->
        <link rel="stylesheet" href="<?php echo $page->rel_depth() . 'css/normalize.css'; ?>">
        <link rel="stylesheet" href="<?php echo $page->rel_depth() . 'css/main.css'; ?>">
		<?php
			// Dynamic css
			$projects = get_the_projects();
			echo '<style type="text/css" id="case-study-styles">' . PHP_EOL;
				echo '/* Casestudy specific */' . PHP_EOL;
				project_classes($projects);
				echo '/* spinners */' . PHP_EOL;
				buildSpinner($projects);
				unset($projects);
				echo '/* cursors */' . PHP_EOL;
				cursor_classes();
			echo '</style>' . PHP_EOL;
		?>
		<!-- Fonts -->
		<?php include(DIR_MARKUP . 'fonts.php');?>
		<!-- Scripts -->
        <script src="<?php echo $page->rel_depth() . 'js/vendor/modernizr.js'; ?>"></script>
		<script src="<?php echo $page->rel_depth() . 'js/vendor/picturefill.min.js'?>" async></script>
	</head>
	<?php
		$body_class = $page->name;
		if($page->is_casestudy()){ $body_class .= ' project'; }
		if(!SERVER_FLAG){
			$body_data = SUB_DOM;
		}else{
			$body_data = false;
		}
	?>
    <body class="<?php echo $body_class . '"';  
		if($body_data){
			echo 'data-uri-stem="' . $body_data . '"';
		}?>>
		<?php //echo $page->name;?>
		<div id="container">
			<header class="main-header">
				<div class="menu-container">
					<div class="menu-wrapper">
						<h1 class="site-title">
							<a href="<?php echo $page->rel_depth(); ?>" class="clearfix active">
								<span class="header-png">Henry Proudlove</span>	
								<?php include(DIR_BASE . 'img/header-svg/HenryProudlove-inline.svg');?>
								<?php include(DIR_BASE . 'img/header-svg/HenryProudlove-stacked.svg');?>				
							</a>
						</h1>
						<nav class="site-links">
							<a href="<?php echo $page->rel_depth() . 'work'; ?>"><span>Work</span></a>
							<a href="<?php echo $page->rel_depth() . 'about'; ?>"><span>About</span></a>
							<a href="<?php echo $page->rel_depth() . 'contact'; ?>"><span>Contact</span></a>
						</nav>
					</div>
					<div class="red-block"></div>
				</div>
				<nav class="menu-button">
					<a href="#" class="active">
						<span class="open">Menu
							<span class="top bar fg-color"></span>
							<span class="middle bar fg-color"></span>
							<span class="bottom bar fg-color"></span>
						</span>
					</a>
					<a href="#" class="">
						<span class="close">Close
							<span class="first bar"></span>
							<span class="second bar"></span>
						</span>
					</a>
				</nav>
			</header>