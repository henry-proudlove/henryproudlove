<?php
	include_once(DIR_CLASSES . 'page.php');
	include_once(DIR_CLASSES . 'case-study.php');
	include_once(DIR_CLASSES . 'image.php');
	include_once(DIR_CLASSES . 'image-color.php');
	
	
	// Return an array of all casestudy objects 
	function get_the_projects($filter = null, $sort = true){
		
		$dir = DIR_PROJECT . 'c/';
		$projects = [];
		if(isset($filter)){			
			$reqstr = '{' . implode(',' , $filter) . '}';
		}else{
			$reqstr = '*';
		}		
		if(is_dir($dir)){			
			$project_paths = glob($dir . $reqstr, GLOB_BRACE);
			$count_p = count($project_paths);
			for($i = 0; $i < $count_p; $i++){
				$file = $project_paths[$i] . '/data.php';
				$name = substr($project_paths[$i], strlen($dir));
				if(is_file($file)){
					include($file);
					$casestudy = new CaseStudy($project);
					$casestudy->set_name($name);
					$projects[$i] = array(
						'project_data' => $casestudy,
						'project_name' => $name,
						'project_filename' => $file
					);
					unset($casestudy);
				}
			}
		}
		if($sort){
			ksort($projects);
		}
		return $projects;
	}
		
	// Gets a single casestudy
	function get_the_project(){
		global $page;
		if($page->is_casestudy()){
			include($page->path . '/data.php');
			return new CaseStudy($project);
		}else{
			return false;
		}

	}
	// Echoes out a single casestudy
	function the_project(){
		global $page;
		if($page->is_casestudy()){
			include_once(DIR_MARKUP . 'project-markup.php');
		}
	}
	
	// Write case study specific css  
	function project_classes(){
		$projects = get_the_projects();
		foreach($projects as $project){
			if(isset($project['project_data']->color)){
				buildClass($project['project_data']->name, $project['project_data']->color);
			}
		}
		unset($projects);
	}
	function buildClass($name, $colors){
		if(isset($colors['fg']) && $colors['fg'] == 'white'){
			foreach($colors as $k => $color){
				echo "." . $name . " ." . $k . "-color:not(.oow){ \n";
					write_color_class($color);
				echo "}\n";
				if($k == 'bg'){
					echo "." . $name . " .fg-color.oow{ \n";
						write_color_class($color);
					echo "}\n";
				}else{
					echo "." . $name . " .bg-color.oow{ \n";
						write_color_class($color);
					echo "}\n";
				}
			}
		}else{
			foreach($colors as $k => $color){
				echo "." . $name . " ." . $k . "-color{ \n";
					write_color_class($color);
				echo "}\n";
			}
		}
	}
	function write_color_class($color){	
		echo 'color:' . $color . ';' . PHP_EOL;
		echo 'background-color:' . $color . ';' . PHP_EOL;
		echo 'border-color:' . $color . ';' . PHP_EOL;
		echo 'stroke:' . $color . ';' . PHP_EOL;
		echo 'fill:' . $color . ';' . PHP_EOL;
	}
	
	// Add Special cursors for casestudies
	function cursor_classes(){
		$dir1x = DIR_BASE . 'img/cursors/1x/';
		$dir2x = DIR_BASE . 'img/cursors/2x/';
		$files = [];
		$cursors = [];
		if(is_dir($dir1x) && is_dir($dir2x)){
			$files['1x'] = glob($dir1x . '*.png', GLOB_BRACE);
			$files['2x'] = glob($dir2x . '*.png', GLOB_BRACE);
			$cf = count($files['1x']);
			for($i = 0; $i < $cf; $i++){
				$cursors[$i]['1x'] = $files['1x'][$i];
				$cursors[$i]['2x'] = $files['2x'][$i];
			}
			//var_dump($files);
			//echo '<style type="text/css" id="cursor-styles">';
				//var_dump($cursors);
			echo '@media only screen and (min-width: 550px) {' . PHP_EOL;
				foreach($cursors as $cursor){
					//var_dump(encode_cursor($cursor['2x']));
					$classname = basename($cursor['1x'], '.png');
					switch($classname){
						case 'cursor-zoom' :
							$classname =  '#container.active .' . $classname . ' figure.image';
							$fallback = 'zoom-in';
							break;
						case 'cursor-move':
							$classname = '.' . $classname;
							$fallback = 'ns-resize';
							break;
						case 'cursor-move-up':
							$classname = '.' . $classname;
							$fallback = 'n-resize';
							break;
						case 'cursor-move-down':
							$classname = '.' . $classname;
							$fallback = 's-resize';
							break;
						default: 
							$classname =  '#container.active .' . $classname ;
							$fallback = 'auto';	
					}
					$centrepoint = ' 22 26 ,';
					//encode_cursor($cursor['1x']);
					//	encode_cursor($cursor['2x']);
					echo $classname . ' {' . PHP_EOL;
							echo 'cursor : ' . encode_cursor($cursor['1x']) . $centrepoint . $fallback . ';'  . PHP_EOL;
							echo 'cursor: -webkit-image-set(' . PHP_EOL;
								echo encode_cursor($cursor['1x']) . ' 1x,'  . PHP_EOL;
								echo encode_cursor($cursor['2x']) . ' 2x' . PHP_EOL;
								echo ')' . $centrepoint . $fallback . ';'  . PHP_EOL;
						echo '}' . PHP_EOL;
				}
			echo '}';
		}
		
	}
	function encode_cursor($cursor){
		$cursor = file_get_contents($cursor);
		return 'url(data:image/png;base64,' . base64_encode($cursor) . ')';
	}
	
	// Get the Page title
	function get_title(){
		global $page;
		$site_title = 'Henry Proudlove';
		if($page->is_casestudy()){
			global $cs;
			$page_title = $cs->client . ' ' . $cs->title;
		}else{
			$page_title = ucwords($page->name);
		}
		return $site_title . ' // ' . $page_title;
	}
	function get_description(){
		global $page;
		if($page->is_casestudy()){
			global $cs;
			$roles = implode($cs->role, ' • ');
			$text  = preg_match('/^[^.?!]+/', strip_tags($cs->text), $text_match);
			$description = $roles . '// ' . $text_match[0];
		}else{
			include_once(DIR_MARKUP . 'desc.php');
			if(array_key_exists($page->name, $desc_arr)){
				$description = $desc_arr[$page->name];
			}else{
				$description = $desc_default;
			}
		}
		return trim($description);
	}
	
	
	
?>