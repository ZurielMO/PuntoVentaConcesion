<?php
// Fallback para hostings cPanel/Apache que no detectan index.html como DirectoryIndex.
readfile(__DIR__ . '/index.html');
