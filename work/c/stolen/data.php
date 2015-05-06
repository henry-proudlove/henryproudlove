<?php
	$content = array(
		array(
			'title' => 'Home & Releases',
			'size' => 'width5'),
		array(
			'title' => 'Artist Profile',
			'size' => 'width5'),
		array(
			'title' => 'Poster Archive',
			'size' => 'width3'),
		array(
			'title' => 'Poster Archive',
			'size' => 'width3')
	);
	$project = array(
		'title'    => 'Site Design',
		'client'   => 'Stolen Recordings',
		'date'     =>  date_create('2012-03-01', timezone_open('Europe/London')),
		'role'	   =>  array('Creative Direction', 'Design', 'Development', 'UX Design'),
		'desc'     => 'Integer posuere erat a ante venenatis',
		'color'    => array('bg' => '#293034'),
		'content'  =>   $content,
		'text'     =>
'<p>Stolen Recordings is an award winning North London record label who have been releasing interesting, off-kilter pop, from acts such as the awesome Japanese group Bo Ningen, East India Youth, Race Horses, Pete and the Pirates, Serefina Steer and My Sad Captains since 2005</p>

<p>I was approached by label co-founder Rachael Robb to revamp their site. The eventual solution folded the labels social channels into a Wordpress whose look and feel reflected the dominant aesthetic of the label&rsquo;s artwork.</p>'
	);
?>