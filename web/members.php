<?php
require_once "config.php";

$db = new mysqli(DB_HOST,DB_USERNAME,DB_PASSWORD,DB_NAME);
$db->set_charset("utf8");
?>
<!DOCTYPE html>
<html>
<head>
    <title>/r/TaylorSwift Discord Member Statistics</title>
    <meta http-equiv="content-type" content="text/html; charset=UTF-8">
    <link rel="stylesheet" href="sortable-theme-bootstrap.css" />
</head>
<body>
<div id="dataStore">
    <h1>Member Statistics</h1>
    <table class="sortable-theme-bootstrap" data-sortable>
        <thead>
        <tr>
            <th>Username</th>
            <th>Words</th>
            <th>Words/Msg</th>
        </tr>
        </thead>
        <tbody>
        <?php
        $query = $db->query("SELECT * FROM members WHERE server='115332333745340416' ORDER BY username");
        while ($row = $query->fetch_array())
        {
            $average = ($row['messages'] > 0) ? round($row['words']/$row['messages'],2) : 0;
            echo "<tr><td>".$row['username']."</td><td>".$row['words']."</td><td>$average</td></tr>";
        }
        ?>
        </tbody>
    </table>
</div>
<script src="sortable.min.js"></script>
</body>
</html>
