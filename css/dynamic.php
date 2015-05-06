<?php
    header("Content-type: text/css; charset: UTF-8");
	include('../config.php');
	include(VIEW_FUNCTIONS);
	echo '/* Casestudy specific */' . PHP_EOL;
	project_classes();
echo '/* cursors */' . PHP_EOL;
	cursor_classes();
?>