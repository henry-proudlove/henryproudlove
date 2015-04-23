<?php
	include('../config.php');
	include(VIEW_HEADER);
?>
	<div class="content-wrapper">
		<article class="content work" data-name="work">
			<section class="grid images project-thumbnails">
				<?php
					include_once(DIR_PROJECT . 'map.php');
					$projects = get_the_projects($project_map);					
					foreach($projects as $project){
						$color = $project['project_data']->color;
						echo '<a class="box width1 ' . $project['project_name'] . '" href="' . $page->rel_depth() . 'work/c/'. $project['project_name'] . '/" rel="bookmark">';
							$project['project_data']->the_thumbnail();
						echo '</a>';
					}
				?>
			</section><!-- .grid -->
		</article><!-- .content .work -->
	</div><!-- .content-wrapper -->
<?php
	include(VIEW_FOOTER);
?>
