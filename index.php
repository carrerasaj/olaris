<?php
$file = $_SERVER["DOCUMENT_ROOT"] . $_SERVER["REQUEST_URI"];
if (file_exists($file) && !is_dir($file)) {
    return false; // Let Heroku serve the file
}
include_once("home.html");
?>
