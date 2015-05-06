<?php
	$content = array(
		array(
			'title' => 'Homepage Feed: Mobile and Tablet',
			'size' => 'width5'),
		array(
			'title' => 'Homepage: Desktop',
			'size' => 'width2',
			'height' => 'height12'),
		array(
			'title' => 'Case Study: Desktop',
			'height' => 'height12',
			'size' =>  'width1'),
		array(
			'title' => 'News Section: Desktop',
			'height' => 'height12',
			'size' =>  'width1'),
		array(
			'title' => 'Work Section: Desktop',
			'height' => 'height4',
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
		'color'    =>  array('bg' => '#efefef', 'txt' => 'white'),
		'content'  =>  $content,
		'text'     =>
'<p>AMV BBDO are a bit of a big deal. Consistently one of the most admired names in advertising, the agency has produced a ton of truly iconic work. Most notably for me, the Guiness Surfer spot, directed by Jonathan Glazer back in a distant and different place called the 1990s.</p>

<p>That commercial is more or less the thing that first made me want to work in the design and advertising industry&#8230; and surf&#8230; and read Moby Dick; I have since attempted all of these, with mixed results.</p>

<p>SoI was very happy to be asked to redesign their website. Working closely with their in house team and the developers of the site Weapon7, we created a responsive solution that aims to give AMV a platform to share their energy and creativity.</p>'
	);
?>