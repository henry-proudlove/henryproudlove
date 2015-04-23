<?php
	include_once('../../../config.php');
	include_once(VIEW_HEADER);
	
/*	$content = array(
		array(
			'title' => 'Homepage Feed: Mobile and Tablet',
			'size' => 'width5'),
		array(
			'title' => 'Homepage: Desktop',
			'size' => 'width2'),
		array(
			'title' => 'Case Study: Desktop',
			'size' =>  'width1'),
		array(
			'title' => 'News Section: Desktop',
			'size' =>  'width1'),
		array(
			'title' => 'Work Section: Desktop',
			'size' =>  'width5'),
		array(
			'title' => 'People Section: Desktop',
			'size' =>  'width3'),
		array(
			'title' => 'Contact Page: Desktop',
			'size' =>  'width3'),
	);
	
	$project = array(
		'title'    => 'Responsive Site Design',
		'client'   => 'AMV BBDO',
		'date'     =>  date_create('2012-10-01', timezone_open('Europe/London')),
		'role'	   =>  array('Creative Direction', 'Design', 'UX Design'),
		'desc'     => 'Integer posuere erat a ante venenatis',
		'text'     => '<p>Curabitur blandit tempus porttitor. Cras mattis consectetur purus sit amet fermentum. Sed posuere consectetur est at lobortis. Maecenas faucibus mollis interdum.</p><p>Vestibulum id ligula porta felis euismod semper. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent commodo cursus magna, vel scelerisque nisl consectetur et.</p>',
		'bg_color' => '#efefef',
		'content'  =>  $content
	);*/
	/*include_once($page->path . '/data.php');
	$casestudy = new CaseStudy($project);
	the_project($casestudy);*/
	the_project();
	
?>