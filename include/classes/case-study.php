<?php
	class CaseStudy
	{	
		// Filename and Title
		public $name, $title;
		// Meta
		public $client, $role, $date;
		// Text
		public $desc, $text;
		//Images
		public $thumb, $content, $lead;
		// Image sizes
		private $sizes = array('2880', '2440' , '1920', '1440' , '1200', '960', '640', '480' , '320');
		
					
	    public function __construct($arr)
	    {
			foreach($arr as $k => $v){
				$this->$k = $v;
			} 
			global $page;
			$this->name = $page->name;
	    }
		
		// Sets name for when object called outside of project page
		public function set_name($name)
		{
			$this->name = $name;
		}
		
		// Echoes the date
		public function the_date()
		{
			echo date_format($this->date,"F Y");
		}
		
		// Echoes the roles split into li's
		public function the_roles()
		{
			$roles = $this->role;
			echo '<li>' . implode('</li><li>', $this->role) . '</li>';
		}
		
		// Echoes the Text split into p's
		public function the_text()
		{
			echo $this->text;
		}
		
		// Echoes prev and next links for projects
		public function project_navigation()
		{
			global $page;
			include(DIR_PROJECT . 'map.php');
			$cs_i = array_search($this->name , $project_map);
			$cs_count = count($project_map);
			switch (true){
				case $cs_i == $cs_count:
					$filter = array(
						$cs_i -1 => $project_map[$cs_i -1],
						1 => $project_map[1]
					);
					break;
				case $cs_i == 1:
					$filter = array(
						$cs_count => $project_map[$cs_count],
						$cs_i + 1 => $project_map[$cs_i + 1],
					);
					break;
				default:
					$filter = array(
						$cs_i - 1 => $project_map[$cs_i - 1],
						$cs_i + 1 => $project_map[$cs_i + 1],
					); 
			}
			$projects = get_the_projects($filter, false);
			$links = array(
				'prev' => array(
					'title' => $projects[0]['project_data']->client,
					'link'  => $page->make_root_rel(DIR_PROJECT . 'c/' . $projects[0]['project_data']->name),
					//'btn'   => '<span class="casestudy-paging"><span>Back</span></span>'
				),
				'next' => array(
					'title' => $projects[1]['project_data']->client,
					'link'  => $page->make_root_rel(DIR_PROJECT . 'c/' . $projects[1]['project_data']->name),
					//'btn'   => '<span class="casestudy-paging"><span></span></span>'
				)
			);
			echo '<a class="fg-color oow back trans" href="' . $links['prev']['link'] . '" rel="prev">'  . $links['prev']['title'] . '</a>';
			//echo $links['prev']['btn'] . '<span class="paging-label">' . $links['prev']['title'] . '</span></a>';
			echo '<a class="fg-color oow next trans" href="' . $links['next']['link'] . '" rel="prev">' . $links['next']['title'] . '</a>' ;
			//echo '<span class="paging-label">' . $links['next']['title'] . '</span>' .  $links['next']['btn'] . '</a>';
			
			//var_dump($links);
			//var_dump($projects);
			//$nav = $page->get_paging();
			//include_once($nav['prev'] . '/index.php');
			//var_dump($project_map);
			/*echo '<a href="'. $nav['prev'] . '" rel="prev">' . $casestudy->client . '</a>';
			include_once($nav['next'] . 'index.php');
			echo '<a href="'. $nav['next'] . '" rel="next">' . $casestudy->client . '</a>';*/	
		}
		
		// Echoes HTML for all Case Study Images
		public function the_content()
		{
			$content = $this->get_cs_images();
			$cc = count($content);
			for($i = 0; $i < $cc; $i++){
				if ($i == 0){
					echo $content[$i];
					echo '<div class="grid bg-color cursor-zoom clearfix"><div class="grid-sizer"></div>';
				}else{
					echo $content[$i];
				}
			}
			echo '</div><!-- .grid -->';
		}
		
		// Echoes out the result of get_lead_image()
		public function the_lead_image(){
			global $page;
			$files = [];
			$files = array(
				'portrait' => $this->create_filepath_arr('lead/portrait'),
				'landscape'=> $this->create_filepath_arr('lead/landscape')
			);
			$tag = '<figure class="loading">';
				$tag .= '<picture><!--[if IE 9]><video style="display: none"><![endif]-->';
				foreach($files as $orientation => $file){
					$props = array(
						'title' => $this->title,
						'files' => $file[0],
						'client'=> $this->client,
						'size'  => 'width5',
						'ratio' => $orientation
					);
					$result = new Image($props);
					$tag .= $result->get_the_sources();
				}
			
				$tag .= '<!--[if IE 9]></video><![endif]-->';
				$tag .= $this->get_lead_default();
				$tag .= '</picture>';
			$tag .= '</figure>';
	
			return $tag;
		}
		
		public function get_lead_default(){
			$leads = $this->create_cs_directory_arr('lead/landscape')['1200'] . '/';
			$img = glob($leads . '*', GLOB_BRACE)[0];
			if(is_file($img)){
				$type = pathinfo($img, PATHINFO_EXTENSION);
				$data = file_get_contents($img);
				$base64 = 'data:image/jpg;base64,' . base64_encode($data);
				$tag = '<img src="' . $base64 . '" alt="' . $this->name . '" class="lazyload">';
			}			
			return $tag;
		}
		
		public function get_pager()
		{
			if(isset($this->title)){
				$result = '<figcaption>';
				$result .= '<span class="indicator fg-color"></span>';
				$result .= '<span class="cycle-pager-text">';
				if(isset($this->client)){
					$result .= '<h3 class="trans">' . $this->client . '</h3>';
				}
				$result .= '<h4 class="trans">' . $this->title . '</h4>';
				$result .= '</span">';
				$result .= '</figcaption>';
				return $result;
			}else{
				return FALSE;
			}
		}
		
		//Echoes the thumbnail for the project
		// Interface between thumbnail class and case study class
		
		public function the_thumbnail()
		{
			$thumb = $this->get_thumbnail();
			echo $thumb;
		}
		
		//Returns array of image objects for all project images
		public function get_cs_images()
		{
			$content = $this->content;	
			$files = $this->create_filepath_arr();	
			$cc = count($content);
			$result = [];
			
			for($i=0; $i < $cc; $i++){
				$content[$i]['files'] = $files[$i];
				$image = new Image($content[$i]);
				$result[] = $image->cs_image();;
			}
			return $result;
		}
		
		public function get_lead_image()
		{
			/*global $page;
			$files = [];
			
			$files[0] = $this->create_filepath_arr('lead/landscape');
			$files[1] = $this->create_filepath_arr('lead/portrait');
			//var_dump($files);
			
			$tag = '<a class="lead height6' . $this->name . '" href="' . $page->rel_depth() . 'work/c/'. $this->name . '/" rel="bookmark" >';
			//$tag .= 'data-cycle-pager-template="' . htmlspecialchars($this->get_pager()) . '" ';
			$tag .= 'data-project-name="' . $this->name . '"><figure>';
			//$tag .= $this->get_the_img();	
			$tag .= '</figure>';
			$tag .= '</a>';
			
			return $tag;*/
			
		}
		
		/*private function get_lead_image_obj($files){
			$result = [];
			foreach($files as $img){
				$props = array(
					'title' => $this->title,
					'name'  => $this->name,
					'client'=> $this->client,
					'files' => $img,
					'size'  => 'width5'
				);
				$image = new Image($props);
				$result[] = $image->lead_image();
			}
			return $result;
		}*/
		
		// Returns thumbnail image as object
		public function get_thumbnail()
		{
			// Use thumbnail if set
			if(isset($this->thumb)){
				$thumb = $this->thumb;
			}else{
				$thumb = 0;
			}
			$props = array(
				'title' => $this->title,
				'files' => $this->create_filepath_arr('thumb')[0],
				'client'=> $this->client,
				'size'  => 'width1'
			);
			$result = new Image($props);				
			return $result->thumb_image();
		}
		
		/* Recevieces a string or array of image filnames, or an interger representing the index of the file
		   Uses create_cs_directory_arr to find paths to all sizes-specific media folders
		   Returns paths of all filename's sizes
		   By defult returns filepaths for all images in media folder */	
		
		public function create_filepath_arr($type = 'media')
		{
			global $page;
			$dirarr = $this->create_cs_directory_arr($type);
			$result = [];
			// Scan the project's media file against the string generated above
			foreach($dirarr as $size => $dir){
				if (is_dir($dir)) {
					$imgs = glob($dir . '*', GLOB_BRACE);
					foreach($imgs as $i => $img){
						if(is_file($img)){
							$result[$i][$size] = $page->make_root_rel($img);
						}else{
							$result[$i][$size] = '!!ERROR!! (LINE: 165) FILE NOT FOUND!! ' . $img;
						}
					}
				}
			}
			return $result;
		}
		
		public function create_cs_directory_arr($type = 'media')
		{
			global $page;
			$dirarr = [];
			
			$sizes = $this->sizes;
			
			foreach($sizes as $size){
				$dirarr[$size] = DIR_PROJECT . 'c/' . $this->name . '/' . $type . '/' . $size . '/';
			}
			return $dirarr;
		}
		
	}
	
?>
	