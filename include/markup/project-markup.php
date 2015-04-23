<?php global $cs; ?>
<div class="content-wrapper">
	<article class="project content" data-name="<?php echo $cs->name;?>">
		<header class="fg-color main trans">
			<h1><?php echo $cs->client; ?></h1>
			<h2><?php echo $cs->title; ?></h2>
		</header><!--. header -->
		<section class="images bg-color">
			<?php $cs->the_content(); ?>
		</section>	<!-- .content -->
		<section class="text clearfix">
			<div class="wrapper">
				<header class="fg-color oow trans">
					<h1><?php echo $cs->client; ?></h1>
					<h2><?php echo $cs->title; ?></h2>
				</header><!--. header -->
				<section class="information clearfix">
					<aside>
						<time><?php $cs->the_date(); ?></time>
						<ul class="fg-color oow trans"><? $cs->the_roles(); ?></ul>
					</aside>
					<section class="description">
						<?php $cs->the_text();?>
					</section><!-- .text -->
				</section><!--.information-->
				<nav class="project-navigation clearfix">
					<?php $cs->project_navigation(); ?>
				</nav>
			</div><!--. wrapper-- >
		</section><!--.text-->
	</article><!-- .project -->
</div><!-- .content-wrapper -->

<?php include_once(VIEW_FOOTER) ;?>