<?php
	$content = array(
		array(
			'title' => 'Brand Video',
			'size' =>  'width5'),
		array(
			'video' => 'https://vimeo.com/123825945',
			'title' => 'Hong Kong Neon',
			'size' =>  'width4'),
		array(
			'title' => 'Pheonix News Edit Suite',
			'size' =>  'width1'),
		array(
			'title' => 'Phoenix News Studio',
			'size' =>  'width1'),
		array(
			'size' =>  'width1'),
		array(
			'size' =>  'width1'),
		array(
			'title' => 'Traffic Timelapse',
			'size' =>  'width4')
	);
	$project = array(
		'title'    => 'Phoenix Rising',
		'client'   => 'Huawei',
		'date'     =>  date_create('2014-03-01', timezone_open('Europe/London')),
		'role'	   =>  array('Creative Direction'),
		'desc'     => 'Integer posuere erat a ante venenatis',
		'color'    =>  array('bg' => '#37cf5e', 'fg' => 'white'),
		'content'  =>  $content,
		'text'     =>
'<p>Phoenix TV is a Hong Kong based 24 hour news channel and Huawei provides them with a range of solutions that power their global network of news gathering and content distribution. Studio Output were commissioned by Huawei to tell the story of their collaboration.</p>

<p>Filming at Phoenix TV&rsquo;s headquarters and on the streets of Hong Kong, we aimed to draw a parallel between the incredible, high-functioning complexity of the city and Phoenix TV&rsquo;s worldwide operation.</p>'

	);
?>