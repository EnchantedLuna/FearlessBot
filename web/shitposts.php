<?php
require_once "config.php";

$db = new mysqli(DB_HOST,DB_USERNAME,DB_PASSWORD,DB_NAME);
$db->set_charset("utf8mb4");
?>
<!DOCTYPE html>
<html>
<head>
    <title>Shitposts</title>
    <meta http-equiv="content-type" content="text/html; charset=UTF-8">
    <link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/v/bs-3.3.7/jq-2.2.4/dt-1.10.13/datatables.min.css"/>
    <link rel="stylesheet" type="text/css" href="darkly.css"/>
</head>
<body>
<div class="container">
    <nav class="navbar navbar-default">
        <div class="container-fluid">
            <!-- Brand and toggle get grouped for better mobile display -->
            <div class="navbar-header">
                <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1" aria-expanded="false">
                    <span class="sr-only">Toggle navigation</span>
                    <span class="icon-bar"></span>
                    <span class="icon-bar"></span>
                    <span class="icon-bar"></span>
                </button>
                <a class="navbar-brand" href="#">FearlessBot</a>
            </div>

            <!-- Collect the nav links, forms, and other content for toggling -->
            <div class="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
                <ul class="nav navbar-nav">
                    <li><a href="fearlessdata.php">Saved Items</a></li>
                </ul>
            </div><!-- /.navbar-collapse -->
        </div><!-- /.container-fluid -->
    </nav>
    <div id="shitposts">
        <h1>Shitposts</h1>
        <table class="table table-striped" id="memberTable">
            <thead>
            <tr>
                <th>#</th>
                <th>Shitpost</th>
            </tr>
            </thead>
            <tfoot>
            <tr>
                <th>#</th>
                <th>Shitpost</th>
            </tr>
            </tfoot>
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
</div>
<script type="text/javascript" src="https://cdn.datatables.net/v/bs-3.3.7/jq-2.2.4/dt-1.10.13/datatables.min.js"></script>
<script>
    $(document).ready(function() {
        $('#memberTable').DataTable({
            "iDisplayLength": 25,
            "lengthMenu": [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]]
        });
    });
</script>
</body>
</html>

