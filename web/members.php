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
    <link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/v/bs-3.3.7/jq-2.2.4/dt-1.10.13/datatables.min.css"/>
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
                    <li><a href="members.php">Members</a></li>
                    <li><a href="daily.php">Daily Stats</a></li>
                </ul>
            </div><!-- /.navbar-collapse -->
        </div><!-- /.container-fluid -->
    </nav>
<div id="dataStore">
    <h1>Member Statistics</h1>
    <table class="table table-striped" id="memberTable">
        <thead>
        <tr>
            <th>Username</th>
            <th>Words</th>
            <th>Messages*</th>
            <th>Words/Msg</th>
            <th>Last Seen</th>
        </tr>
        </thead>
        <tfoot>
        <tr>
            <th>Username</th>
            <th>Words</th>
            <th>Messages*</th>
            <th>Words/Msg</th>
            <th>Last Seen</th>
        </tr>
        </tfoot>
        <tbody>
        <?php
        if (isset($_GET['showinactive']))
        {
            $query = $db->query("SELECT * FROM members WHERE server='115332333745340416' ORDER BY username");
        }
        else
        {
            $query = $db->query("SELECT * FROM members WHERE server='115332333745340416' AND active=1 ORDER BY username");
        }
        while ($row = $query->fetch_array())
        {
            $average = ($row['messages'] > 0) ? round($row['words']/$row['messages'],2) : 0;
            $style =  ($row['active']) ? '' : 'color:red';
            echo "<tr style='$style'><td>".$row['username']."</td><td>".$row['words']."</td><td>".$row['messages']."</td><td>$average</td><td>".date('Y-m-d',$row['lastseen'])."</td></tr>";
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
