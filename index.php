<?php
	include('config.php');
	include(VIEW_HEADER);
?>
	<div class="content-wrapper">
		<article class="content home" data-name="home">
				<section id="cycle-scroll-holder" class="intro cycle">
					<?php
						include_once(DIR_PROJECT . 'map.php');
						$projects = get_the_projects($lead_map);
						foreach($projects as $project){
							$prj = $project['project_data'];
							$name = $prj->name;
							echo '<a class="lead height6 ' . $name . '" href="' . $page->rel_depth() . 'work/c/'. $name . '" rel="bookmark" ';
							echo 'data-cycle-pager-template="' . htmlspecialchars($prj->get_pager()) . ' data-project-name="' . $name . '">';
								echo $prj->the_lead_image();
							echo '</a>';
						}
					?>				
				</section><!-- .intro .cycle -->
			<nav class="cycle-pager"></nav>
		</article><!-- .content .home -->
	</div><!-- .content-wrapper -->
	  
<?php
	include(VIEW_FOOTER);
?>
