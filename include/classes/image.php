<?php
	class Image
	{
		public $title, $files, $size, $video, $project;
				
	    public function __construct($data)
	    {
			foreach($data as $k => $v){
				$this->$k = $v;
			}
	    }
		
		public function thumb_image()
		{
			$tag = '<figure class="pad loading">';
			$tag .= $this->get_the_img() . $this->get_the_caption();
			$tag .= '</figure>';
			return $tag;
		}
	
		// Returns HTML for an image
		public function cs_image()
		{
			$tag = '<figure ';
			$tag .= $this->get_the_class();
			$tag .= '><div class="pad">';
			$tag .= $this->get_the_img() . $this->get_the_caption();
			$tag .= '</div>';
			if(isset($this->video)){
				$tag.= file_get_contents(DIR_BASE . '/img/play-button.svg');
			}
			$tag .= '</figure>';
			
			return $tag;
		}
		
		private function get_the_video()
		{
			if(isset($this->video)){
				return ' data-video="' . $this->video . '"';
			}
		}
		
		private function get_the_class()
		{
			$class = 'class="box loading ';
			if(isset($this->video)){
				$class .= ' video';
			}else{
				$class .= ' image';
				
			}
			if($this->size != null){
				$class .= ' ' . $this->size;
			}
			$class .= $this->get_img_height() . '"';
			return $class;
		}
		
		private function get_img_height()
		{
			if(!isset($this->height)){
				$size = getimagesize(DIR_BASE . substr($this->files['640'] , strpos($this->files['640'], 'work')));
				$height = round($size[1] / $size[0] * 4 / 3 * 6);
				return ' height' . $height;
			}else{
				return ' ' . $this->height;
			}
		}
		
		public function get_the_img()
		{
			$img = '<img ' . $this->create_src_str() . $this->create_sizes() . $this->get_the_video() . ' class="lazyload"/><div class="spinner"></div>';
			$img = '<img ' . $this->create_src_str() . $this->get_the_video() . ' data-sizes="auto" class="lazyload"/><div class="spinner"></div>';
			return $img;
		}
		
		public function get_the_caption()
		{
			//var_dump($this);
			//var_dump($this);
			$classes = $this->get_caption_classes();
			if(isset($this->title)){
				$result = '<figcaption class="fg-color oow">';
				
				$result .= '<span class="txt-color '. $classes . ' oow trans">';
				if(isset($this->client)){
					$result .= '<h3>' . $this->client . '</h3>';
				}
				$result .= '<h4>' . $this->title . '</h4>';
				$result .= '</span">';
				$result .= '</figcaption>';
				return $result;
			}else{
				return FALSE;
			}
		}
		
		private function get_caption_classes(){
			$classes = '';
			if(isset($this->caption)){
				foreach($this->caption as $k => $v){
					switch($k){
						case 'color':
							$classes = $v . '-color ';
						case 'pos' :
							$classes .= implode(' ', $v);
					}
				}
			}else{				
				$classes = 'bg-color';
			}
			return $classes;
		}
		
		// Returns all sources for an image as a srcset="" string 
		private function create_src_str()
		{
			$src = 'src="'. $this->files['640'] . '" data-srcset="';
			foreach($this->files as $size => $img){
				$src .= $img . ' ' . $size . 'w';
				if($size != '320'){
					$src .= ', '; 
				}else{
					$src .= '"';	
				}
			}
			return $src;
		}
		
		public function get_the_lead_default(){
			$path = DIR_PROJECT . 'c/' . $this->name . '/lead/landscape/1200/';
			//var_dump($path);
			$type = pathinfo($path, PATHINFO_EXTENSION);
			$data = file_get_contents($path);
			$base64 = 'data:image/' . $type . ';base64,' . base64_encode($data);
			//var_dump($data);
			$img = '<img ';
			$img .= '/>';
			
			return $img;
		}
		
		public function get_the_sources(){
			$src = '<source ';
			if($this->ratio == 'landscape'){	
				$src .='media="(min-aspect-ratio: 4/4)" ';
				//$src .= 'sizes="100vw" ';
				$src .= 'data-sizes="auto" ';
				$src .= 'data-srcset="';
				foreach($this->files as $size => $img){					
					$src .= $img . ' ' . $size . 'w';
					if($size != '320'){
						$src .= ', ';
					}
				}
				$src .= '" />';				
			}else{
				$src .= 'media="(max-aspect-ratio: 4/4)" ';
				$src .= 'sizes="100vw" ';
				$src .= 'data-srcset="';
				foreach($this->files as $size => $img){
					switch($size){
						case '2880':
							$src .= $img . ' 2160w, ';
							break;
						case '2440':
							$src .= $img . ' 1800w, ';
							break;
						case '1920':
							$src .= $img . ' 1440w, ';
							break;
						case '1440':
							$src .= $img . ' 1080w, ';
							break;
						case '1200':
							$src .= $img . ' 900w, ';
							break;
						case '960':
							$src .= $img . ' 720w, ';
							break;
						case '640':
							$src .= $img . ' 480w, ';
							break;
						case '480':
							$src .= $img . ' 360w, ';
							break;
						case '320':
							$src .= $img . ' 240w';
							break;
					}
						
				}
				$src .= '" />';
			}
			return $src;
			
		}
		
		// Returns image size rules as sizes="" string
		private function create_sizes()
		{
			if (isset($this->size)) {
				switch ($this->size){
					case 'width1':
						$displaysize =  '(min-width: 85.33em) 33.33vw, (min-width: 53.33em) 50vw, 100vw';
						break;
					case 'width2':
						$displaysize =  '(min-width: 85.33em) 33.33vw, 100vw';
						break;
					case 'width3':
						$displaysize =  '(min-width: 53.33em) 50vw, 100vw';
						break;
					case 'width4':
						$displaysize =  '(min-width: 85.33em) 66.67vw, 100vw';
						break;
					case 'width5':
						$displaysize =  '100vw';
						break;
					}
			}else{
				$displaysize =  '(min-width: 85.33em) 16.66vw, (min-width: 53.33em) 25vw, 100vw';
			}
			return 'sizes="' . $displaysize . '"';
		}
		
	}
	
?>