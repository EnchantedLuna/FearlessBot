<?php
require_once "config.php";

$db = new mysqli(DB_HOST,DB_USERNAME,DB_PASSWORD,DB_NAME);
$db->set_charset("utf8mb4");
?>
<!DOCTYPE html>
<html>
<head>
    <title>FearlessBot Data Storage</title>
    <meta http-equiv="content-type" content="text/html; charset=UTF-8">
    <link rel="stylesheet" href="sortable-theme-dark.css" />
    <link rel="stylesheet" href="dark.css" />
    <style type="text/css">
        #dataStore {
            margin-bottom: 10px;
            float:left;
        }
    </style>
</head>
<body>
<div id="dataStore">
    <h1>FearlessBot Shitposts</h1>
    <table class="sortable-theme-dark" data-sortable>
        <thead>
        <tr>
            <th>Number</th>
            <th>Shitpost</th>
        </tr>
        </thead>
        <tbody>
        <?php
        $query = $db->query("SELECT * FROM shitposts ORDER BY id");
        while ($row = $query->fetch_array())
        {
            echo "<tr><td>".htmlspecialchars($row['id'])."</td><td>".nl2br(htmlspecialchars($row['shitpost']))."</td></tr>";
        }
        ?>
        </tbody>
    </table>
</div>
<script src="sortable.min.js"></script>
</body>
</html>

