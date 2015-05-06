<?php
	class Page
	{
		private $index, $depth, $sibs;
		
		public function __construct()
		{
			// Get the filename requested from the server
			$this->request  = $_SERVER['SCRIPT_FILENAME'];
			//Path from doc root to $this
			$this->path     = substr($this->request, 0, strlen('.index.php') * -1);
			// Get path from site root to $this
			$this->relpath  = substr($this->path, strlen(DIR_BASE));
			// Give $this a name
			$this->name     = $this->get_page_name();
			// Get number of levels between site root and here
			$this->depth    = $this->get_depth();
			// Path from doc root to $this
			$this->dirpath  = substr($this->path, 0, strlen($this->name) * -1);
			// Get parent dir for $this 
			$this->parent   = $this->get_parent();
			// Find dir at the same depth as $this
			$this->sibs     = $this->get_sibs();
			// Get the index of $this in parent dir
			$this->index    = array_search($this->dirpath . $this->name, $this->sibs);
		}
		
		public function get_depth()
		{
			return substr_count(substr($this->request, strlen(DIR_BASE)) , '/');
		}
		
		public function get_page_name(){
			$name = strtolower(basename($this->path, '.php'));
			if($name == 'henryproudlove' || $name == ''){
				$name = 'home';
			}
			return $name;
		}
		
		public function rel_depth()
		{
			if(SERVER_FLAG){
				return '/';
			}else{
				return SUB_DOM;
			}
		}
		
		public function make_root_rel($path){
			if(SERVER_FLAG){
				$root_rel = '/' . substr($path, strlen(DIR_BASE));
			}else{
				$root_rel = substr($path, strlen(DIR_ROOT));
			}
			if($root_rel){
				return $root_rel;
			}else{
				return FALSE;
			}
		}
		
		private function get_sibs()
		{
			if(is_dir($this->dirpath)){
				$sibs = glob($this->dirpath . '*', GLOB_ONLYDIR);
			}
			return $sibs;
		}
		
		public function get_parent(){
			$parent = substr($this->relpath , 0 , strrpos($this->relpath , '/'));
			$parent = substr($parent , strrpos($parent , '/') + 1);
			return $parent;
		}
		
		public function get_paging()
		{
			$sibs = $this->sibs;
			$lsib = count($sibs) - 1;
			$i    = $this->index;
			 
			switch ($i){
				case 0:
					$nav = array(
						'prev' => $sibs[1],
						'next' => $sibs[$lsib]
					);
					return $nav;
					break;
				case $lsib:
					$nav = array(
						'prev' => $sibs[$i-1],
						'next' => $sibs[0]
					);
					return $nav;
					break;
				default:
					$nav = array(
						'prev' => $sibs[$i-1],
						'next' => $sibs[$i+1]
					);
					return $nav;
			}
		}
		
		public function is_casestudy()
		{
			if($this->parent == 'c'){
				return (bool) true;
			}else{
				return (bool) false;
			}
		}
		
		public function this_project($project){
			if($this->name == $project->name){
				return (bool) true;
			}else{
				return (bool) false;
			}
		}
		
		public function get_media_path($project = ''){
			$media = $this->rel_depth() . 'work/' . $project . '/';
			return $media;
		}
	}
?>