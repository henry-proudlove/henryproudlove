<?php
	$content = array(
		array(
			'title' => 'Logotype and Character Lockup',
			'size' => 'width5'),
		array(
			'video' => 'https://vimeo.com/125532168',
			'title' => 'Case Study Video',
			'size' => 'width4'),
		array(
			'title' => 'Installation in Use',
			'size' => 'width1'),
		array(
			'title' => 'Installation in Use',
			'size' => 'width1'),
		array(
			'title' => 'Character-sprite',
			'size' => 'width5')
	);
	$project = array(
		'title'    => 'Beijing Design Week 2014',
		'client'   => 'Exercism',
		'date'     =>  date_create('2014-10-01', timezone_open('Europe/London')),
		'role'	   =>  array('Creative Direction', 'Design', 'UX Design'),
		'desc'     => 'Integer posuere erat a ante venenatis',
		'color' => array('bg' => '#f7f7f8', 'fg' => '#204ab6'),
		'content'  =>   $content,
		'text'     =>
'<p>Public exercise machines are, to this outsider&rsquo;s eye, a defining oddity of Chinese urban architecture. Small herds of these, mostly blue and yellow, beasts, can be found tucked down dusty inner city alleyways, incongruous in ancient temple parks, watching the traffic crawl by beside massive multilane highways.</p>

<p>Exercism, a project created with Studio Output for Beijing Design Week 2014 reimagined these machines as digital interfaces. With some simple Aurduino sensors to track their movements, they became controllers for a game that explored their natural habitat, the streets of Beijing.</p>'
	);
?>