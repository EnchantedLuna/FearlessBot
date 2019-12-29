<?php
require_once "config.php";
require_once "lib_autolink.php";

$db = new mysqli(DB_HOST,DB_USERNAME,DB_PASSWORD,DB_NAME);
$db->set_charset("utf8mb4");
$server = empty($_GET['server']) ? PRIMARY_GUILD : $_GET['server'];
?>
<!DOCTYPE html>
<html>
<head>
    <title>FearlessBot Saved Items</title>
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
    <div id="dataStore">
        <h1>Saved Items</h1>
        <table class="table table-striped" id="savedTable">
            <thead>
            <tr>
                <th>Keyword</th>
                <th>Value</th>
                <th>Added By</th>
                <th>Uses</th>
            </tr>
            </thead>
            <tfoot>
            <tr>
                <th>Keyword</th>
                <th>Value</th>
                <th>Added By</th>
                <th>Uses</th>
            </tr>
            </tfoot>
            <tbody>
            <?php
            $stmt = $db->prepare("SELECT keyword, value, uses, username FROM data_store
                LEFT JOIN members ON data_store.owner=members.id AND data_store.server=members.server WHERE approved=1 AND data_store.server= ? ORDER BY keyword ");
            $stmt->bind_param("s", $server);
            $stmt->execute();
            $stmt->bind_result($keyword, $value, $uses, $username);
            while ($stmt->fetch())
            {
                echo "<tr><td>".htmlspecialchars($keyword)."</td><td>".nl2br(autolink(htmlspecialchars($value,50)))."</td><td>".htmlspecialchars($username)."</td><td>".$uses."</td></tr>";
            }
            ?>
            </tbody>
        </table>
    </div>
</div>
<script type="text/javascript" src="https://cdn.datatables.net/v/bs-3.3.7/jq-2.2.4/dt-1.10.13/datatables.min.js"></script>
<script>
    $(document).ready(function() {
        $('#savedTable').DataTable({
            "iDisplayLength": 50,
            "lengthMenu": [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]]
        });
    });
</script>
</body>
</html>
