<?php
	$content = array(
		array(
			'title' => 'Vinyl Illustration',
			'size' => 'width5'),
		array(
			'title' => 'Data Capture: Question 1',
			'height' => 'height8',
			'size' => 'width3'),
		array(
			'title' => 'Playlist Shared: Question 1',
			'size' => 'width3'),
		array(
			'title' =>'Landing Page',
			'size' => 'width5'),
		array(
			'title' =>'Data Visualisation: Playlist Explorer',
			'size' => 'width5'),
		array(
			'title' =>'Data Visualisation: Best Live Song',
			'size' => 'width3'),
		array(
			'title' =>'Data Visualisation: First Record Buying Age',
			'size' => 'width3')
	);
	$project = array(
		'title'    => 'Six Songs Of Me',
		'client'   => 'The Guardian',
		'date'     =>  date_create('2012-07-01', timezone_open('Europe/London')),
		'role'	   =>  array('Design', 'Illustration', 'UX Design'),
		'desc'     => 'Integer posuere erat a ante venenatis',
		'color'    =>  array('bg' => '#c1b5a5', 'fg' => '#d60270'),
		'content'  =>  $content,
		'text'     =>
'<p>Our lives can be measured out in songs: 3-5 minute chunks of music and words, of memories and emotions, of people and places.</p>

<p>This project, created for the Guardian at Glue Isobar, was a way of exploring how music defines us. It invited users to create their ultimate, autobiographical playlist. Their very own Six Songs of Me: the song that gets them dancing, the first song that they ever bought, the song that they want played at their funeral.</p>

<p>This playlist could then be shared via Spotify and added to the library of all the playlists created with the tool. This library could be teased apart and explored through a range of data visualisations: the six songs of everyone.</p>'
	);
?>