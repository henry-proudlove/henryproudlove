<?php
	$content = array(
		array(
			'size'  => 'width5'),
		array(
			'title' => 'Underground Car Park',
			'size'  => 'width3'),
		array(
			'title' => 'Out of Black',
			'size'  => 'width3'),
		array(
			'title' => 'Play Video',
			'video' => 'https://vimeo.com/123825944',
			'size'  => 'width5'),
		array(
			'title' => 'Graphics: Isometric',
			'size'  => 'width3'),
		array(
			'title' => 'Out in the Desert',
			'size'  => 'width3')
	);
	$project = array(
		'title'    => 'Wonderland Teaser Promo',
		'client'   => 'Universal',
		'date'     =>  date_create('2014-07-01', timezone_open('Europe/London')),
		'role'	   =>  array('Creative Direction'),
		'desc'     => 'Integer posuere erat a ante venenatis',
		'color'    =>  array('bg' => '#a13bb9', 'fg' => 'white'),
		'content'  =>  $content,
		'text'     =>
'<p>Sa Dingding&rsquo;s has been one China&rsquo;s most prominent artists ever since she sang at the opening ceremony of the 2008 Beijing Olympics.</p>

<p>Her album 2014 &lsquo;Wonderland&rsquo; remixes her ethereal, folk-infused work into modern, dance-floor-filling tracks and the Studio Output Beijing team were briefed to build excitement around the release.</p>

<p>We created a one minute teaser film which follows Sa Dingding making the same journey her music made on the album. Beginning in natural landscapes and moving through traditional hutongs, until she arrives in the thronging night-time streets &ndash; and packed, laser-lit dancefloors &ndash; of modern China.</p>'
	);
?>